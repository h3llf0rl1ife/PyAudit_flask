from datetime import datetime
from PyAudit_flask import db


# TODO: Add modification tracking for Evaluation (new table)


class User(db.Model):
    #__tablename__ = "user"
    UserID = db.Column(db.String, primary_key=True)
    password = db.Column(db.String, nullable=False)
    Profile = db.Column(db.String, nullable=False)
    
    @property
    def is_active(self):
        return True

    @property
    def is_authenticated(self):
        return True

    @property
    def is_anonymous(self):
        return False 

    def get_id(self):
        return self.UserID

    def __repr__(self):
        return '<User %r, Profile %r>' % (self.UserID, self.Profile)


class Evaluation(db.Model):
    EvaluationID = db.Column(db.Integer, primary_key=True)
    UserID = db.Column(db.String, db.ForeignKey('user.UserID'), nullable=False)
    AreaID = db.Column(db.Integer, db.ForeignKey('area.AreaID'), nullable=False)
    CategoryID = db.Column(db.Integer, db.ForeignKey('category.CategoryID'), nullable=False)
    Date = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    Validation = db.Column(db.Integer, nullable=False)
    Comment = db.Column(db.Text, nullable=True) # Remarque

    user_r = db.relationship('User', backref=db.backref('user_eval', lazy=True))
    area_r = db.relationship('Area', backref=db.backref('area_eval', lazy=True))
    category_r = db.relationship('Category', backref=db.backref('category_eval', lazy=True))

    def __repr__(self):
        return '<Evaluation %r>' % self.EvaluationID


class Category(db.Model):
    CategoryID = db.Column(db.Integer, primary_key=True)
    CriteriaID = db.Column(db.String, db.ForeignKey('criteria.CriteriaID'), nullable=False)
    Description = db.Column(db.Text, nullable=False)

    criteria_r = db.relationship('Criteria', backref=db.backref('criterias', lazy=True))

    def __repr__(self):
        return '<Category %r>' % self.CategoryID


class Criteria(db.Model):
    CriteriaID = db.Column(db.String, primary_key=True)
    Description = db.Column(db.Text, nullable=False)

    def __repr__(self):
        return '<Criteria %r>' % self.CriteriaID


class Feedback(db.Model):
    EvaluationID = db.Column(db.Integer, db.ForeignKey('evaluation.EvaluationID'), primary_key=True)
    UserID = db.Column(db.String, db.ForeignKey('user.UserID'), nullable=False)
    Feedback = db.Column(db.Text, nullable=False)

    evaluation_r = db.relationship('Evaluation', backref=db.backref('eval_feedback', lazy=True))
    user_r = db.relationship('User', backref=db.backref('user_feedback', lazy=True))

    def __repr__(self):
        return '<Feedback %r>' % self.Feedback


class AttachmentType(db.Model):
    AttachmentTypeID = db.Column(db.Integer, primary_key=True)
    Description = db.Column(db.String, unique=True, nullable=False)

    def __repr__(self):
        return '<AttachmentType %r>' % self.AttachmentTypeID


class Attachment(db.Model):
    AttachmentID = db.Column(db.Integer, primary_key=True)
    EvaluationID = db.Column(db.Integer, db.ForeignKey('evaluation.EvaluationID'), nullable=False)
    AttachmentTypeID = db.Column(db.Integer, db.ForeignKey('attachment_type.AttachmentTypeID'), nullable=False)
    Path = db.Column(db.String, unique=True, nullable=False)

    attachment_type_r = db.relationship('AttachmentType', backref=db.backref('attachment_types', lazy=True))
    evaluation_r = db.relationship('Evaluation', backref=db.backref('eval_attachment', lazy=True))

    def __repr__(self):
        return '<Attachment %r>' % self.AttachmentID


class Site(db.Model):
    SiteID = db.Column(db.Integer, primary_key=True)
    SiteName = db.Column(db.String, nullable=False)

    def __repr__(self):
        return '<Site %r>' % self.SiteName


class Zone(db.Model):
    ZoneID = db.Column(db.Integer, primary_key=True)
    UserID = db.Column(db.String, db.ForeignKey('user.UserID'), nullable=False)
    SiteID = db.Column(db.Integer, db.ForeignKey('site.SiteID'), nullable=False)
    ZoneName = db.Column(db.String, nullable=False)

    user_r = db.relationship('User', backref=db.backref('user_zone', lazy=True))
    site_r = db.relationship('Site', backref=db.backref('site_zone', lazy=True))

    def __repr__(self):
        return '<Zone %r>' % self.ZoneName


class Unit(db.Model): # Unité
    UnitID = db.Column(db.Integer, primary_key=True)
    UnitName = db.Column(db.String, nullable=False)
    ZoneID = db.Column(db.Integer, db.ForeignKey('zone.ZoneID'), nullable=False)

    zone_r = db.relationship('Zone', backref=db.backref('zone_unit', lazy=True))

    def __repr__(self):
        return '<Unit %r>' % self.UnitName


class Workshop(db.Model): # Atelier
    WorkshopID = db.Column(db.Integer, primary_key=True)
    WorkshopName = db.Column(db.String, nullable=False)
    UnitID = db.Column(db.Integer, db.ForeignKey('unit.UnitID'), nullable=False)

    unit_r = db.relationship('Unit', backref=db.backref('unit_workshop', lazy=True))

    def __repr__(self):
        return '<Workshop %r>' % self.WorkshopName
    

class Area(db.Model): # Local / Espace
    AreaID = db.Column(db.Integer, primary_key=True)
    AreaName = db.Column(db.String, nullable=False)
    Address = db.Column(db.String, unique=True, nullable=False)
    WorkshopID = db.Column(db.Integer, db.ForeignKey('workshop.WorkshopID'), nullable=False)

    workshop_r = db.relationship('Workshop', backref=db.backref('workshop_area', lazy=True))

    def __repr__(self):
        return '<Area %r>' % self.AreaName





