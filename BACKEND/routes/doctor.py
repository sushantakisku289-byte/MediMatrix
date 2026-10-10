from flask import (
    Blueprint,
    request,
    jsonify,
    send_from_directory
)

from extensions import db
from sqlalchemy import text

from models.assessment import Assessment
from models.patient import Patient
from models.user import User

from werkzeug.utils import secure_filename

import os
import uuid

doctor_bp = Blueprint(
    "doctor",
    __name__,
    url_prefix="/api/doctor"
)

# ============================================================
# DOCTOR PROFILE
# ============================================================

# ============================================================
# DOCTOR PROFILE
# ============================================================

@doctor_bp.route(
    "/profile/<string:user_id>",
    methods=["GET"]
)
def get_doctor_profile(user_id):

    try:

        # ====================================================
        # FIND DOCTOR
        # ====================================================

        doctor = User.query.filter_by(
            user_id=user_id
        ).first()

        if not doctor:

            return jsonify({

                "success": False,

                "message":
                    "Doctor not found."

            }), 404


        # ====================================================
        # CHECK ROLE
        # ====================================================

        if str(doctor.role).upper() not in [

            "DOCTOR",
            "DOCTOR_HOD"

        ]:

            return jsonify({

                "success": False,

                "message":
                    "User is not a doctor."

            }), 403


        # ====================================================
        # GET DEPARTMENT
        #
        # User table stores department_id.
        # Department name comes from departments table.
        # ====================================================

        department_name = None

        department_id = getattr(
            doctor,
            "department_id",
            None
        )


        if department_id:

            department_record = (

                db.session.execute(

                    text("""
                        SELECT
                            id,
                            department_name
                        FROM departments
                        WHERE id = :department_id
                        LIMIT 1
                    """),

                    {
                        "department_id":
                            department_id
                    }

                )

                .mappings()
                .first()

            )


            if department_record:

                department_name = (

                    department_record[
                        "department_name"
                    ]

                )


        # ====================================================
        # FALLBACK
        # ====================================================

        if not department_name:

            department_name = (
                "Medical Department"
            )


        # ====================================================
        # PROFILE PHOTO
        # ====================================================

        photo_url = None

        profile_photo = getattr(
            doctor,
            "profile_photo",
            None
        )


        if profile_photo:

            photo_url = (

                "/api/doctor/profile-photo/"
                +
                secure_filename(
                    profile_photo
                )

            )


        # ====================================================
        # RESPONSE
        # ====================================================

        return jsonify({

            "success": True,

            "doctor": {

                "user_id":
                    doctor.user_id,

                "full_name":
                    doctor.full_name,

                "username":
                    doctor.username,

                "email":
                    doctor.email,

                "phone":
                    doctor.phone,

                "department":
                    department_name,

                "department_id":
                    department_id,

                "role":
                    doctor.role,

                "is_active":
                    doctor.is_active,

                "profile_photo":
                    profile_photo,

                "photo_url":
                    photo_url

            }

        }), 200


    except Exception as error:

        print(
            "DOCTOR PROFILE ERROR:",
            repr(error)
        )

        return jsonify({

            "success": False,

            "message":
                "Unable to load doctor profile.",

            "error":
                str(error)

        }), 500


# ============================================================
# UPDATE DOCTOR PROFILE
# ============================================================

