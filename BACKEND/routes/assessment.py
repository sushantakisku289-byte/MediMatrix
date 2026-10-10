import os

from flask import (
    Blueprint,
    request,
    jsonify,
    current_app,
    send_file
)

from werkzeug.utils import secure_filename
from sqlalchemy import text

from extensions import db

from models.assessment import Assessment
from models.patient import Patient
from models.user import User
from models.notification import Notification

from services.priority import calculate_priority

assessment_bp = Blueprint(
    "assessment",
    __name__,
    url_prefix="/api/assessment"
)

# ============================================================
# NURSE ASSESSMENT + AUTOMATIC PRIORITY
# + DEPARTMENT-SPECIFIC DOCTOR NOTIFICATION
# ============================================================

@assessment_bp.route("/triage", methods=["POST"])
def triage_patient():

    try:

        data = request.get_json(silent=True) or {}

        # ====================================================
        # PATIENT
        # ====================================================

        patient_id = str(
            data.get("patient_id", "")
        ).strip()

        symptoms = str(
            data.get("symptoms", "")
        ).strip()

        # ====================================================
        # VITALS
        # ====================================================

        temperature = data.get("temperature")
        heart_rate = data.get("heart_rate")
        systolic_bp = data.get("systolic_bp")
        diastolic_bp = data.get("diastolic_bp")
        oxygen_saturation = data.get("oxygen_saturation")

        # ====================================================
        # DEPARTMENT
        # ====================================================

        department_from_request = str(
            data.get("department", "")
        ).strip()

        # ====================================================
        # NURSE OBSERVATION
        # ====================================================

        nurse_observation = str(
            data.get("nurse_observation", "")
        ).strip()

        # ====================================================
        # VALIDATION
        # ====================================================

        if not patient_id:

            return jsonify({
                "success": False,
                "message": "Patient ID is required."
            }), 400

        if not symptoms:

            return jsonify({
                "success": False,
                "message": "Symptoms are required."
            }), 400

        # ====================================================
        # FIND PATIENT
        # ====================================================

        patient = (
            Patient.query
            .filter_by(
                patient_id=patient_id
            )
            .first()
        )

        if not patient:

            return jsonify({
                "success": False,
                "message": "Patient not found."
            }), 404

        # ====================================================
        # FINAL DEPARTMENT
        # ====================================================

        final_department = (
            department_from_request
            or str(patient.department or "").strip()
        )

        if not final_department:

            return jsonify({
                "success": False,
                "message": (
                    "Patient department is missing. "
                    "Department analysis must be completed "
                    "before nurse submission."
                )
            }), 400

        # ====================================================
        # AUTOMATIC PRIORITY ANALYSIS
        # ====================================================

        triage_result = calculate_priority(

            symptoms=symptoms,

            temperature=temperature,

            heart_rate=heart_rate,

            systolic_bp=systolic_bp,

            diastolic_bp=diastolic_bp,

            oxygen_saturation=oxygen_saturation,

            nurse_observation=nurse_observation

        )

        priority = triage_result.get(
            "priority",
            "ROUTINE"
        )

        reasons = triage_result.get(
            "reasons",
            []
        )

        # Make sure reasons is always a list
        if not isinstance(reasons, list):

            reasons = [str(reasons)]

        # ====================================================
        # CREATE ASSESSMENT
        # ====================================================

        assessment_data = {

            "patient_id":
                patient_id,

            "symptoms":
                symptoms,

            "temperature":
                temperature,

            "heart_rate":
                heart_rate,

            "systolic_bp":
                systolic_bp,

            "diastolic_bp":
                diastolic_bp,

            "oxygen_saturation":
                oxygen_saturation,

            "priority":
                priority,

            "priority_reasons":
                "; ".join(
                    str(reason)
                    for reason in reasons
                ),

            "department":
                final_department,

            # IMPORTANT:
            # Doctor queue starts ONLY after
            # nurse submits assessment.
            "status":
                "WAITING_DOCTOR"
        }

        # ====================================================
        # NURSE OBSERVATION
        # ====================================================

        if hasattr(
            Assessment,
            "nurse_observation"
        ):

            assessment_data[
                "nurse_observation"
            ] = (
                nurse_observation
                if nurse_observation
                else None
            )

        # ====================================================
        # CREATE ASSESSMENT OBJECT
        # ====================================================

        assessment = Assessment(
            **assessment_data
        )

        # ====================================================
        # UPDATE PATIENT STATUS
        # ====================================================

        patient.registration_status = (
            "WAITING_DOCTOR"
        )

        # Keep department synchronized
        patient.department = final_department

        # ====================================================
        # ADD ASSESSMENT
        # ====================================================

        db.session.add(assessment)

        # Flush so assessment gets its database ID
        db.session.flush()

        # ====================================================
        # FIND DEPARTMENT IN DATABASE
        # ====================================================

        department_record = (
            db.session.execute(
                text("""
                    SELECT
                        id,
                        department_name
                    FROM departments
                    WHERE LOWER(
                        TRIM(department_name)
                    ) = LOWER(
                        TRIM(:department)
                    )
                    LIMIT 1
                """),
                {
                    "department":
                        final_department
                }
            )
            .mappings()
            .first()
        )

        # ====================================================
        # DEPARTMENT NOT FOUND
        # ====================================================

        if not department_record:

            db.session.rollback()

            return jsonify({
                "success": False,
                "message": (
                    f"Department '{final_department}' "
                    "was not found in the departments table."
                )
            }), 400

        department_id = (
            department_record["id"]
        )

        database_department_name = (
            department_record["department_name"]
        )

        # ====================================================
        # FIND ONLY MATCHING DOCTORS
        # ====================================================

        department_doctors = (
            User.query
            .filter(
                User.is_active == True,

                User.role.in_([
                    "DOCTOR",
                    "DOCTOR_HOD"
                ]),

                User.department_id
                == department_id
            )
            .all()
        )

        # ====================================================
        # CREATE DOCTOR NOTIFICATIONS
        #
        # IMPORTANT:
        # ONLY DOCTORS OF THE SAME DEPARTMENT
        # RECEIVE THIS NOTIFICATION.
        #
        # NO DOCTOR NOTIFICATION IS CREATED
        # BEFORE NURSE SUBMISSION.
        # ====================================================

        for doctor in department_doctors:

            doctor_notification = Notification(

                recipient_user_id=
                    doctor.id,

                recipient_role=
                    "DOCTOR",

                notification_type=
                    "PATIENT_READY_FOR_DOCTOR",

                title=
                    "New Patient Ready for Consultation",

                message=(
                    f"Patient "
                    f"{patient.patient_id} "
                    f"({patient.full_name}) "
                    f"is ready for doctor consultation. "

                    f"Department: "
                    f"{database_department_name}. "

                    f"Priority: "
                    f"{priority}. "

                    f"Symptoms: "
                    f"{symptoms}."
                ),

                patient_id=
                    patient.patient_id,

                patient_name=
                    patient.full_name,

                is_read=
                    False
            )

            # If the current Notification model
            # supports priority, store it.
            if hasattr(
                doctor_notification,
                "priority"
            ):
                doctor_notification.priority = (
                    priority
                )

            db.session.add(
                doctor_notification
            )

        # ====================================================
        # SAVE EVERYTHING
        # ====================================================

        db.session.commit()

        # ====================================================
        # SUCCESS RESPONSE
        # ====================================================

        return jsonify({

            "success":
                True,

            "message":
                (
                    "Nurse assessment saved "
                    "and patient routed to "
                    "the correct doctor department."
                ),

            "assessment":
                assessment.to_dict(),

            "patient_id":
                patient.patient_id,

            "patient_name":
                patient.full_name,

            "department":
                database_department_name,

            "department_id":
                department_id,

            "priority":
                priority,

            "priority_reasons":
                reasons,

            "notified_doctors":
                len(department_doctors),

            "status":
                "WAITING_DOCTOR",

            "next_step":
                "DOCTOR_QUEUE"

        }), 201

    except Exception as error:

        db.session.rollback()

        print(
            "=================================================="
        )

        print(
            "NURSE ASSESSMENT ERROR:"
        )

        print(
            repr(error)
        )

        print(
            "=================================================="
        )

        return jsonify({

            "success":
                False,

            "message":
                "Unable to save nurse assessment.",

            "error":
                str(error)

        }), 500


