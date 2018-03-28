# Functions needed for views or other

from PyAudit_flask import db
from PyAudit_flask import models


def getLatestEvaluationID_plusOne():
    evaluation = models.Evaluation.query.order_by(models.Evaluation.EvaluationID.desc()).first()
    return 1 if evaluation == None else evaluation.EvaluationID + 1


def getZone(value):
    zones = models.Zone.query.filter_by(SiteID=value).all()
    return [{"ZoneID": zone.ZoneID, "ZoneName": zone.ZoneName} for zone in zones]
    

def getUnit(value):
    units = models.Unit.query.filter_by(ZoneID=value).all()
    return [{"UnitID": unit.UnitID, "UnitName": unit.UnitName} for unit in units]


def getLocation(value):
    locations = models.Location.query.filter_by(UnitID=value).all()
    return [{"LocationID": location.LocationID, "LocationName": location.LocationName} for location in locations]


#def getCriteria(value):
#    return models.Criteria.query.filter_by(CriteriaID=value).all()


def getCategory(value):
    categories = models.Category.query.filter_by(CriteriaID=value).all()
    return [{"CategoryID": category.CategoryID, "Description": category.Description} for category in categories]


def getEvaluationID(value):
    evaluationIDs = db.session.query(models.Evaluation.EvaluationID).all()
    return sorted([evaluationID[0] for evaluationID in evaluationIDs], reverse=True)


def getEvaluation(value):
    evaluation = models.Evaluation.query.get(value)
    workshop = models.Workshop.query.get(models.Area.query.get(evaluation.AreaID).WorkshopID)
    unit = models.Unit.query.get(workshop.UnitID)
    zone = models.Zone.query.get(unit.ZoneID)
    category = models.Category.query.get(evaluation.CategoryID)
    
    evaluation_dict = {
        "AreaID": evaluation.AreaID,
        "CategoryID": evaluation.CategoryID,
        "Validation": str(evaluation.Validation),
        "Comment": evaluation.Comment,
        "Site": zone.SiteID,
        "Zone": unit.ZoneID,
        "Unit": workshop.UnitID,
        "Workhsop": workshop.WorkshopID,
        "Criteria": category.CriteriaID
    }
    return evaluation_dict


def deleteEvaluation(value):
    evaluation = models.Evaluation.query.get(value)
    attachments = models.Attachment.query.filter_by(evaluation_r=evaluation).all()
    feedback = models.Feedback.query.filter_by(evaluation_r=evaluation).first()
    
    if len(attachments) > 0:
        for attachment in attachments:
            db.session.delete(attachment)

    if feedback != None:
        db.session.delete(feedback)
    
    db.session.delete(evaluation)
    db.session.commit()

    return "Success"