@doctor_bp.route(
    "/profile/<string:user_id>",
    methods=["PUT"]
)
def update_doctor_profile(user_id):

    try:

        doctor = User.query.filter_by(
            user_id=user_id
        ).first()

        if not doctor:

            return jsonify({

                "success": False,

                "message":
                    "Doctor not found."

            }), 404


        if str(doctor.role).upper() not in [
            "DOCTOR",
            "DOCTOR_HOD"
        ]:

            return jsonify({

                "success": False,

                "message":
                    "User is not a doctor."

            }), 403


        data = request.get_json(
            silent=True
        ) or {}


        # ----------------------------------------------------
        # FULL NAME
        # ----------------------------------------------------

        if "full_name" in data:

            full_name = str(
                data.get(
                    "full_name",
                    ""
                )
            ).strip()

            if not full_name:

                return jsonify({

                    "success": False,

                    "message":
                        "Full name cannot be empty."

                }), 400

            doctor.full_name = full_name


        # ----------------------------------------------------
        # PHONE
        # ----------------------------------------------------

        if "phone" in data:

            doctor.phone = str(
                data.get(
                    "phone",
                    ""
                )
            ).strip()


        # ----------------------------------------------------
        # EMAIL
        # ----------------------------------------------------

        if "email" in data:

            email = str(
                data.get(
                    "email",
                    ""
                )
            ).strip()

            if email:

                existing_email = (
                    User.query
                    .filter(
                        User.email == email,
                        User.user_id != user_id
                    )
                    .first()
                )

                if existing_email:

                    return jsonify({

                        "success": False,

                        "message":
                            "Email address is already in use."

                    }), 409

            doctor.email = email


        # ----------------------------------------------------
        # DEPARTMENT
        # ----------------------------------------------------

        if "department" in data:

            department = str(
                data.get(
                    "department",
                    ""
                )
            ).strip()

            if department:

                doctor.department = department


        db.session.commit()


        return jsonify({

            "success": True,

            "message":
                "Doctor profile updated successfully.",

            "doctor": {

                "user_id":
                    doctor.user_id,

                "full_name":
                    doctor.full_name,

                "username":
                    doctor.username,

                "email":
                    doctor.email,

                "phone":
                    doctor.phone,

                "department":
                    doctor.department,

                "role":
                    doctor.role,

                "is_active":
                    doctor.is_active,

                "profile_photo":
                    getattr(
                        doctor,
                        "profile_photo",
                        None
                    )

            }

        }), 200


    except Exception as error:

        db.session.rollback()

        return jsonify({

            "success": False,

            "message":
                "Unable to update doctor profile.",

            "error":
                str(error)

        }), 500


# ============================================================
# DOCTOR PROFILE PHOTO UPLOAD
# ============================================================

@doctor_bp.route(
    "/profile/<string:user_id>/photo",
    methods=["POST"]
)
def upload_doctor_profile_photo(user_id):

    try:

        doctor = User.query.filter_by(
            user_id=user_id
        ).first()


        if not doctor:

            return jsonify({

                "success": False,

                "message":
                    "Doctor not found."

            }), 404


        if str(doctor.role).upper() not in [
            "DOCTOR",
            "DOCTOR_HOD"
        ]:

            return jsonify({

                "success": False,

                "message":
                    "User is not a doctor."

            }), 403


        # ----------------------------------------------------
        # CHECK FILE
        # ----------------------------------------------------

        if "profile_photo" not in request.files:

            return jsonify({

                "success": False,

                "message":
                    "Profile photo is required."

            }), 400


        file = request.files[
            "profile_photo"
        ]


        if not file or not file.filename:

            return jsonify({

                "success": False,

                "message":
                    "No profile photo selected."

            }), 400


        # ----------------------------------------------------
        # CHECK EXTENSION
        # ----------------------------------------------------

        extension = (
            file.filename
            .rsplit(".", 1)[-1]
            .lower()
        )


        allowed_extensions = {
            "jpg",
            "jpeg",
            "png",
            "webp"
        }


        if extension not in allowed_extensions:

            return jsonify({

                "success": False,

                "message":
                    "Only JPG, JPEG, PNG and WEBP images are allowed."

            }), 400


        # ----------------------------------------------------
        # UPLOAD DIRECTORY
        # ----------------------------------------------------

        base_dir = os.path.dirname(
            os.path.dirname(
                os.path.abspath(__file__)
            )
        )


        upload_folder = os.path.join(
            base_dir,
            "uploads",
            "profile_photos"
        )


        os.makedirs(
            upload_folder,
            exist_ok=True
        )


        # ----------------------------------------------------
        # DELETE OLD PHOTO
        # ----------------------------------------------------

        old_photo = getattr(
            doctor,
            "profile_photo",
            None
        )


        if old_photo:

            old_path = os.path.join(
                upload_folder,
                os.path.basename(
                    old_photo
                )
            )


            if os.path.exists(
                old_path
            ):

                try:

                    os.remove(
                        old_path
                    )

                except OSError:

                    pass


        # ----------------------------------------------------
        # UNIQUE FILE NAME
        # ----------------------------------------------------

        new_filename = (
            f"{uuid.uuid4().hex}"
            f".{extension}"
        )


        save_path = os.path.join(
            upload_folder,
            secure_filename(
                new_filename
            )
        )


        file.save(
            save_path
        )


        # ----------------------------------------------------
        # SAVE DATABASE
        # ----------------------------------------------------

        doctor.profile_photo = (
            new_filename
        )


        db.session.commit()


        return jsonify({

            "success": True,

            "message":
                "Profile photo updated successfully.",

            "profile_photo":
                new_filename,

            "photo_url":
                (
                    "/api/doctor/profile-photo/"
                    + new_filename
                )

        }), 200


    except Exception as error:

        db.session.rollback()

        return jsonify({

            "success": False,

            "message":
                "Unable to upload profile photo.",

            "error":
                str(error)

        }), 500