# ============================================================
# GET PATIENT ASSESSMENTS
# ============================================================

@assessment_bp.route(
    "/patient/<string:patient_id>",
    methods=["GET"]
)
def get_patient_assessments(patient_id):

    try:

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

            "patient_id":
                patient_id,

            "total":
                len(assessments),

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
                str(error)

        }), 500

# ============================================================
# PREVIOUS MEDICAL REPORT UPLOAD
# ============================================================

@assessment_bp.route(
    "/<int:assessment_id>/report",
    methods=["POST"]
)
def upload_previous_medical_report(assessment_id):

    try:

        # ====================================================
        # FIND ASSESSMENT
        # ====================================================

        assessment = (
            Assessment.query
            .filter_by(id=assessment_id)
            .first()
        )

        if not assessment:

            return jsonify({
                "success": False,
                "message": "Assessment not found."
            }), 404


        # ====================================================
        # CHECK FILE
        # ====================================================

        if "previous_report" not in request.files:

            return jsonify({
                "success": False,
                "message": (
                    "No medical report file was uploaded."
                )
            }), 400


        uploaded_file = request.files[
            "previous_report"
        ]


        if not uploaded_file:

            return jsonify({
                "success": False,
                "message": "Invalid uploaded file."
            }), 400


        if not uploaded_file.filename:

            return jsonify({
                "success": False,
                "message": "Please select a medical report."
            }), 400


        # ====================================================
        # ALLOWED FILE TYPES
        # ====================================================

        allowed_extensions = {
            "pdf",
            "jpg",
            "jpeg",
            "png"
        }


        original_filename = (
            uploaded_file.filename
        )


        safe_original_filename = secure_filename(
            original_filename
        )


        if not safe_original_filename:

            return jsonify({
                "success": False,
                "message": "Invalid file name."
            }), 400


        extension = (
            safe_original_filename
            .rsplit(".", 1)[-1]
            .lower()
            if "." in safe_original_filename
            else ""
        )


        if extension not in allowed_extensions:

            return jsonify({
                "success": False,
                "message": (
                    "Invalid report format. "
                    "Only PDF, JPG, JPEG and PNG "
                    "files are allowed."
                )
            }), 400


        # ====================================================
        # CREATE MEDICAL REPORT DIRECTORY
        # ====================================================

        upload_directory = os.path.join(
            current_app.root_path,
            "uploads",
            "medical_reports"
        )


        os.makedirs(
            upload_directory,
            exist_ok=True
        )


        # ====================================================
        # UNIQUE FILE NAME
        # ====================================================

        timestamp = (
            datetime.utcnow()
            .strftime("%Y%m%d%H%M%S")
        )


        stored_filename = (
            f"assessment_{assessment.id}_"
            f"{timestamp}.{extension}"
        )


        stored_file_path = os.path.join(
            upload_directory,
            stored_filename
        )


        # ====================================================
        # SAVE FILE
        # ====================================================

        uploaded_file.save(
            stored_file_path
        )


        # ====================================================
        # SAVE REPORT INFORMATION
        # ====================================================

        assessment.previous_report_filename = (
            stored_filename
        )

        assessment.previous_report_original_name = (
            safe_original_filename
        )

        assessment.previous_report_path = (
            stored_file_path
        )

        # OCR will be added separately.
        # Do not pretend OCR was processed here.

        assessment.previous_report_ocr_text = None


        db.session.commit()


        # ====================================================
        # SUCCESS
        # ====================================================

        return jsonify({

            "success": True,

            "message":
                "Previous medical report uploaded successfully.",

            "assessment_id":
                assessment.id,

            "patient_id":
                assessment.patient_id,

            "original_filename":
                safe_original_filename,

            "stored_filename":
                stored_filename,

            "report_url":
                f"/api/assessment/"
                f"{assessment.id}/report"

        }), 201


    except Exception as error:

        db.session.rollback()


        print(
            "=================================================="
        )

        print(
            "MEDICAL REPORT UPLOAD ERROR:"
        )

        print(
            repr(error)
        )

        print(
            "=================================================="
        )


        return jsonify({

            "success": False,

            "message":
                "Unable to upload medical report.",

            "error":
                str(error)

        }), 500

