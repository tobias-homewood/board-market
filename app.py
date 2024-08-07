# Imports from external libraries
from flask import Flask, render_template, request, redirect, url_for, flash, session, jsonify
from flask_wtf.csrf import CSRFProtect
from flask_login import current_user, LoginManager, login_required 
from flask import Flask, request
from flask_mail import Mail, Message

# Imports from project files
from routes.user_routes import user_routes
from routes.board_routes import board_routes
from models import db, User, Board
from forms import ContactForm
from config import Config, MAPBOX_API_KEY, MAIL_USERNAME

login_manager = LoginManager()
login_manager.login_view = 'user_routes.login'

def create_app():
    print("Creating app...")
    app = Flask(__name__)
    app.register_blueprint(user_routes)
    app.register_blueprint(board_routes)

    CSRFProtect(app)
    login_manager.init_app(app)
    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(int(user_id))
    
    app.config.from_object(Config)
    mail = Mail(app)

    db.init_app(app)

    print("App created successfully.")

    # Makes the user available in all templates
    @app.context_processor
    def inject_user():
        return dict(current_user=current_user)
    
    # Makes the MAPBOX_API_KEY available in all templates
    @app.context_processor
    def inject_mapbox_api_key():
        return dict(MAPBOX_API_KEY=MAPBOX_API_KEY)

    @app.route('/')
    def index():
        user_id = current_user.id if current_user.is_authenticated else None
        return render_template('index.html', path=request.path, user_logged_in=current_user.is_authenticated)

    @app.route('/update_location', methods=['POST'])
    def update_location():
        try:
            data = request.get_json()
            session['location_text'] = data['location_text']
            session['coordinates'] = data['coordinates']
            return jsonify({'message': 'Location updated'}), 200
        except Exception as e:
            print('Error updating location:', str(e))
            print('Request data:', request.data)
            return jsonify({'message': 'Error updating location', 'error': str(e)}), 400

    @app.route('/contact/<int:user_id>', methods=['GET','POST'])
    @login_required
    def contact(user_id):
        user = User.query.get_or_404(user_id)
        board_id = request.args.get('board_id', default=None, type=int)
        board = Board.query.get_or_404(board_id)

        form = ContactForm()
        if form.validate_on_submit():
            msg = Message(
                subject=f"Board Market: Message regarding {board.board_manufacturer} - {board.model}",
                sender=MAIL_USERNAME,
                recipients=[user.email],
                html=f"<h2>Message regarding the board {board.board_manufacturer} - {board.model}</h2>"
                    f"<p>Buyers contact email: <a href='mailto:{current_user.email}'>{current_user.email}</a></p>"
                    f"<p>{form.message.data}</p>"
                    f"<img src='{board.main_photo}' alt='Board Photo'>"   
            )
            mail.send(msg)

            flash('Message sent successfully!', 'success')
            return redirect(url_for('index'))
            

        return render_template('contact.html', user=user, board=board, form=form)

    return app

    

app = create_app()

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)