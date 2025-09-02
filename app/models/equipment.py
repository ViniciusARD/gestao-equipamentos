# app/models/equipment.py

from app import db

class Equipment(db.Model):
    __tablename__ = 'equipment'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    category = db.Column(db.String(50), nullable=False)
    status = db.Column(db.String(20), nullable=False, default='available') # available, reserved, maintenance
    description = db.Column(db.Text, nullable=True)

    def __repr__(self):
        return f'<Equipment {self.name}>'
