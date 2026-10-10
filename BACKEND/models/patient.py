from datetime import datetime

from extensions import db


class Patient(db.Model):

    __tablename__ = "patients"

    # ============================================================
    # PRIMARY KEY
    # ============================================================

    id = db.Column(
        db.Integer,
        primary_key=True,
        autoincrement=True
    )

    # ============================================================
    # PATIENT ID
    # ============================================================

    patient_id = db.Column(
        db.String(50),
        unique=True,
        nullable=False
    )

    registration_number = db.Column(
        db.String(50),
        unique=True,
        nullable=False
    )

    # ============================================================
    # BASIC INFORMATION
    # ============================================================

    full_name = db.Column(
        db.String(150),
        nullable=False
    )

    date_of_birth = db.Column(
        db.Date,
        nullable=True
    )

    age = db.Column(
        db.Integer,
        nullable=True
    )

    gender = db.Column(
        db.String(20),
        nullable=False
    )

    phone = db.Column(
        db.String(20),
        nullable=False
    )

    email = db.Column(
        db.String(150),
        nullable=True
    )

    address = db.Column(
        db.Text,
        nullable=True
    )

    blood_group = db.Column(
        db.String(10),
        nullable=True
    )

    # ============================================================
    # EMERGENCY CONTACT
    # ============================================================

    emergency_contact_name = db.Column(
        db.String(150),
        nullable=True
    )

    emergency_contact_phone = db.Column(
        db.String(20),
        nullable=True
    )

    # ============================================================
    # MEDICAL INFORMATION
    # ============================================================

    allergies = db.Column(
        db.Text,
        nullable=True
    )

    medical_history = db.Column(
        db.Text,
        nullable=True
    )

    current_medications = db.Column(
        db.Text,
        nullable=True
    )

    # ============================================================
    # REGISTRATION STATUS
    # ============================================================

    registration_status = db.Column(
        db.String(50),
        nullable=False,
        default="REGISTERED"
    )

    # ============================================================
    # EMPLOYEE WHO CREATED THE RECORD
    # ============================================================

    created_by = db.Column(
        db.Integer,
        nullable=True
    )

    # ============================================================
    # DATE / TIME
    # ============================================================

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        nullable=True
    )

    updated_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=True
    )

    # ============================================================
    # TRIAGE / DEPARTMENT
    # ============================================================

    symptoms = db.Column(
        db.Text,
        nullable=True
    )

    department = db.Column(
        db.String(100),
        nullable=True
    )

    # ============================================================
    # BACKWARD COMPATIBILITY
    # ============================================================

    @property
    def status(self):
        return self.registration_status

    @status.setter
    def status(self, value):
        self.registration_status = value

    # ============================================================
    # CONVERT TO DICTIONARY
    # ============================================================

    def to_dict(self):

        return {
            "id": self.id,

            "patient_id": self.patient_id,

            "registration_number": self.registration_number,

            "full_name": self.full_name,

            "date_of_birth": (
                self.date_of_birth.isoformat()
                if self.date_of_birth
                else None
            ),

            "age": self.age,

            "gender": self.gender,

            "phone": self.phone,

            "email": self.email,

            "address": self.address,

            "blood_group": self.blood_group,

            "emergency_contact_name": (
                self.emergency_contact_name
            ),

            "emergency_contact_phone": (
                self.emergency_contact_phone
            ),

            "allergies": self.allergies,

            "medical_history": self.medical_history,

            "current_medications": self.current_medications,

            "registration_status": (
                self.registration_status
            ),

            # Compatibility for existing frontend code
            "status": (
                self.registration_status
            ),

            "created_by": self.created_by,

            "symptoms": self.symptoms,

            "department": self.department,

            # Existing frontend may use registration_date.
            # Your actual database uses created_at.
            "registration_date": (
                self.created_at.isoformat()
                if self.created_at
                else None
            ),

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