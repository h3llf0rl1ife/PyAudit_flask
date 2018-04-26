import json
import os.path
from flask import request, render_template, jsonify, redirect, flash
from flask_login import login_required, login_user, current_user, logout_user
from werkzeug.utils import secure_filename

from PyAudit_flask import app, db, login_manager
from PyAudit_flask import models, forms
from PyAudit_flask import tools as tls


@login_manager.user_loader
def load_user(user_id):
    return models.User.query.get(user_id)


@app.route('/')
@login_required
def index():
    user_profile = current_user.Profile
    if user_profile == "Administrateur":
        return redirect("/evaluation")

    return redirect("/dashboard")


@app.route('/login/', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect("/")

    form = forms.LoginForm()
    if form.validate_on_submit():
        user_id = request.form["UserID"]
        password = request.form["Password"]
        user = models.User.query.filter_by(UserID=user_id, Password=password).first()

        if user is None:
            flash("Identifiant ou mot de passe incorrect. Veuillez réessayer.", "error")
            return redirect('/login')

        login_user(user)
        return redirect('/')

    return render_template('login.html', form=form)


@app.route('/logout/')
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
    queries["LocationType"] = tls.getLocationType
    queries["Location"] = tls.getLocation
    queries["Category"] = tls.getCategory

    if request.method == "GET":
        value = request.args.get("value")
        field = request.args.get("field")

        if None in (value, field):
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
                UserID=user_id, LocationID=location_id, CategoryID=category_id,
                Validation=validation, Comment=comment)

            db.session.add(evaluation_entry)

            attachments = request.files.getlist("Attachment")
            if len(attachments) > 0:
                evaluation_directory = os.path.join('evaluations', str(evaluation_id))
                file_directory = os.path.join(app.root_path, 'static/uploads', evaluation_directory)

                if not os.path.exists(file_directory):
                    os.makedirs(file_directory)

                for attachment in attachments:
                    filename = secure_filename(attachment.filename)
                    mime_type = attachment.mimetype
                    attachment_type = models.AttachmentType.query.filter_by(Description=mime_type).first()

                    if attachment_type != None:
                        attachment.save(os.path.join(file_directory, filename))
                        attachment_entry = models.Attachment(
                            Path=os.path.join(evaluation_directory, filename),
                            attachment_type_r=attachment_type,
                            evaluation_r=evaluation_entry
                        )

            db.session.commit()
            return redirect("/evaluation")

        else:
            return redirect("/evaluation")

    return redirect("/evaluation")


@app.route('/dashboard/')
@login_required
def dashboard():
    zones = models.Zone.query.all()

    contexts = {}
    contexts["showAllZones"] = True
    contexts["sites"] = models.Site.query.all()

    if current_user.Profile not in ("Administrateur", "Top_managment"):
        contexts["showAllZones"] = False
        zones = models.Zone.query.filter_by(UserID=current_user.UserID).all()

    contexts["Zones"] = [{"ZoneID": zone.ZoneID, "ZoneName": zone.ZoneName, "Site": zone.site_r.SiteName} for zone in zones]

    return render_template('dashboard.html', contexts=contexts)


@app.route('/dashboard/api', methods=['GET', ])
@login_required
def dashboard_api():
    queries = {}
    queries["ZoneChart"] = tls.getZoneByID
    queries["LineChartData"] = tls.getLineChartData
    queries["PieChartData"] = tls.getPieChartData
    queries["Zone"] = tls.getZone
    queries["Unit"] = tls.getUnit
    queries["LocationType"] = tls.getLocationType
    queries["Location"] = tls.getLocation

    if request.method == "GET":
        value = request.args.get("value")
        field = request.args.get("field")

        if None in (value, field):
            return redirect("/")

    return jsonify(result=queries[field](value))


@app.route('/consultation/')
@login_required
def consultation():
    if current_user.Profile not in ("Administrateur", "Responsable_zone"):
        return redirect("/")
    contexts = {}
    contexts["sites"] = models.Site.query.all()
    contexts["criterias"] = models.Criteria.query.all()

    if current_user.Profile == "Responsable_zone":
        contexts["sites"] = [zone.site_r for zone in current_user.user_zone]

    return render_template('consultation.html', contexts=contexts)


@app.route('/consultation/api', methods=['GET', 'POST'])
@login_required
def consultation_api():
    if current_user.Profile not in ("Administrateur", "Responsable_zone"):
        return redirect("/")

    queries = {}
    queries["Zone"] = tls.getZone
    queries["Unit"] = tls.getUnit
    queries["LocationType"] = tls.getLocationType
    queries["Location"] = tls.getLocation
    queries["Category"] = tls.getCategory
    queries["TableData"] = tls.getTableData
    queries["UpdateData"] = tls.updateData
    queries["UpdateAttachment"] = tls.updateAttachment
    queries["DeleteData"] = tls.deleteEvaluation

    if request.method == "GET":
        value = request.args.get("value")
        field = request.args.get("field")

        if None in (value, field):
            return redirect("/")

    elif request.method == "POST":
        field = request.form["field"]
        value = ""

        if field == "UpdateAttachment":
            edit_id = request.form["edit_id"]
            value = request.files.getlist("value")
            deleted = request.form["deleted"]

            return jsonify(result=queries[field](value, edit_id, current_user, deleted.replace(' ', '').split(',')))

        elif field == "UpdateData":
            edit_id = request.form["edit_id"]
            value = json.loads(request.form["value"])

            return jsonify(result=queries[field](value, edit_id, current_user))

        elif field == "DeleteData":
            value = request.form["value"]
            return jsonify(result=queries[field](value, current_user))

    return jsonify(result=queries[field](value))