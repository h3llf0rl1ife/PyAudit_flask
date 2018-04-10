# Functions needed for views or other

import json
import datetime
import dateparser
from sqlalchemy import and_, func
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
    value = json.loads(value)
    locations = models.Location.query.filter_by(UnitID=int(value["UnitID"]), LocationTypeID=int(value["LocationTypeID"])).all()
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
    date_to = dateparser.parse(value["dateTo"]).date() if value["dateTo"] not in (None, "") else datetime.date.today()

    # Make location id sets from arguments

    if value["LocationID"] not in (None, ""):
        location_filter = models.Location.query.filter_by(LocationID=int(value["LocationID"])).all()

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
   

def getZoneByID(value):
    zone = models.Zone.query.get(int(value))
    return {"ZoneName": zone.ZoneName}