# ============================================================
# VIEW PREVIOUS MEDICAL REPORT
# ============================================================

@assessment_bp.route(
    "/<int:assessment_id>/report",
    methods=["GET"]
)
def view_previous_medical_report(assessment_id):

    try:

        # ====================================================
        # FIND ASSESSMENT
        # ====================================================

        assessment = (
            Assessment.query
            .filter_by(id=assessment_id)
            .first()
        )


        if not assessment:

            return jsonify({
                "success": False,
                "message": "Assessment not found."
            }), 404


        # ====================================================
        # CHECK REPORT
        # ====================================================

        report_path = (
            assessment.previous_report_path
        )


        if not report_path:

            return jsonify({
                "success": False,
                "message": (
                    "No previous medical report "
                    "has been uploaded."
                )
            }), 404


        if not os.path.isfile(report_path):

            return jsonify({
                "success": False,
                "message": (
                    "Medical report file "
                    "could not be found."
                )
            }), 404


        # ====================================================
        # SEND FILE
        # ====================================================

        return send_file(
            report_path,
            as_attachment=False,
            download_name=(
                assessment.previous_report_original_name
                or assessment.previous_report_filename
                or "medical_report"
            )
        )


    except Exception as error:

        print(
            "MEDICAL REPORT VIEW ERROR:",
            repr(error)
        )


        return jsonify({

            "success": False,

            "message":
                "Unable to open medical report.",

            "error":
                str(error)

        }), 500

