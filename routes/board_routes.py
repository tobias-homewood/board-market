from flask import Blueprint, render_template, request, redirect, url_for, flash, session, jsonify
from werkzeug.datastructures import MultiDict
from werkzeug.utils import secure_filename
from flask_login import current_user, login_required 
from geoalchemy2 import WKTElement

from models import db, Board, Favourites
from forms import BoardForm, SearchForm
from utils import convert_decimal_to_fraction, convert_inches_to_feet, fraction_to_decimal, convert_decimal_to_sixteenth
from cloud_storage import upload_blob
from search_filters import apply_filters
board_routes = Blueprint('board_routes', __name__, template_folder='templates/boards')

@board_routes.route('/list_board', methods=['GET', 'POST'])
@login_required
def list_board():
    form = BoardForm()
    form.board_location_text.data = session.get('location_text', 'Default Location')
    form.board_location_coordinates.data = session.get('coordinates', 'Default Coordinates')

    if form.validate_on_submit():
        width_fraction_decimal = fraction_to_decimal(form.width_fraction.data)
        depth_fraction_decimal = fraction_to_decimal(form.depth_fraction.data)
        board_length_total = int(form.board_length_feet.data) * 12 + int(form.board_length_inches.data)
        # Calculate total width and depth
        width_total = float(form.width_integer.data) + (width_fraction_decimal if width_fraction_decimal else 0)
        depth_total = float(form.depth_integer.data) + (depth_fraction_decimal if depth_fraction_decimal else 0)
        
        # Get the main photo from the form
        main_photo_file = request.files['main_photo']
        main_photo_filename = secure_filename(main_photo_file.filename)
        # Upload the main photo to Google Cloud Storage
        upload_blob(main_photo_file, main_photo_filename)
        # Get the URL of the uploaded main photo
        main_photo_url = f"https://storage.googleapis.com/board-market/{main_photo_filename}"
        
        # Get the extra photos from the form
        extra_photo_files = request.files.getlist('extra_photos')
        extra_photo_urls = []
        for extra_photo_file in extra_photo_files:
            extra_photo_filename = secure_filename(extra_photo_file.filename)
            # Upload the extra photo to Google Cloud Storage
            upload_blob(extra_photo_file, extra_photo_filename)
            # Get the URL of the uploaded extra photo
            extra_photo_url = f"https://storage.googleapis.com/board-market/{extra_photo_filename}"
            extra_photo_urls.append(extra_photo_url)
        
        # Remove square brackets and split the string into lat and lon
        lon, lat = map(float, form.board_location_coordinates.data)

        # Create a new board with the form data
        new_board = Board(
            user_id= current_user.id,
            asking_price=form.asking_price.data,
            board_manufacturer=form.board_manufacturer.data,
            board_length_feet=form.board_length_feet.data,
            board_length_inches=form.board_length_inches.data,
            board_length_total=board_length_total,
            condition=form.condition.data,
            sell_or_rent=form.sell_or_rent.data,
            board_location_text=form.board_location_text.data,
            board_location_coordinates=form.board_location_coordinates.data,
            board_location_spatial=WKTElement(f'POINT({lon} {lat})', srid=4326),
            delivery_options=form.delivery_options.data,
            model=form.model.data,
            width_integer=form.width_integer.data,
            width_fraction=width_fraction_decimal,
            width_total=width_total,  # Add total width to the board
            depth_integer=form.depth_integer.data,
            depth_fraction=depth_fraction_decimal,
            depth_total=depth_total,  # Add total depth to the board
            volume_litres=form.volume_litres.data,
            fin_setup=form.fin_setup.data,  
            board_material=form.board_material.data,  
            extra_details=form.extra_details.data,
            main_photo=main_photo_url,  # Add main_photo URL to the board
            extra_photos=extra_photo_urls  # Add extra_photos URLs to the board
        )
        # Add the new board to the database session and commit it
        db.session.add(new_board)
        db.session.commit()
        flash('Board listed successfully!', 'success')
        return redirect(url_for('index'))
    elif form.errors:
        print("Error while submitting form:")
        print(form.errors)
        flash('Invalid submission:', 'danger')
        for field, errors in form.errors.items():
            for error in errors:
                flash(f"- {field}: {error}", 'danger')
    return render_template('boards/list_board.html', form=form)

