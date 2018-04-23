# Functions needed for views or other

import os
import json
import datetime
import dateparser
import psycopg2
from werkzeug.utils import secure_filename
from sqlalchemy import and_, func
from flask_login import current_user
from PyAudit_flask import app, db
from PyAudit_flask import models


def getLatestEvaluationID_plusOne():
    evaluation = models.Evaluation.query.order_by(models.Evaluation.EvaluationID.desc()).first()
    return 1 if evaluation == None else evaluation.EvaluationID + 1


def getZone(value):
    if value not in (None, ""):
        if current_user.Profile == "Responsable_zone":
            zones = models.Zone.query.filter_by(SiteID=value, user_r=current_user).all()
        else:
            zones = models.Zone.query.filter_by(SiteID=value).all()
        result = [{"ZoneID": zone.ZoneID, "ZoneName": zone.ZoneName} for zone in zones]
    else:
        result = []
    return result 
    

def getUnit(value):
    if value not in (None, ""):
        units = models.Unit.query.filter_by(ZoneID=value).all()
        result = [{"UnitID": unit.UnitID, "UnitName": unit.UnitName} for unit in units]
    else:
        result = []
    return result


def getLocationType(value):
    if value not in (None, ""):
        locations = models.Location.query.filter_by(UnitID=value).all()
        location_types = [location.location_type_r for location in locations]
        location_types = list(set(location_types))
        result = [{"LocationTypeID": location_type.LocationTypeID, "Description": location_type.Description} for location_type in location_types]
    else:
        result = []
    return result


def getLocation(value):
    value = json.loads(value)
    if value["UnitID"] not in (None, "") and value["LocationTypeID"] not in (None, ""):
        locations = models.Location.query.filter_by(UnitID=int(value["UnitID"]), LocationTypeID=int(value["LocationTypeID"])).all()
        result = [{"LocationID": location.LocationID, "LocationName": location.LocationName} for location in locations]
    else:
        result = []
    return result
    


def getCategory(value):
    if value not in (None, ""):
        categories = models.Category.query.filter_by(CriteriaID=value).all()
        result = [{"CategoryID": category.CategoryID, "Description": category.Description} for category in categories]
    else:
        result = []
    return result


def getEvaluationID(value):
    evaluationIDs = db.session.query(models.Evaluation.EvaluationID).all()
    return sorted([evaluationID[0] for evaluationID in evaluationIDs], reverse=True)


def getEvaluation(value):
    evaluation = models.Evaluation.query.get(value)
    location = models.Location.query.get(evaluation.LocationID)
    unit = models.Unit.query.get(location.UnitID)
    zone = models.Zone.query.get(unit.ZoneID)
    category = models.Category.query.get(evaluation.CategoryID)
    
    evaluation_dict = {
        "CategoryID": evaluation.CategoryID,
        "Validation": str(evaluation.Validation),
        "Comment": evaluation.Comment,
        "Site": zone.SiteID,
        "Zone": unit.ZoneID,
        "Unit": location.UnitID,
        "Location": location.LocationID,
        "Criteria": category.CriteriaID
    }
    return evaluation_dict


def deleteEvaluation(value, current_user):
    evaluation = models.Evaluation.query.get(value)
    attachments = models.Attachment.query.filter_by(evaluation_r=evaluation).all()
    feedback = models.Feedback.query.filter_by(evaluation_r=evaluation).first()

    evaluation_edit = models.EvaluationEdit(evaluation_r=evaluation, user_r=current_user)
    db.session.add(evaluation_edit)
    db.session.commit()

    evaluation_edits = models.EvaluationEdit.query.filter_by(evaluation_r=evaluation).all()
    
    if len(attachments) > 0:
        for attachment in attachments:
            db.session.delete(attachment)
            attachment_path = app.root_path.replace('\\', '/') + '\\static\\uploads\\'.replace('\\', '/') + attachment.Path.replace('\\', '/')
            try:
                os.remove(attachment_path)
            except FileNotFoundError:
                continue

    if feedback != None:
        db.session.delete(feedback)
    
    if len(evaluation_edits) > 0:
        for edit in evaluation_edits:
            db.session.delete(edit)
            db.session.commit()
    
    db.session.delete(evaluation)
    db.session.commit()


