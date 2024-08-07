from flask import render_template, request, redirect, url_for, flash, session, Blueprint
from models import db, User
from forms import UserAddForm, LoginForm, UserEditForm
from sqlalchemy.exc import IntegrityError
from werkzeug.utils import secure_filename
from sqlalchemy.orm import joinedload
from flask_login import login_user, logout_user 
from urllib.parse import urlparse, urljoin
from flask_login import current_user, login_required 
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
        print("Form validated")  # Debugging line
        try:
            # Get the file from the form
            image_file = request.files['image_file']
            filename = secure_filename(image_file.filename)
            print(f"Image file: {filename}")  # Debugging line

            # Upload the file to Google Cloud Storage
            upload_blob(image_file, filename)

            # Get the URL of the uploaded file
            image_url = f"https://storage.googleapis.com/board-market/{filename}"
            print(f"Image URL: {image_url}")  # Debugging line

            user = User.signup(
                username=form.username.data,
                password=form.password.data,
                email=form.email.data,
                image_url=image_url,
                bio=form.bio.data
            )
            print("User signed up")  # Debugging line

            db.session.commit()
            print("Database commit successful")  # Debugging line

        except IntegrityError:
            print("IntegrityError occurred")  # Debugging line
            flash("Username already taken", 'danger')
            return render_template('users/signup.html', form=form)

        login_user(user)  # Use flask_login's login_user function
        print("User logged in")  # Debugging line

        return redirect("/")

    else:
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
            print(f"next_page: {next_page}")  # Debug print
            print(f"is_safe_url(next_page): {is_safe_url(next_page)}")  # Debug print
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


    if form.validate_on_submit():
        # Authenticate user
        user = User.authenticate(current_user.username, form.password.data)

        if user:
            # update user
            User.update(
                user=user,
                email=form.email.data,
                password=form.new_password.data,
                image_url=form.image_file.data,
                bio=form.bio.data
            )
            flash('Profile updated successfully!', 'success')
            return redirect(url_for('user_routes.user_profile', username=current_user.username))
        else:
            flash('Invalid password.', 'danger')
    elif form.errors:
        print(form.errors)
        flash('Invalid submission:', 'danger')
        for field, errors in form.errors.items():
            for error in errors:
                flash(f"- {field}: {error}", 'danger')
    return render_template('users/edit_profile.html', form=form)


@user_routes.route('/change_pfp', methods=['POST', 'GET'])
@login_required
def change_pfp():
    form = UserEditForm(obj=current_user)
    if form.validate_on_submit():
        # Get the file from the form
        image_file = request.files['image_file']
        filename = secure_filename(image_file.filename)
        print(f"Image file: {filename}")

        # Upload the file to Google Cloud Storage
        upload_blob(image_file, filename)


        # Get the URL of the uploaded file
        image_url = f"https://storage.googleapis.com/board-market/{filename}"
        print(f"Image URL: {image_url}")

        user = User.query.get(current_user.id)
        
        # update user
        User.update(
            user=user,
            email=form.email.data,
            password=form.new_password.data,
            image_url=image_url,
            bio=form.bio.data
        )
        flash('Profile updated successfully!', 'success')
        return redirect(url_for('user_routes.user_profile', username=current_user.username)) 
    
    return render_template('users/change_pfp.html', form=form)
