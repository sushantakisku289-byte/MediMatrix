from datetime import datetime

from extensions import db


class Medicine(db.Model):

    __tablename__ = "medicines"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    medicine_code = db.Column(
        db.String(50),
        unique=True,
        nullable=False
    )

    medicine_name = db.Column(
        db.String(150),
        nullable=False
    )

    category = db.Column(
        db.String(100),
        nullable=True
    )

    manufacturer = db.Column(
        db.String(150),
        nullable=True
    )

    batch_number = db.Column(
        db.String(100),
        nullable=True
    )

    expiry_date = db.Column(
        db.Date,
        nullable=True
    )

    quantity = db.Column(
        db.Integer,
        nullable=False,
        default=0
    )

    unit_price = db.Column(
        db.Float,
        nullable=False,
        default=0
    )

    is_active = db.Column(
        db.Boolean,
        default=True,
        nullable=False
    )

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )

    updated_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )

    def to_dict(self):

        return {
            "id": self.id,
            "medicine_code": self.medicine_code,
            "medicine_name": self.medicine_name,
            "category": self.category,
            "manufacturer": self.manufacturer,
            "batch_number": self.batch_number,
            "expiry_date": (
                self.expiry_date.isoformat()
                if self.expiry_date
                else None
            ),
            "quantity": self.quantity,
            "unit_price": self.unit_price,
            "is_active": self.is_active,
            "created_at": (
                self.created_at.isoformat()
                if self.created_at
                else None
            )
        }