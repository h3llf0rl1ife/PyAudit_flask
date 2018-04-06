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


def getLocationType(value):
    locations = models.Location.query.filter_by(UnitID=value).all()
    location_types = [location.location_type_r for location in locations]
    location_types = list(set(location_types))
    return [{"LocationTypeID": location_type.LocationTypeID, "Description": location_type.Description} for location_type in location_types]


def getLocation(value):
    locations = models.Location.query.filter_by(UnitID=value).all()
    return [{"LocationID": location.LocationID, "LocationName": location.LocationName} for location in locations]


def getCategory(value):
    categories = models.Category.query.filter_by(CriteriaID=value).all()
    return [{"CategoryID": category.CategoryID, "Description": category.Description} for category in categories]


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
    inv_dict = {}
    invalid = models.Evaluation.query.filter_by(Validation=0).all()
            
    for v in invalid:
        location = v.location_r
        unit = location.unit_r
        zone = unit.zone_r
        date = v.Date.strftime("%Y, %m, %d")
        category = v.category_r
        criteria = category.criteria_r

        
        if zone.ZoneID not in inv_dict.keys():
            inv_dict[zone.ZoneID] = {}
        
        if criteria.CriteriaID not in inv_dict[zone.ZoneID].keys():
            inv_dict[zone.ZoneID][criteria.CriteriaID] = {}
        
        if date not in inv_dict[zone.ZoneID][criteria.CriteriaID].keys():
            inv_dict[zone.ZoneID][criteria.CriteriaID][date] = 1
        else:
            inv_dict[zone.ZoneID][criteria.CriteriaID][date] += 1
    
    return inv_dict
   

def getZoneByID(value):
    zone = models.Zone.query.get(int(value))
    return {"ZoneName": zone.ZoneName}
