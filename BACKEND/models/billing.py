from datetime import datetime

from extensions import db


class Bill(db.Model):

    __tablename__ = "bills"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    bill_number = db.Column(
        db.String(50),
        unique=True,
        nullable=False
    )

    patient_id = db.Column(
        db.String(30),
        nullable=False,
        index=True
    )

    prescription_id = db.Column(
        db.Integer,
        nullable=True
    )

    consultation_charge = db.Column(
        db.Float,
        nullable=False,
        default=0
    )

    medicine_charge = db.Column(
        db.Float,
        nullable=False,
        default=0
    )

    admission_charge = db.Column(
        db.Float,
        nullable=False,
        default=0
    )

    other_charge = db.Column(
        db.Float,
        nullable=False,
        default=0
    )

    discount = db.Column(
        db.Float,
        nullable=False,
        default=0
    )

    total_amount = db.Column(
        db.Float,
        nullable=False,
        default=0
    )

    payment_method = db.Column(
        db.String(30),
        nullable=True
    )

    payment_status = db.Column(
        db.String(30),
        nullable=False,
        default="PENDING"
    )

    transaction_id = db.Column(
        db.String(100),
        nullable=True
    )

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    paid_at = db.Column(
        db.DateTime,
        nullable=True
    )

    def to_dict(self):

        return {
            "id": self.id,
            "bill_number": self.bill_number,
            "patient_id": self.patient_id,
            "prescription_id": self.prescription_id,
            "consultation_charge":
                self.consultation_charge,
            "medicine_charge":
                self.medicine_charge,
            "admission_charge":
                self.admission_charge,
            "other_charge":
                self.other_charge,
            "discount":
                self.discount,
            "total_amount":
                self.total_amount,
            "payment_method":
                self.payment_method,
            "payment_status":
                self.payment_status,
            "transaction_id":
                self.transaction_id,
            "created_at": (
                self.created_at.isoformat()
                if self.created_at
                else None
            ),
            "paid_at": (
                self.paid_at.isoformat()
                if self.paid_at
                else None
            )
        }