def getEvaluations():
    evaluations = models.Evaluation.query.all()
    evaluations_list, evaluation_dict = [], {}
    
    for evaluation in evaluations:
        evaluation_dict["EvaluationID"] = evaluation.EvaluationID
        evaluation_dict["UserID"] = evaluation.UserID
        evaluation_dict["LocationID"] = evaluation.LocationID
        evaluation_dict["CategoryID"] = evaluation.CategoryID
        evaluation_dict["Date"] = evaluation.Date
        evaluation_dict["Validation"] = evaluation.Validation
        evaluation_dict["Comment"] = evaluation.Comment
        evaluations_list.append(evaluation_dict)
        evaluation_dict = {}
    return evaluations_list



def getLineChartData(value):
    eval_dict = {}
    evaluations = models.Evaluation.query.filter_by(Validation=0).all()
            
    for v in evaluations:
        location = v.location_r
        unit = location.unit_r
        zone = unit.zone_r
        date = v.Date.strftime("%Y, %m, %d")
        category = v.category_r
        criteria = category.criteria_r

        
        if zone.ZoneID not in eval_dict.keys():
            eval_dict[zone.ZoneID] = {}
        
        if criteria.CriteriaID not in eval_dict[zone.ZoneID].keys():
            eval_dict[zone.ZoneID][criteria.CriteriaID] = {}
        
        if date not in eval_dict[zone.ZoneID][criteria.CriteriaID].keys():
            eval_dict[zone.ZoneID][criteria.CriteriaID][date] = 1
        else:
            eval_dict[zone.ZoneID][criteria.CriteriaID][date] += 1
    
    return eval_dict


def getPieChartData(value):
    value = json.loads(value)
    eval_dict, location_filter = {}, []

    date_from = dateparser.parse(value["dateFrom"]).date() if value["dateFrom"] not in (None, "") else models.Evaluation.query.first().Date
    date_to = dateparser.parse(value["dateTo"]).date() + datetime.timedelta(days=1) if value["dateTo"] not in (None, "") else datetime.date.today()

    # Make location id sets from arguments

    if value["LocationID"] not in (None, ""):
        location_filter = models.Location.query.filter_by(LocationID=value["LocationID"]).all()

    elif value["LocationTypeID"] not in (None, ""):
        location_type = models.LocationType.query.get(value["LocationTypeID"])
        unit = models.Unit.query.get(value["UnitID"])
        location_filter = models.Location.query.filter_by(location_type_r=location_type, unit_r=unit).all()

    elif value["UnitID"] not in (None, ""):
        unit = models.Unit.query.get(value["UnitID"])
        location_filter = models.Location.query.filter_by(unit_r=unit).all()

    elif value["ZoneID"] not in (None, ""):
        zone = models.Zone.query.get(value["ZoneID"])
        units = models.Unit.query.filter_by(zone_r=zone).all()
        for unit in units:
            location_filter += models.Location.query.filter_by(unit_r=unit).all()

    elif value["SiteID"] not in (None, ""):
        site = models.Site.query.get(value["SiteID"])
        if current_user.Profile == "Responsable_zone":
            zones = models.Zone.query.filter_by(site_r=site, user_r=current_user).all()
        else:
            zones = models.Zone.query.filter_by(site_r=site).all()
        for zone in zones:
            for unit in models.Unit.query.filter_by(zone_r=zone).all():
                location_filter += models.Location.query.filter_by(unit_r=unit).all()
    
    else:
        location_filter = models.Location.query.all()

    location_id_set = set([location.LocationID for location in location_filter if location != None and len(location_filter) > 0])

    evaluations = models.Evaluation.query.filter_by(Validation=0).filter(
        and_(
            models.Evaluation.Date >= date_from,
            models.Evaluation.Date <= date_to,
            models.Evaluation.LocationID.in_(location_id_set)
        )).all()


    for v in evaluations:
        category = v.category_r
        criteria = category.criteria_r

        if criteria.CriteriaID not in eval_dict.keys():
            eval_dict[criteria.CriteriaID], eval_dict[criteria.CriteriaID]["Detail"] = {}, {}
            eval_dict[criteria.CriteriaID]["Total"] = 1
            eval_dict[criteria.CriteriaID]["Detail"][category.Description] = 1
            eval_dict[criteria.CriteriaID]["Description"] = criteria.Description
        else:
            eval_dict[criteria.CriteriaID]["Total"] += 1

            if category.Description not in eval_dict[criteria.CriteriaID]["Detail"].keys():
                eval_dict[criteria.CriteriaID]["Detail"][category.Description] = 1
            else:
                eval_dict[criteria.CriteriaID]["Detail"][category.Description] += 1
    
    return eval_dict