@board_routes.route('/search_boards', methods=['GET']) 
def search_boards(): 
    is_ajax = request.headers.get('X-Requested-With') == 'XMLHttpRequest' 
    # Preprocess request arguments
    args = {k: v for k, v in request.args.items() if v != 'None'}

    # Create a MultiDict with preprocessed arguments
    formdata = MultiDict(args)

    # Create form with preprocessed arguments
    form = SearchForm(formdata=formdata)

    # Convert 'None' string to None
    for field in form:
        if field.data == 'None':
            field.data = None

    query = Board.query  # start with a base query

    query = apply_filters(query, form)

    boards = query.all()  # execute the query
    
    # Check if the user is authenticated before querying the user's favourites
    if current_user.is_authenticated:
        favourites = Favourites.query.filter_by(user_id=current_user.id).all()
    else:
        favourites = []

    if request.args and not form.validate():
        flash('Invalid form data...', 'error')
        print(form.errors)

    # For AJAX requests, return JSON
    if is_ajax:
        boards_data = [
            {
                'board_id': board.board_id,
                'user_id': board.user_id,
                'username': board.user.username,
                'asking_price': str(board.asking_price),  # Convert DECIMAL to string for JSON serialization
                'board_manufacturer': board.board_manufacturer,
                'board_length_feet': board.board_length_feet,
                'board_length_inches': board.board_length_inches,
                'board_length_total': board.board_length_total,
                'condition': board.condition,
                'sell_or_rent': board.sell_or_rent,
                'board_location_text': board.board_location_text,
                'board_location_coordinates': board.board_location_coordinates,
                # 'board_location_spatial': board.board_location_spatial,  # Spatial data might need special handling
                'delivery_options': board.delivery_options,
                'model': board.model,
                'width_integer': board.width_integer,
                'width_fraction': convert_decimal_to_fraction(board.width_total - board.width_integer),
                'width_total': board.width_total,
                'depth_integer': board.depth_integer,
                'depth_fraction': convert_decimal_to_fraction(board.depth_total - board.depth_integer),
                'depth_total': board.depth_total,
                'volume_litres': str(board.volume_litres),  # Convert DECIMAL to string for JSON serialization
                'fin_setup': board.fin_setup,
                'board_material': board.board_material,
                'extra_details': board.extra_details,
                'main_photo': board.main_photo,
                'extra_photos': board.extra_photos,
                'created_at': board.created_at.isoformat(),  # Convert TIMESTAMP to ISO format string
                'updated_at': board.updated_at.isoformat()  # Convert TIMESTAMP to ISO format string
            } for board in boards
        ]
        return jsonify({'boards': boards_data, 'user_id': current_user.id if current_user.is_authenticated else None, 'favourites': [favourite.board_id for favourite in favourites]})

    # For non-AJAX requests, render the template as before
    return render_template('boards/search_boards.html', form=form, boards=boards, convert_inches_to_feet=convert_inches_to_feet, convert_decimal_to_fraction=convert_decimal_to_fraction)

@board_routes.route('/board_profile/<int:board_id>', methods=['GET'])
def board_profile(board_id):
    # Preprocess request arguments
    args = {k: v for k, v in request.args.items() if v != 'None'}

    # Create a MultiDict with preprocessed arguments
    formdata = MultiDict(args)

    # Create form with preprocessed arguments
    form = SearchForm(formdata=formdata)

    # Convert 'None' string to None
    for field in form:
        if field.data == 'None':
            field.data = None

    board = Board.query.get(board_id)
    if board is None:
        flash('Board not found.', 'error')
        return redirect(url_for('index'))
    
    # filter the extra photos that don't specify a file
    board.extra_photos = [photo for photo in board.extra_photos if not photo.endswith('/')]
            

    return render_template('boards/board_profile.html', board=board, convert_decimal_to_fraction=convert_decimal_to_fraction, form=form)

@board_routes.route('/delete_board/<int:board_id>', methods=['POST'])
def delete_board(board_id):
    is_ajax = request.headers.get('X-Requested-With') == 'XMLHttpRequest' 
    board = Board.query.get(board_id)

    if board:
        db.session.delete(board)
        db.session.commit()
        status = 'success'
        message = 'Board deleted successfully.'
    else:
        status = 'error'
        message = 'Board not found.'

    if is_ajax:
        response = jsonify({'status': status, 'message': message})
        return response

    flash(message)
    return redirect(url_for('index'))


