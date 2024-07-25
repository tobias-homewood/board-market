from flask import Flask, render_template, request, redirect, url_for, flash, session, jsonify
from models import db, User, Board, Message, SearchPreference, Favourites
from forms import UserAddForm, LoginForm, BoardForm, SearchForm
from flask_wtf.csrf import CSRFProtect
from sqlalchemy.exc import IntegrityError
from werkzeug.datastructures import MultiDict
from werkzeug.utils import secure_filename
from sqlalchemy.orm import joinedload
from flask_login import current_user, LoginManager, login_user, logout_user, login_required 
from flask import Flask, request
from google.cloud import storage
import uuid
import math
from math import radians, cos, sin, asin, sqrt
import os
from pprint import pprint
from urllib.parse import urlparse, urljoin
from geoalchemy2 import WKTElement, Geography
from geoalchemy2.functions import ST_DWithin, ST_MakePoint
from sqlalchemy import create_engine, cast
from sqlalchemy.sql import text
from dotenv import load_dotenv

# Set the GOOGLE_APPLICATION_CREDENTIALS environment variable
load_dotenv(dotenv_path='secrets/keys.env')
os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = 'secrets/my_service_account_key.json'
MAPBOX_API_KEY = os.getenv('MAPBOX_API_KEY')

login_manager = LoginManager()
login_manager.login_view = 'login'

def is_postgis_installed(uri):
    engine = create_engine(uri)
    with engine.connect() as connection:
        result = connection.execute(text("SELECT EXISTS(SELECT * FROM pg_extension WHERE extname='postgis');"))
        return result.scalar()

# Usage
print(is_postgis_installed('postgresql://tobias:element@localhost/boardmarket'))

def upload_blob(file_object, destination_blob_name=None):
    """Uploads a file to the bucket."""
    bucket_name = "board-market"  # Update with your bucket name
    storage_client = storage.Client()
    bucket = storage_client.bucket(bucket_name)

    # If destination_blob_name is empty, generate a unique name using a UUID
    if not destination_blob_name:
        destination_blob_name = str(uuid.uuid4())

    blob = bucket.blob(destination_blob_name)

    blob.upload_from_file(file_object)


def download_blob(source_blob_name, destination_file_name):
    """Downloads a blob from the bucket."""
    bucket_name = "board-market"  
    storage_client = storage.Client()
    bucket = storage_client.bucket(bucket_name)
    blob = bucket.blob(source_blob_name)

    blob.download_to_filename(destination_file_name)