def getTableData(value):
    value = json.loads(value)
    eval_list, location_filter, category_filter = [], [], []

    date_from = dateparser.parse(value["dateFrom"]).date() if value["dateFrom"] not in (None, "") else datetime.date(2010, 1, 1)
    date_to = dateparser.parse(value["dateTo"]).date() + datetime.timedelta(days=1) if value["dateTo"] not in (None, "") else datetime.date.today() + datetime.timedelta(days=1)

    # Make location id sets from arguments

    if value["LocationID"] not in (None, ""):
        location_filter = models.Location.query.filter_by(LocationID=value["LocationID"]).all()

    elif value["LocationTypeID"] not in (None, ""):
        location_type = models.LocationType.query.get(value["LocationTypeID"])
        unit = models.Unit.query.get(value["UnitID"])
        location_filter = models.Location.query.filter_by(location_type_r=location_type, unit_r=unit).all()

    elif value["UnitID"] not in (None, ""):
        unit = models.Unit.query.get(value["UnitID"])
        location_filter = models.Location.query.filter_by(unit_r=unit).all()

    elif value["ZoneID"] not in (None, ""):
        zone = models.Zone.query.get(value["ZoneID"])
        units = models.Unit.query.filter_by(zone_r=zone).all()
        for unit in units:
            location_filter += models.Location.query.filter_by(unit_r=unit).all()

    elif value["SiteID"] not in (None, ""):
        site = models.Site.query.get(value["SiteID"])
        if current_user.Profile == "Responsable_zone":
            zones = models.Zone.query.filter_by(site_r=site, user_r=current_user).all()
        else:
            zones = models.Zone.query.filter_by(site_r=site).all()
        for zone in zones:
            for unit in models.Unit.query.filter_by(zone_r=zone).all():
                location_filter += models.Location.query.filter_by(unit_r=unit).all()
    
    else:
        location_filter = models.Location.query.all()
    

    if value["CategoryID"] not in (None, ""):
        category_filter = models.Category.query.filter_by(CategoryID=value["CategoryID"]).all()
    
    elif value["CriteriaID"] not in (None, ""):
        criteria = models.Criteria.query.get(value["CriteriaID"])
        category_filter = models.Category.query.filter_by(criteria_r=criteria).all()
    else:
        category_filter = models.Category.query.all()
 
    validation_filter = [value["Validation"]] if value["Validation"] not in (None, "") else [0, 1]

    category_id_set = set([category.CategoryID for category in category_filter if category != None and len(category_filter) > 0])
    location_id_set = set([location.LocationID for location in location_filter if location != None and len(location_filter) > 0])

    evaluations = models.Evaluation.query.filter(
        and_(
            models.Evaluation.Date >= date_from,
            models.Evaluation.Date <= date_to,
            models.Evaluation.LocationID.in_(location_id_set),
            models.Evaluation.CategoryID.in_(category_id_set),
            models.Evaluation.Validation.in_(validation_filter)
        )).order_by(models.Evaluation.Date.desc()).all()
    
    def getAttachments(attachments):
        images, other = [], []
        for attachment in attachments:
            path = "/static/uploads/" + attachment.Path.replace("\\", "/")
            if "image" in attachment.attachment_type_r.Description:
                images.append([attachment.AttachmentID, path])
            else:
                other.append([attachment.AttachmentID, path])
        return [images, other]


    for v in evaluations:
        location = v.location_r
        unit = location.unit_r
        zone = unit.zone_r
        date = v.Date.strftime("%d/%m/%Y")
        category = v.category_r
        criteria = category.criteria_r
        feedback = v.eval_feedback
        attachments = v.eval_attachment

        eval_list.append({
            "EvaluationID": v.EvaluationID,
            "Date": date,
            "User": v.user_r.UserID,
            "Site": zone.site_r.SiteName,
            "Zone": zone.ZoneName,
            "Unit": unit.UnitName,
            "LocationType": location.location_type_r.Description,
            "Location": location.LocationName,
            "Criteria": criteria.Description,
            "Category": category.Description,
            "Validation": "Oui" if v.Validation == 1 else "Non",
            "Comment": v.Comment,
            "Feedback": feedback[0].Feedback if len(feedback) > 0 else "",
            "Attachment": getAttachments(attachments)

        })
    
    return eval_list


