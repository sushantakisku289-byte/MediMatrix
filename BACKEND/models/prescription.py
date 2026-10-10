from datetime import datetime

from extensions import db


class Prescription(db.Model):

    __tablename__ = "prescriptions"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    patient_id = db.Column(
        db.String(30),
        nullable=False,
        index=True
    )

    assessment_id = db.Column(
        db.Integer,
        nullable=True,
        index=True
    )

    doctor_user_id = db.Column(
        db.String(50),
        nullable=True
    )

    treatment_type = db.Column(
        db.String(10),
        nullable=False
    )

    diagnosis = db.Column(
        db.Text,
        nullable=True
    )

    consultation_notes = db.Column(
        db.Text,
        nullable=True
    )

    medicines = db.Column(
        db.Text,
        nullable=True
    )

    instructions = db.Column(
        db.Text,
        nullable=True
    )

    status = db.Column(
        db.String(30),
        nullable=False,
        default="PENDING_PHARMACY"
    )

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    updated_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )

    def to_dict(self):

        return {
            "id": self.id,
            "patient_id": self.patient_id,
            "assessment_id": self.assessment_id,
            "doctor_user_id": self.doctor_user_id,
            "treatment_type": self.treatment_type,
            "diagnosis": self.diagnosis,
            "consultation_notes": self.consultation_notes,
            "medicines": self.medicines,
            "instructions": self.instructions,
            "status": self.status,
            "created_at": (
                self.created_at.isoformat()
                if self.created_at
                else None
            ),
            "updated_at": (
                self.updated_at.isoformat()
                if self.updated_at
                else None
            )
        }