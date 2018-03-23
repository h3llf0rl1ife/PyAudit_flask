from flask_wtf import FlaskForm
from flask_wtf.file import FileField, FileRequired
from wtforms import StringField, IntegerField, TextAreaField, DateTimeField
from wtforms.validators import DataRequired


class LoginForm(FlaskForm):
    UserID = StringField('UserID', validators=[DataRequired()])
    Password = StringField('Password', validators=[DataRequired()])


# TODO: Add evaluation form
class EvaluationForm(FlaskForm):
    #EvaluationID = IntegerField('EvaluationID', validators=[DataRequired()])
    #UserID = StringField('UserID', validators=[DataRequired()])
    AreaID = IntegerField('AreaID', validators=[DataRequired()])
    CategoryID = IntegerField('CategoryID', validators=[DataRequired()])
    #Date = DateTimeField
    Validation = StringField('Validation', validators=[DataRequired()])
    Comment = TextAreaField('Comment')
    #Attachment = FileField('Attachment')


class EvaluationAPIForm(FlaskForm):
    field = StringField('field', validators=[DataRequired()])
    value = StringField('value', validators=[DataRequired()])