# ============================================================
# SERVE DOCTOR PROFILE PHOTO
# ============================================================

@doctor_bp.route(
    "/profile-photo/<filename>",
    methods=["GET"]
)
def get_doctor_profile_photo(filename):

    try:

        safe_filename = secure_filename(
            filename
        )


        if not safe_filename:

            return jsonify({

                "success": False,

                "message":
                    "Invalid file name."

            }), 400


        base_dir = os.path.dirname(
            os.path.dirname(
                os.path.abspath(__file__)
            )
        )


        upload_folder = os.path.join(
            base_dir,
            "uploads",
            "profile_photos"
        )


        return send_from_directory(
            upload_folder,
            safe_filename
        )


    except Exception as error:

        return jsonify({

            "success": False,

            "message":
                "Unable to load profile photo.",

            "error":
                str(error)

        }), 404


# ============================================================
# OPEN PATIENT FOR DOCTOR
# ============================================================

@doctor_bp.route(
    "/patient/<string:patient_id>",
    methods=["GET"]
)
def open_patient(patient_id):

    try:

        patient = Patient.query.filter_by(
            patient_id=patient_id
        ).first()

        if not patient:

            return jsonify({

                "success": False,

                "message":
                    "Patient not found."

            }), 404

        assessments = (
            Assessment.query
            .filter_by(
                patient_id=patient_id
            )
            .order_by(
                Assessment.id.desc()
            )
            .all()
        )

        return jsonify({

            "success": True,

            "patient":
                patient.to_dict(),

            "assessments": [

                assessment.to_dict()

                for assessment
                in assessments

            ]

        }), 200

    except Exception as error:

        return jsonify({

            "success": False,

            "message":
                "Unable to open patient.",

            "error":
                str(error)

        }), 500


# ============================================================
# DOCTOR STARTS CONSULTATION
# ============================================================

@doctor_bp.route(
    "/assessment/<int:assessment_id>/start",
    methods=["PUT"]
)
def start_consultation(
    assessment_id
):

    try:

        assessment = Assessment.query.get(
            assessment_id
        )

        if not assessment:

            return jsonify({

                "success": False,

                "message":
                    "Assessment not found."

            }), 404

        if assessment.status != "WAITING_DOCTOR":

            return jsonify({

                "success": False,

                "message":
                    "This patient is not waiting for a doctor."

            }), 400

        assessment.status = "UNDER_CONSULTATION"

        db.session.commit()

        return jsonify({

            "success": True,

            "message":
                "Doctor consultation started.",

            "assessment":
                assessment.to_dict()

        }), 200

    except Exception as error:

        db.session.rollback()

        return jsonify({

            "success": False,

            "message":
                "Unable to start consultation.",

            "error":
                str(error)

        }), 500


# ============================================================
# COMPLETE CONSULTATION
# ============================================================

@doctor_bp.route(
    "/assessment/<int:assessment_id>/complete",
    methods=["PUT"]
)
def complete_consultation(
    assessment_id
):

    try:

        data = request.get_json(
            silent=True
        ) or {}

        consultation_notes = str(
            data.get(
                "consultation_notes",
                ""
            )
        ).strip()

        treatment_type = str(
            data.get(
                "treatment_type",
                ""
            )
        ).strip().upper()

        assessment = Assessment.query.get(
            assessment_id
        )

        if not assessment:

            return jsonify({

                "success": False,

                "message":
                    "Assessment not found."

            }), 404

        if treatment_type not in [
            "OPD",
            "IPD"
        ]:

            return jsonify({

                "success": False,

                "message":
                    "Treatment type must be OPD or IPD."

            }), 400

        if not consultation_notes:

            return jsonify({

                "success": False,

                "message":
                    "Consultation notes are required."

            }), 400

        # ----------------------------------------------------
        # CURRENTLY STORE THE CONSULTATION STATUS
        # ----------------------------------------------------

        assessment.status = (
            "OPD"
            if treatment_type == "OPD"
            else "IPD"
        )

        db.session.commit()

        return jsonify({

            "success": True,

            "message":
                "Doctor consultation completed.",

            "patient_id":
                assessment.patient_id,

            "treatment_type":
                treatment_type,

            "consultation_notes":
                consultation_notes,

            "assessment":
                assessment.to_dict(),

            "next_step":
                (
                    "PRESCRIPTION"
                    if treatment_type == "OPD"
                    else "IPD_ADMISSION"
                )

        }), 200

    except Exception as error:

        db.session.rollback()

        return jsonify({

            "success": False,

            "message":
                "Unable to complete consultation.",

            "error":
                str(error)

        }), 500   