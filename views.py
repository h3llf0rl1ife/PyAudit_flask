import json
import os.path

from flask import request, render_template, jsonify, Response, redirect, flash
from flask_login import login_required, login_user, current_user, logout_user
from werkzeug.utils import secure_filename
from sqlalchemy.orm import load_only

from PyAudit_flask import app, db, login_manager
from PyAudit_flask import models, forms
from PyAudit_flask import tools as tls

#from settings import json_object


@login_manager.user_loader
def load_user(user_id):
    return models.User.query.get(user_id)


@app.route('/')
@login_required
def index():
    user_profile = current_user.Profile
    if user_profile == "Administrateur":
        return redirect("/evaluation")
    else:
        return redirect("/consultation")


@app.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect("/")

    form = forms.LoginForm()
    if form.validate_on_submit():
        user_id = request.form["UserID"]
        password = request.form["Password"]
        user = models.User.query.filter_by(UserID=user_id, password=password).first()
        
        if user == None:
            return redirect('/login')
        else:
            login_user(user)
            return redirect('/')

    
    return render_template('login.html', form=form)


@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect('/login')


@app.route('/evaluation/', methods=['GET', ])
@login_required
def evaluation():
    if current_user.Profile != "Administrateur":
        return redirect("/")
    
    evaluation_form = forms.EvaluationForm()
    
    contexts = {}
    contexts["sites"] = models.Site.query.all()
    contexts["criterias"] = models.Criteria.query.all()
    contexts["evaluationID"] = tls.getLatestEvaluationID_plusOne()

    return render_template('evaluation.html', contexts=contexts, evaluation_form=evaluation_form)


@app.route('/evaluation/api', methods=['GET', 'POST'])
@login_required
def evaluation_api():
    if current_user.Profile != "Administrateur":
        return redirect("/")

    evaluation_api_form = forms.EvaluationAPIForm()
    evaluation_form = forms.EvaluationForm()

    queries = {}
    queries["Zone"] = tls.getZone
    queries["Unit"] = tls.getUnit
    queries["Location"] = tls.getLocation
    queries["Category"] = tls.getCategory
    queries["EvaluationID"] = tls.getEvaluationID
    queries["Evaluation"] = tls.getEvaluation
    

    if request.method == "GET":
        value = request.args.get("value")
        field = request.args.get("field")

        if None in (value, field):
            # TODO: Add error message and better protection
            return redirect("/")
        
        return jsonify(result=queries[field](value))
    
    else:
        if evaluation_api_form.validate_on_submit():
            field = request.form["field"]
            value = int(request.form["value"])
            
            queries["deleteEvaluation"] = tls.deleteEvaluation

            return jsonify(result=queries[field](value))

        elif evaluation_form.validate_on_submit():
            evaluation_id = tls.getLatestEvaluationID_plusOne()
            user_id = current_user.UserID
            location_id = request.form["LocationID"]
            category_id = request.form["CategoryID"]
            validation = int(request.form["Validation"])
            comment = request.form["Comment"]

            evaluation_entry = models.Evaluation(
                UserID=user_id,
                LocationID=location_id,
                CategoryID=category_id,
                Validation=validation,
                Comment=comment
            )

            db.session.add(evaluation_entry)

            attachments = request.files.getlist("Attachment")
            if len(attachments) > 0:
                evaluation_directory = os.path.join('evaluations', str(evaluation_id))
                file_directory = os.path.join(app.root_path, 'uploads', evaluation_directory)
                
                if not os.path.exists(file_directory):
                    os.makedirs(file_directory)
                
                for attachment in attachments:
                    filename = secure_filename(attachment.filename)
                    attachment.save(os.path.join(file_directory, filename))

                    # Check if mime type exists and add to table if not
                    mime_type = attachment.mimetype
                    attachment_type = models.AttachmentType.query.filter_by(Description=mime_type).first()

                    if attachment_type == None:
                        attachment_type = models.AttachmentType(
                            Description=attachment.mimetype
                        )
                        db.session.add(attachment_type)
                    
                    attachment_entry = models.Attachment(
                        #AttachmentID=filename,
                        Path=os.path.join(evaluation_directory, filename),
                        attachment_type_r=attachment_type,
                        evaluation_r=evaluation_entry
                    )

            db.session.commit()
            flash('Successful')
            return redirect("/evaluation")

        else:
            # TODO: Return form errors
            return redirect("/evaluation")

    # TODO: Return general error
    return redirect("/evaluation")


@app.route('/consultation')
@login_required
def consultation():
    return render_template('consultation.html')


@app.route('/consulation/api')
@login_required
def consultation_api():
    queries = {}
    queries["Zone"] = tls.getZoneByID

    if request.method == "GET":
        value = request.args.get("value")
        field = request.args.get("field")

        if None in (value, field):
            # TODO: Add error message and better protection
            return redirect("/")

    return jsonify(result=queries[field](value))