# ============================================================
# DOCTOR QUEUE
# DEPARTMENT-SPECIFIC
# ============================================================

@assessment_bp.route(
    "/doctor-queue",
    methods=["GET"]
)
def doctor_queue():

    try:

        # ====================================================
        # GET LOGGED-IN DOCTOR ID
        # ====================================================

        doctor_id_value = str(
            request.args.get(
                "doctor_id",
                ""
            )
        ).strip()

        if not doctor_id_value:

            return jsonify({
                "success": False,
                "message": "Doctor ID is required."
            }), 400

        # ====================================================
        # FIND DOCTOR
        # ====================================================

        doctor = None

        # Numeric database ID
        if doctor_id_value.isdigit():

            doctor = User.query.filter_by(
                id=int(doctor_id_value)
            ).first()

        # User ID such as DOC001
        if doctor is None:

            doctor = User.query.filter_by(
                user_id=doctor_id_value
            ).first()

        if not doctor:

            return jsonify({
                "success": False,
                "message": "Doctor account not found."
            }), 404

        # ====================================================
        # VALIDATE ROLE
        # ====================================================

        if doctor.role not in [
            "DOCTOR",
            "DOCTOR_HOD"
        ]:

            return jsonify({
                "success": False,
                "message": "User is not a doctor."
            }), 403

        # ====================================================
        # GET DOCTOR DEPARTMENT
        # ====================================================

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
                        doctor.department_id
                }
            )
            .mappings()
            .first()
        )

        if not department_record:

            return jsonify({
                "success": False,
                "message": (
                    "Doctor department is not configured."
                )
            }), 400

        department_name = (
            department_record["department_name"]
        )

        # ====================================================
        # ONLY THIS DEPARTMENT'S PATIENTS
        # ====================================================

        assessments = (
            Assessment.query
            .filter(
                Assessment.status ==
                    "WAITING_DOCTOR",

                db.func.lower(
                    db.func.trim(
                        Assessment.department
                    )
                ) ==
                db.func.lower(
                    db.func.trim(
                        department_name
                    )
                )
            )
            .order_by(

                db.case(

                    (
                        Assessment.priority ==
                        "EMERGENCY",
                        1
                    ),

                    (
                        Assessment.priority ==
                        "URGENT",
                        2
                    ),

                    (
                        Assessment.priority ==
                        "MEDIUM",
                        3
                    ),

                    else_=4

                ),

                Assessment.created_at.asc()

            )
            .all()
        )

        # ====================================================
        # RESPONSE
        # ====================================================

        return jsonify({

            "success":
                True,

            "doctor_id":
                doctor.user_id,

            "doctor_name":
                doctor.full_name,

            "department":
                department_name,

            "total":
                len(assessments),

            "queue": [

                assessment.to_dict()

                for assessment
                in assessments

            ]

        }), 200

    except Exception as error:

        print(
            "DOCTOR QUEUE ERROR:",
            repr(error)
        )

        return jsonify({

            "success":
                False,

            "message":
                "Unable to load doctor queue.",

            "error":
                str(error)

        }), 500
# ============================================================
# NURSE DASHBOARD STATISTICS
# ============================================================

@assessment_bp.route(
    "/stats/today",
    methods=["GET"]
)
def assessment_statistics_today():

    try:

        from datetime import datetime, timedelta

        now = datetime.utcnow()

        today_start = datetime(
            now.year,
            now.month,
            now.day
        )

        tomorrow_start = (
            today_start +
            timedelta(days=1)
        )

        assessed_today = (
            Assessment.query
            .filter(
                Assessment.created_at >=
                today_start,

                Assessment.created_at <
                tomorrow_start
            )
            .count()
        )

        return jsonify({

            "success": True,

            "assessed_today":
                assessed_today

        }), 200

    except Exception as error:

        return jsonify({

            "success": False,

            "message":
                "Unable to load assessment statistics.",

            "error":
                str(error)

        }), 500