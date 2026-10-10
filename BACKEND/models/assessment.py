from datetime import datetime

from extensions import db


class Assessment(db.Model):

    __tablename__ = "assessments"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    patient_id = db.Column(
        db.String(30),
        nullable=False,
        index=True
    )

    symptoms = db.Column(
        db.Text,
        nullable=False
    )

    temperature = db.Column(
        db.Float,
        nullable=True
    )

    heart_rate = db.Column(
        db.Integer,
        nullable=True
    )

    systolic_bp = db.Column(
        db.Integer,
        nullable=True
    )

    diastolic_bp = db.Column(
        db.Integer,
        nullable=True
    )

    oxygen_saturation = db.Column(
        db.Float,
        nullable=True
    )

    priority = db.Column(
        db.String(30),
        nullable=False,
        default="ROUTINE"
    )

    priority_reasons = db.Column(
        db.Text,
        nullable=True
    )

    department = db.Column(
        db.String(100),
        nullable=True
    )

    status = db.Column(
        db.String(30),
        nullable=False,
        default="WAITING_DOCTOR"
    )

    # ============================================================
    # PREVIOUS MEDICAL REPORT
    # ============================================================

    previous_report_filename = db.Column(
        db.String(255),
        nullable=True
    )

    previous_report_original_name = db.Column(
        db.String(255),
        nullable=True
    )

    previous_report_path = db.Column(
        db.String(500),
        nullable=True
    )

    previous_report_ocr_text = db.Column(
        db.Text,
        nullable=True
    )

    # ============================================================
    # NURSE OBSERVATION
    # ============================================================

    nurse_observation = db.Column(
        db.Text,
        nullable=True
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

            "id":
                self.id,

            "patient_id":
                self.patient_id,

            "symptoms":
                self.symptoms,

            "temperature":
                self.temperature,

            "heart_rate":
                self.heart_rate,

            "systolic_bp":
                self.systolic_bp,

            "diastolic_bp":
                self.diastolic_bp,

            "oxygen_saturation":
                self.oxygen_saturation,

            "priority":
                self.priority,

            "priority_reasons":
                self.priority_reasons,

            "department":
                self.department,

            "status":
                self.status,

            # ====================================================
            # PREVIOUS MEDICAL REPORT
            # ====================================================

            "previous_report_filename":
                self.previous_report_filename,

            "previous_report_original_name":
                self.previous_report_original_name,

            "previous_report_path":
                self.previous_report_path,

            "previous_report_ocr_text":
                self.previous_report_ocr_text,

            # ====================================================
            # NURSE OBSERVATION
            # ====================================================

            "nurse_observation":
                self.nurse_observation,

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