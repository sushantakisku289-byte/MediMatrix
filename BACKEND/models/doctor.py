 # ============================================================
    # MEDIMATRIX - DOCTOR MODEL
    # ============================================================

from datetime import datetime

from extensions import db


class Doctor(db.Model):
        """
        Doctor profile model.

        Each doctor has an independent profile containing:
        - Doctor ID
        - Name
        - Department
        - Email
        - Mobile number
        - Profile photo
        - Account status
        """

        __tablename__ = "doctors"

        # ========================================================
        # PRIMARY KEY
        # ========================================================

        id = db.Column(
            db.Integer,
            primary_key=True
        )

        # ========================================================
        # DOCTOR ID
        # ========================================================

        doctor_id = db.Column(
            db.String(50),
            unique=True,
            nullable=False,
            index=True
        )

        # ========================================================
        # BASIC INFORMATION
        # ========================================================

        full_name = db.Column(
            db.String(150),
            nullable=False
        )

        department = db.Column(
            db.String(150),
            nullable=False,
            default="Medical Department"
        )

        # ========================================================
        # CONTACT INFORMATION
        # ========================================================

        email = db.Column(
            db.String(150),
            unique=True,
            nullable=True,
            index=True
        )

        phone = db.Column(
            db.String(20),
            nullable=True
        )

        # ========================================================
        # PROFILE PHOTO
        # ========================================================

        profile_photo = db.Column(
            db.String(500),
            nullable=True
        )

        # ========================================================
        # ACCOUNT STATUS
        # ========================================================

        status = db.Column(
            db.String(30),
            nullable=False,
            default="ACTIVE"
        )

        # ========================================================
        # TIMESTAMPS
        # ========================================================

        created_at = db.Column(
            db.DateTime,
            nullable=False,
            default=datetime.utcnow
        )

        updated_at = db.Column(
            db.DateTime,
            nullable=False,
            default=datetime.utcnow,
            onupdate=datetime.utcnow
        )

        # ========================================================
        # CONSTRUCTOR
        # ========================================================

        def __init__(
            self,
            doctor_id,
            full_name,
            department="Medical Department",
            email=None,
            phone=None,
            profile_photo=None,
            status="ACTIVE"
        ):

            self.doctor_id = doctor_id

            self.full_name = full_name

            self.department = (
                department
                if department
                else "Medical Department"
            )

            self.email = email

            self.phone = phone

            self.profile_photo = profile_photo

            self.status = status

        # ========================================================
        # SERIALIZE
        # ========================================================

        def to_dict(self):

            return {

                "id": self.id,

                "doctor_id": self.doctor_id,

                "full_name": self.full_name,

                "department": self.department,

                "email": self.email,

                "phone": self.phone,

                "profile_photo": self.profile_photo,

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

        # ========================================================
        # REPRESENTATION
        # ========================================================

        def __repr__(self):

            return (
                f"<Doctor "
                f"{self.doctor_id} "
                f"{self.full_name}>"
            )