from datetime import datetime

from extensions import db


# ============================================================
# BED MODEL
# ============================================================

class Bed(db.Model):

    __tablename__ = "beds"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    # MySQL column is ward_name
    ward = db.Column(
        "ward_name",
        db.String(100),
        nullable=False
    )

    room_number = db.Column(
        db.String(50),
        nullable=False
    )

    bed_number = db.Column(
        db.String(50),
        nullable=False
    )

    bed_type = db.Column(
        db.String(50),
        nullable=False,
        default="GENERAL"
    )

    status = db.Column(
        db.String(30),
        nullable=False,
        default="AVAILABLE"
    )

    patient_id = db.Column(
        db.Integer,
        nullable=True
    )

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )

    def to_dict(self):

        return {
            "id": self.id,

            "ward": self.ward,

            "ward_name": self.ward,

            "room_number":
                self.room_number,

            "bed_number":
                self.bed_number,

            "bed_type":
                self.bed_type,

            "status":
                self.status,

            "patient_id":
                self.patient_id,

            "created_at": (
                self.created_at.isoformat()
                if self.created_at
                else None
            )
        }


# ============================================================
# IPD ADMISSION / IPD REQUEST MODEL
# ============================================================

class IPDAdmission(db.Model):

    __tablename__ = "ipd_admissions"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    # ========================================================
    # PATIENT
    # ========================================================

    # IMPORTANT:
    # MySQL ipd_admissions.patient_id is INT
    patient_id = db.Column(
        db.Integer,
        nullable=False,
        index=True
    )

    assessment_id = db.Column(
        db.Integer,
        nullable=True
    )

    admission_number = db.Column(
        db.String(50),
        unique=True,
        nullable=False
    )

    # ========================================================
    # DOCTOR
    # ========================================================

    admitted_by = db.Column(
        db.Integer,
        nullable=True
    )

    doctor_user_id = db.Column(
        db.String(50),
        nullable=True
    )

    # ========================================================
    # IPD WARD REQUEST
    # ========================================================

    ward_type = db.Column(
        db.String(100),
        nullable=True
    )

    ward_name = db.Column(
        db.String(100),
        nullable=True
    )

    room_number = db.Column(
        db.String(50),
        nullable=True
    )

    # ========================================================
    # EXPECTED LENGTH OF STAY
    # ========================================================

    expected_days = db.Column(
        db.Integer,
        nullable=True
    )

    daily_rate = db.Column(
        db.Numeric(10, 2),
        nullable=False,
        default=0
    )

    estimated_ward_charge = db.Column(
        db.Numeric(12, 2),
        nullable=False,
        default=0
    )

    # ========================================================
    # BED
    # ========================================================

    bed_id = db.Column(
        db.Integer,
        nullable=True
    )

    bed_number = db.Column(
        db.String(50),
        nullable=True
    )

    # ========================================================
    # CLINICAL INFORMATION
    # ========================================================

    diagnosis = db.Column(
        db.Text,
        nullable=True
    )

    admission_reason = db.Column(
        db.Text,
        nullable=True
    )

    # ========================================================
    # BILLING
    # ========================================================

    bill_id = db.Column(
        db.Integer,
        nullable=True
    )

    billing_status = db.Column(
        db.String(30),
        nullable=False,
        default="PENDING"
    )

    payment_status = db.Column(
        db.String(30),
        nullable=False,
        default="PENDING"
    )

    # ========================================================
    # IPD VERIFICATION
    # ========================================================

    verification_status = db.Column(
        db.String(30),
        nullable=False,
        default="PENDING"
    )

    verified_by = db.Column(
        db.Integer,
        nullable=True
    )

    verified_at = db.Column(
        db.DateTime,
        nullable=True
    )

    # ========================================================
    # OVERALL STATUS
    # ========================================================

    status = db.Column(
        db.String(30),
        nullable=False,
        default="REQUESTED"
    )

    # ========================================================
    # DATES
    # ========================================================

    # Map Python admitted_at to existing MySQL admission_date
    admitted_at = db.Column(
        "admission_date",
        db.DateTime,
        nullable=True
    )

    # Map Python discharged_at to existing MySQL discharge_date
    discharged_at = db.Column(
        "discharge_date",
        db.DateTime,
        nullable=True
    )

    # ========================================================
    # CREATED AT
    # ========================================================

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )

    # ========================================================
    # TO DICT
    # ========================================================

    def to_dict(self):

        return {

            "id":
                self.id,

            "patient_id":
                self.patient_id,

            "assessment_id":
                self.assessment_id,

            "admission_number":
                self.admission_number,

            "admitted_by":
                self.admitted_by,

            "doctor_user_id":
                self.doctor_user_id,

            # Ward
            "ward_type":
                self.ward_type,

            "ward_name":
                self.ward_name,

            "room_number":
                self.room_number,

            # Stay
            "expected_days":
                self.expected_days,

            "daily_rate":
                float(self.daily_rate or 0),

            "estimated_ward_charge":
                float(
                    self.estimated_ward_charge or 0
                ),

            # Bed
            "bed_id":
                self.bed_id,

            "bed_number":
                self.bed_number,

            # Clinical
            "diagnosis":
                self.diagnosis,

            "admission_reason":
                self.admission_reason,

            # Billing
            "bill_id":
                self.bill_id,

            "billing_status":
                self.billing_status,

            "payment_status":
                self.payment_status,

            # Verification
            "verification_status":
                self.verification_status,

            "verified_by":
                self.verified_by,

            "verified_at": (
                self.verified_at.isoformat()
                if self.verified_at
                else None
            ),

            # Overall
            "status":
                self.status,

            # Dates
            "admitted_at": (
                self.admitted_at.isoformat()
                if self.admitted_at
                else None
            ),

            "discharged_at": (
                self.discharged_at.isoformat()
                if self.discharged_at
                else None
            ),

            "created_at": (
                self.created_at.isoformat()
                if self.created_at
                else None
            )
        }