@board_routes.route('/toggle_favourite/<int:board_id>', methods=['POST'])
@login_required
def toggle_favourite(board_id):
    board = Board.query.get_or_404(board_id)
    if board in current_user.favourite_boards:
        current_user.favourite_boards.remove(board)
        action = 'removed'
    else:
        current_user.favourite_boards.append(board)
        action = 'added'
    db.session.commit()
    return jsonify(success=True, action=action)


@board_routes.route('/edit_board/<int:board_id>', methods=['GET', 'POST'])
@login_required
def edit_board(board_id):
    board = Board.query.get_or_404(board_id)

    form = BoardForm()
    form.board_location_text.data = session.get('location_text', 'Default Location')
    form.board_location_coordinates.data = session.get('coordinates', 'Default Coordinates')

    if form.validate_on_submit():
        width_fraction_decimal = fraction_to_decimal(form.width_fraction.data)
        depth_fraction_decimal = fraction_to_decimal(form.depth_fraction.data)
        board_length_total = int(form.board_length_feet.data) * 12 + int(form.board_length_inches.data)
        # Calculate total width and depth
        width_total = float(form.width_integer.data) + (width_fraction_decimal if width_fraction_decimal else 0)
        depth_total = float(form.depth_integer.data) + (depth_fraction_decimal if depth_fraction_decimal else 0)
        
        # Get the main photo from the form
        main_photo_file = request.files['main_photo']
        main_photo_filename = secure_filename(main_photo_file.filename)
        # Upload the main photo to Google Cloud Storage
        upload_blob(main_photo_file, main_photo_filename)
        # Get the URL of the uploaded main photo
        main_photo_url = f"https://storage.googleapis.com/board-market/{main_photo_filename}"
        
        # Get the extra photos from the form
        extra_photo_files = request.files.getlist('extra_photos')
        extra_photo_urls = []
        for extra_photo_file in extra_photo_files:
            extra_photo_filename = secure_filename(extra_photo_file.filename)
            # Upload the extra photo to Google Cloud Storage
            upload_blob(extra_photo_file, extra_photo_filename)
            # Get the URL of the uploaded extra photo
            extra_photo_url = f"https://storage.googleapis.com/board-market/{extra_photo_filename}"
            extra_photo_urls.append(extra_photo_url)
        
        # Remove square brackets and split the string into lat and lon
        lon, lat = map(float, form.board_location_coordinates.data)

        # Update the board's attributes with the form data
        board.user_id = current_user.id
        board.asking_price = form.asking_price.data
        board.board_manufacturer = form.board_manufacturer.data
        board.board_length_feet = form.board_length_feet.data
        board.board_length_inches = form.board_length_inches.data
        board.board_length_total = board_length_total
        board.condition = form.condition.data
        board.sell_or_rent = form.sell_or_rent.data
        board.board_location_text = form.board_location_text.data
        board.board_location_coordinates = form.board_location_coordinates.data
        board.board_location_spatial = WKTElement(f'POINT({lon} {lat})', srid=4326)
        board.delivery_options = form.delivery_options.data
        board.model = form.model.data
        board.width_integer = form.width_integer.data
        board.width_fraction = width_fraction_decimal
        board.width_total = width_total  # Add total width to the board
        board.depth_integer = form.depth_integer.data
        board.depth_fraction = depth_fraction_decimal
        board.depth_total = depth_total  # Add total depth to the board
        board.volume_litres = form.volume_litres.data
        board.fin_setup = form.fin_setup.data
        board.board_material = form.board_material.data
        board.extra_details = form.extra_details.data
        board.main_photo = main_photo_url  # Add main_photo URL to the board
        board.extra_photos = extra_photo_urls  # Add extra_photos URLs to the board

        db.session.commit()  # Commit the changes to the database
        flash('Board updated successfully!', 'success')
        return redirect(url_for('index'))
    else:
        form = BoardForm(obj=board)

        # fix units in width, depth inches, convert to fractions
        form.width_fraction.data = convert_decimal_to_sixteenth(board.width_fraction)
        form.depth_fraction.data = convert_decimal_to_sixteenth(board.depth_fraction)

        # filter extra photos that don't specify a file
        form.extra_photos.data = [photo for photo in board.extra_photos if not photo.endswith('/')]

        return render_template('boards/edit_board.html', form=form, board=board)
