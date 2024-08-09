# Importes from external libraries
from flask import render_template, request, redirect, url_for, flash, session, Blueprint
from sqlalchemy.exc import IntegrityError
from werkzeug.utils import secure_filename
from sqlalchemy.orm import joinedload
from flask_login import login_user, logout_user 
from urllib.parse import urlparse, urljoin
from flask_login import current_user, login_required 

# Imports from project files
from models import db, User
from forms import UserAddForm, LoginForm, UserEditForm, UserProfilePhotoForm
from cloud_storage import *

user_routes = Blueprint('user_routes', __name__, template_folder='templates')

def is_safe_url(target):
        """Check if the URL is safe to redirect to."""
        ref_url = urlparse(request.host_url)
        test_url = urlparse(urljoin(request.host_url, target))
        return test_url.scheme in ('http', 'https') and ref_url.netloc == test_url.netloc

@user_routes.route('/signup', methods=["GET", "POST"])
def signup():
    """Handle user signup."""

    form = UserAddForm()

    if form.validate_on_submit():
        try:
            # Get the file from the form
            image_file = request.files['image_file']
            filename = secure_filename(image_file.filename)

            # Upload the file to Google Cloud Storage
            upload_blob(image_file, filename)

            # Get the URL of the uploaded file
            image_url = f"https://storage.googleapis.com/board-market/{filename}"

            user = User.signup(
                username=form.username.data,
                password=form.password.data,
                email=form.email.data,
                image_url=image_url,
                bio=form.bio.data
            )

            db.session.commit()

        except IntegrityError:
            flash("Username already taken", 'danger')
            return render_template('users/signup.html', form=form)

        login_user(user)  # Use flask_login's login_user function

        return redirect("/")

    else:
        print("Error while submitting form:")
        print(form.errors)  # print form errors if validation fails

    return render_template('users/signup.html', form=form)


@user_routes.route('/login', methods=["GET", "POST"])
def login():
    """Handle user login."""

    form = LoginForm()
    message = request.args.get('message', default=None, type=str)
    next_page = request.args.get('next', default=None, type=str)

    if message:
        session['message'] = message

    if form.validate_on_submit():
        user = User.authenticate(form.username.data,
                                form.password.data)

        if user:
            login_user(user)  # Use flask_login's login_user function
            flash(f"Hello, {user.username}!", "success")
            if next_page and is_safe_url(next_page):
                return redirect(next_page)
            return redirect(url_for('index'))

        flash("Invalid credentials.", 'danger')

    else:
        if 'message' in session:
            flash(session['message'], 'info')
            del session['message']

    return render_template('users/login.html', form=form)


@user_routes.route('/logout')
def logout():
    """Handle user logout."""

    if 'message' in session:
        del session['message']

    logout_user()
    return redirect(url_for('index'))

@user_routes.route('/user/<username>', methods=['GET'])
def user_profile(username):
    """Display user's profile."""
    user = User.query.options(joinedload(User.user_boards)).filter_by(username=username).first_or_404()
    form = UserAddForm()

    return render_template('users/user_profile.html', user=user, form=form)


@user_routes.route('/edit_profile', methods=['GET', 'POST'])
@login_required
def edit_profile():
    form = UserEditForm(obj=current_user)

    if request.method == 'GET':
        # fill in the form with the current user's data
        form.username.data = current_user.username
        form.email.data = current_user.email
        form.image_file.data = current_user.image_url
        form.bio.data = current_user.bio
        return render_template('users/edit_profile.html', form=form)
    
    if not form.validate_on_submit():
        flash('Invalid submission:', 'danger')
        for field, errors in form.errors.items():
            for error in errors:
                flash(f"- {field}: {error}", 'danger')
        return render_template('users/edit_profile.html', form=form)

    # Check if the user is updating their bio only, the email and password changes are password protected
    if not form.new_password.data and not form.confirm_password.data and form.email.data == current_user.email:
        current_user.bio = form.bio.data
        db.session.commit()
        flash('Profile updated successfully!', 'success')
        return redirect(url_for('user_routes.user_profile', username=current_user.username))
    
    # Check if the user is updating their email address without providing the current password
    if current_user.email != form.email.data and not form.password.data:
        flash('You need to provide the current password to change the email address.', 'danger')
        return render_template('users/edit_profile.html', form=form)

    # in any other case, check if the user provided the correct password
    user = User.authenticate(current_user.username, form.password.data)

    # Didn't specify the right password
    if not user:
        flash('Invalid password.', 'danger')
        return render_template('users/edit_profile.html', form=form)
    
    
    if form.new_password.data != form.confirm_password.data:
        flash('Passwords do not match.', 'danger')
        return render_template('users/edit_profile.html', form=form)
    
    # update user
    User.update(
        user=user,
        email=form.email.data,
        password=form.new_password.data,
        bio=form.bio.data
    )
    flash('Profile updated successfully!', 'success')
    return redirect(url_for('user_routes.user_profile', username=current_user.username))


@user_routes.route('/change_pfp', methods=['POST', 'GET'])
@login_required
def change_pfp():
    form = UserProfilePhotoForm()
    if form.validate_on_submit():
        # Get the file from the form
        image_file = request.files['image_file']
        filename = secure_filename(image_file.filename)

        # Upload the file to Google Cloud Storage
        upload_blob(image_file, filename)


        # Get the URL of the uploaded file
        image_url = f"https://storage.googleapis.com/board-market/{filename}"

        user = User.query.get(current_user.id)
        
        # update user
        user.image_url = image_url
        db.session.commit()
        flash('Profile updated successfully!', 'success')
        return redirect(url_for('user_routes.user_profile', username=current_user.username)) 
    
    elif form.errors:
        flash('Invalid submission:', 'danger')
        for field, errors in form.errors.items():
            for error in errors:
                flash(f"- {field}: {error}", 'danger')
    
    return render_template('users/change_pfp.html', form=form)
