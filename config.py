from dotenv import load_dotenv
import os

load_dotenv(dotenv_path='secrets/keys.env')
os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = 'secrets/my_service_account_key.json'
MAPBOX_API_KEY = os.getenv('MAPBOX_API_KEY')
MAIL_USERNAME = os.getenv('MAIL_USERNAME')

class Config:
    WTF_CSRF_TIME_LIMIT = 3600  # 1 hour in seconds
    SECRET_KEY = os.getenv('SECRET_KEY')
    TEMPLATES_AUTO_RELOAD = True
    SQLALCHEMY_DATABASE_URI = os.getenv('DB_URI')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ECHO = False
    DEBUG = True
    MAIL_SERVER = 'smtp.gmail.com'
    MAIL_PORT = os.getenv('MAIL_PORT')
    MAIL_USERNAME = MAIL_USERNAME
    MAIL_PASSWORD = os.getenv('MAIL_PASSWORD')
    MAIL_USE_TLS = True
    MAIL_USE_SSL = False