def getZoneByID(value):
    zone = models.Zone.query.get(int(value))
    return {"ZoneName": zone.ZoneName}


def updateData(value, edit_id, current_user):
    evaluation = models.Evaluation.query.get(edit_id)
    
    if value["LocationID"][0] == 1:
        v = value["LocationID"][1]
        if v not in (None, ""):
            evaluation.LocationID = v
    
    if value["CategoryID"][0] == 1:
        v = value["CategoryID"][1]
        if v not in (None, ""):
            evaluation.CategoryID = v
    
    if value["Validation"][0] == 1:
        v = value["Validation"][1]
        if v not in (None, ""):
            evaluation.Validation = v
    
    if value["Comment"][0] == 1:
        v = value["Comment"][1]
        if v != None:
            evaluation.Comment = v
    
    if value["Feedback"][0] == 1:
        v = value["Feedback"][1]
        if v != None:
            if current_user.Profile == "Responsable_zone":
                if len(evaluation.eval_feedback) > 0:
                    evaluation.eval_feedback[0].Feedback = v
                else:
                    feedback = models.Feedback(
                        evaluation_r=evaluation,
                        user_r=current_user,
                        Feedback=v)
            elif current_user.Profile == "Administrateur" and len(evaluation.eval_feedback) > 0:
                evaluation.eval_feedback[0].Feedback = v
    
    evaluation_edit = models.EvaluationEdit(evaluation_r=evaluation, user_r=current_user)

    db.session.add(evaluation)
    db.session.commit()


def updateAttachment(value, edit_id, current_user, deleted):
    evaluation = models.Evaluation.query.get(edit_id)
    
    if len(value) > 0:
        evaluation_directory = os.path.join('evaluations', str(edit_id))
        file_directory = os.path.join(app.root_path, 'static/uploads', evaluation_directory)
        
        if not os.path.exists(file_directory):
            os.makedirs(file_directory)
        
        for attachment in value:
            filename = secure_filename(attachment.filename)

            # Check if mime type exists and save
            mime_type = attachment.mimetype
            attachment_type = models.AttachmentType.query.filter_by(Description=mime_type).first()

            if attachment_type != None:
                attachment.save(os.path.join(file_directory, filename))
                attachment_entry = models.Attachment(
                    Path=os.path.join(evaluation_directory, filename),
                    attachment_type_r=attachment_type,
                    evaluation_r=evaluation
                )
                db.session.add(attachment_entry)
    
    if len(deleted) > 0:
        for attachment in deleted:
            if attachment not in ('', ' '):
                deleted_attachment = models.Attachment.query.get(attachment)
                db.session.delete(deleted_attachment)

                attachment_path = os.path.join(app.root_path, 'static/uploads', deleted_attachment.Path)
                os.remove(attachment_path)
    
    evaluation_edit = models.EvaluationEdit(evaluation_r=evaluation, user_r=current_user)

    db.session.add(evaluation_edit)
    db.session.commit()
    