def create_app():
    print("Creating app...")
    app = Flask(__name__)
    csrf = CSRFProtect(app)
    login_manager.init_app(app)
    # Initialize the Google Cloud Storage client
    storage_client = storage.Client()
    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(int(user_id))
    
    app.config['WTF_CSRF_TIME_LIMIT'] = 3600  # 1 hour in seconds
    
    app.config['SECRET_KEY'] = 'secret'
    app.config['TEMPLATES_AUTO_RELOAD'] = True

    app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql:///boardmarket'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False 
    app.config['SQLALCHEMY_ECHO'] = False
    app.debug = True
    db.init_app(app)
    print("App created successfully.")

    @app.context_processor
    def inject_user():
        return dict(current_user=current_user)
    
    @app.context_processor
    def inject_mapbox_api_key():
        return dict(MAPBOX_API_KEY=MAPBOX_API_KEY)
    
    def apply_filters(query, form):
        # Print the form data for debugging purposes
        print(f"Form data in apply_filters: {form.data}")
        
        # If both min_price and max_price are provided, filter the query by price
        if form.min_price.data is not None and form.max_price.data is not None:
            min_price = form.min_price.data
            max_price = form.max_price.data
            if min_price > 0:
                query = query.filter(Board.asking_price.between(min_price, max_price))
            else:
                query = query.filter(Board.asking_price <= max_price)

        # If board_manufacturer is provided, filter the query by board_manufacturer
        if form.board_manufacturer.data:
            query = query.filter(Board.board_manufacturer.ilike(f"%{form.board_manufacturer.data}%"))

        # If both min_length and max_length are provided, filter the query by length
        if form.min_length.data is not None and form.max_length.data is not None:
            min_length = form.min_length.data
            max_length = form.max_length.data
            query = query.filter(Board.board_length_total.between(min_length, max_length))

        # If condition is provided, filter the query by condition
        if form.condition.data:
            query = query.filter(Board.condition.ilike(f"%{form.condition.data}%"))

        # If sell_or_rent is provided, filter the query by sell_or_rent
        if form.sell_or_rent.data:
            query = query.filter(Board.sell_or_rent.ilike(f"%{form.sell_or_rent.data}%"))

        # If fin_setup is provided, filter the query by fin_setup
        if form.fin_setup.data:
            query = query.filter(Board.fin_setup.ilike(f"%{form.fin_setup.data}%"))

        # If board_material is provided, filter the query by board_material
        if form.board_material.data:
            query = query.filter(Board.board_material.ilike(f"%{form.board_material.data}%"))

        # If board_location_coordinates is provided, filter the query by board_location_coordinates
        if form.board_location_coordinates.data:
            # Remove square brackets and split the string into lat and lon
            lon, lat = map(float, form.board_location_coordinates.data.strip('[]').split(','))
            print(f"Form coordinates: {lon}, {lat}")  # Print the coordinates from the form
            if form.max_distance.data is not None:
                max_distance = form.max_distance.data
            else:
                max_distance = 50  # Default value if not provided

            # Create a point geometry from the coordinates
            point = ST_MakePoint(lon, lat)

            # Fetch all boards that are within max_distance of the point
            boards = Board.query.filter(
                ST_DWithin(
                    Board.board_location_spatial,
                    cast(point, Geography),
                    max_distance * 1000  # Convert kilometers to meters
                )
            ).all()

            # Convert the list of nearby boards to a list of their IDs
            nearby_board_ids = [board.board_id for board in boards]

            # Filter the query by the IDs of the nearby boards
            query = query.filter(Board.board_id.in_(nearby_board_ids))

        # If delivery_options is provided, filter the query by delivery_options
        if form.delivery_options.data:
            query = query.filter(Board.delivery_options.ilike(f"%{form.delivery_options.data}%"))

        # If model is provided, filter the query by model
        if form.model.data:
            query = query.filter(Board.model.ilike(f"%{form.model.data}%"))

        # If min_width or max_width is provided, filter the query by width
        if form.min_width.data is not None or form.max_width.data is not None:
            min_width = form.min_width.data if form.min_width.data else 0
            max_width = form.max_width.data if form.max_width.data else float('inf')  # Use a very large number if max_width is not provided
            query = query.filter(Board.width_total.between(min_width, max_width))

        # If both min_depth and max_depth are provided, filter the query by depth
        if form.min_depth.data is not None and form.max_depth.data is not None:
            min_depth = float(form.min_depth.data)
            max_depth = float(form.max_depth.data)
            if min_depth >= 0 and max_depth >= min_depth:
                query = query.filter(Board.depth_total.between(min_depth, max_depth))

        # If both min_volume and max_volume are provided, filter the query by volume
        if form.min_volume.data is not None and form.max_volume.data is not None:
            min_volume = form.min_volume.data
            max_volume = form.max_volume.data
            if min_volume >= 0 and max_volume >= min_volume:
                query = query.filter(Board.volume_litres.between(min_volume, max_volume))

        # Return the filtered query
        return query

    # This function converts a fraction to a decimal
    def fraction_to_decimal(fraction):
        if fraction == '':
            return None
        numerator, denominator = map(int, fraction.split('/'))
        return round(numerator / denominator, 10)

    # This function converts feet to inches
    def convert_feet_to_inches(feet):
        if feet is None:
            return 0
        inches = feet * 12
        return inches

    # This function converts inches to feet and inches
    def convert_inches_to_feet(inches):
        feet = inches // 12
        remaining_inches = inches % 12
        return f"{feet}' {remaining_inches}\""

    def convert_decimal_to_fraction(value):
        try:
            value = float(value)
        except ValueError:
            return ''

        numerator = round(value * 16)
        denominator = 16

        if numerator == 0:
            return ''

        # Simplify the fraction
        gcd = math.gcd(numerator, denominator)
        numerator //= gcd
        denominator //= gcd

        return str(numerator) + ('' if denominator == 1 else '/' + str(denominator)) + '"'

    def is_safe_url(target):
        """Check if the URL is safe to redirect to."""
        ref_url = urlparse(request.host_url)
        test_url = urlparse(urljoin(request.host_url, target))
        return test_url.scheme in ('http', 'https') and ref_url.netloc == test_url.netloc
    
    def haversine(lon1, lat1, lon2, lat2):
        """
        Calculate the great circle distance in kilometers between two points 
        on the earth (specified in decimal degrees)
        """
        # convert decimal degrees to radians 
        lon1, lat1, lon2, lat2 = map(radians, [lon1, lat1, lon2, lat2])

        # haversine formula 
        dlon = lon2 - lon1 
        dlat = lat2 - lat1 
        a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
        c = 2 * asin(sqrt(a)) 
        r = 6371 # Radius of earth in kilometers. Use 3956 for miles. Determines return value units.
        return c * r

    @app.template_filter('type')
    def type_filter(value):
        return str(type(value))

    @app.route('/')
    def index():
        user_id = current_user.id if current_user.is_authenticated else None
        return render_template('index.html', path=request.path, user_logged_in=current_user.is_authenticated)

    @app.route('/signup', methods=["GET", "POST"])
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


    @app.route('/login', methods=["GET", "POST"])
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


    @app.route('/logout')
    def logout():
        """Handle user logout."""

        if 'message' in session:
            del session['message']

        logout_user()
        return redirect(url_for('index'))

    @app.route('/user/<username>', methods=['GET'])
    def user_profile(username):
        """Display user's profile."""
        user = User.query.options(joinedload(User.user_boards)).filter_by(username=username).first_or_404()
        form = UserAddForm()

        # The image URL is stored in `user.image_url`
        image_url = user.image_url

        return render_template('users/user_profile.html', user=user, form=form, image_url=image_url)
    

    @app.route('/list_board', methods=['GET', 'POST'])
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
        else:
            print(form.errors)
        return render_template('list_board.html', form=form)

    from flask import session
    @app.route('/search_boards', methods=['GET']) 
    def search_boards(): 
        is_ajax = request.headers.get('X-Requested-With') == 'XMLHttpRequest' 
        print(f"Is AJAX request: {is_ajax}") # Check if the request is identified as AJAX
    # Debugging: Print request headers to verify AJAX header presence
        print("Request headers:", request.headers)
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

        # if not request.args or not form.validate():
        #     # Populate the form with session data
        #     form.min_length.data = session.get('min_length')
        #     form.max_length.data = session.get('max_length')
        #     form.min_price.data = session.get('min_price')
        #     form.max_price.data = session.get('max_price')
        #     form.min_width.data = session.get('min_width')
        #     form.max_width.data = session.get('max_width')
        #     form.min_depth.data = session.get('min_depth')
        #     form.max_depth.data = session.get('max_depth')
        #     form.min_volume.data = session.get('min_volume')
        #     form.max_volume.data = session.get('max_volume')
        #     form.sell_or_rent.data = session.get('sell_or_rent')
        #     form.board_location_text.data = session.get('board_location_text')
        #     form.board_location_coordinates.data = session.get('board_location_coordinates')
        #     form.board_manufacturer.data = session.get('board_manufacturer')
        #     form.model.data = session.get('model')
        #     form.condition.data = session.get('condition')
        #     form.delivery_options.data = session.get('delivery_options')
        #     form.fin_setup.data = session.get('fin_setup')
        #     form.board_material.data = session.get('board_material')
        # else:
        query = apply_filters(query, form)
        #     # Update session with form data
        #     session['min_length'] = form.min_length.data
        #     session['max_length'] = form.max_length.data
        #     session['min_price'] = form.min_price.data
        #     session['max_price'] = form.max_price.data
        #     session['min_width'] = form.min_width.data
        #     session['max_width'] = form.max_width.data
        #     session['min_depth'] = form.min_depth.data
        #     session['max_depth'] = form.max_depth.data
        #     session['min_volume'] = form.min_volume.data
        #     session['max_volume'] = form.max_volume.data
        #     session['sell_or_rent'] = form.sell_or_rent.data
        #     session['board_location_text'] = form.board_location_text.data
        #     session['board_location_coordinates'] = form.board_location_coordinates.data
        #     session['board_manufacturer'] = form.board_manufacturer.data
        #     session['model'] = form.model.data
        #     session['condition'] = form.condition.data
        #     session['delivery_options'] = form.delivery_options.data
        #     session['fin_setup'] = form.fin_setup.data
        #     session['board_material'] = form.board_material.data

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
            print("AJAX response data:", jsonify({'boards': boards_data}).get_data(as_text=True))
            return jsonify({'boards': boards_data, 'user_id': current_user.id if current_user.is_authenticated else None, 'favourites': [favourite.board_id for favourite in favourites]})

        # For non-AJAX requests, render the template as before
        return render_template('search_boards.html', form=form, boards=boards, convert_inches_to_feet=convert_inches_to_feet, convert_decimal_to_fraction=convert_decimal_to_fraction)

    @app.route('/board_profile/<int:board_id>', methods=['GET'])
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
        
         # Print the URLs of the extra photos
        if board.extra_photos:
            print("Extra photos:")
            for photo in board.extra_photos:
                print(photo)

        return render_template('board_profile.html', board=board, convert_decimal_to_fraction=convert_decimal_to_fraction, form=form)
    
    @app.route('/delete_board/<int:board_id>', methods=['POST'])
    def delete_board(board_id):
        is_ajax = request.headers.get('X-Requested-With') == 'XMLHttpRequest' 
        print(f"Is AJAX request: {is_ajax}")

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
            print("AJAX response data:", response.get_data(as_text=True))
            return response

        flash(message)
        # return render_template('index.html', user_logged_in=current_user.is_authenticated)
        return redirect(url_for('index'))


    @app.route('/toggle_favourite/<int:board_id>', methods=['POST'])
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
    
    from flask import session

    @app.route('/update_location', methods=['POST'])
    def update_location():
        try:
            data = request.get_json()
            session['location_text'] = data['location_text']
            session['coordinates'] = data['coordinates']
            print('Updated location:', data['location_text'])
            print('Updated coordinates:', data['coordinates'])
            return jsonify({'message': 'Location updated'}), 200
        except Exception as e:
            print('Error updating location:', str(e))
            print('Request data:', request.data)
            return jsonify({'message': 'Error updating location', 'error': str(e)}), 400

    
    return app

    

app = create_app()

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)