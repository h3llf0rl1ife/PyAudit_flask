from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_wtf.csrf import CSRFProtect
from flask_login import LoginManager

import os


app = Flask(__name__)

# File upload config
UPLOAD_FOLDER = os.path.join(app.instance_path, "static/uploads")
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# SQLAlchemy config
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://user1:user@@@GSTOCK/DB_AUDIT5S'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)


# FlaskWTF config
app.config.update(dict(
    SECRET_KEY="cI7nNwbSWkjBRs7pDs0UpGhze0X5PsO1ZnDvI7fdeueh4SGZ6zraJ/+zT/99tjSSu/DquxVYmgYN7HbLKb81Tg==",
    WTF_CSRF_SECRET_KEY="GMdRTbmAwQPWgEcJYMAdIi5AUD3HsatvvUOmLEPRawjB8oV4bvCZmihY3XfIKaS4H0AYMlaMpIKwU0CQt8xFEw=="
))

csrf = CSRFProtect(app)

# Flask_login config
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = "/login"

import PyAudit_flask.views
import PyAudit_flask.models
