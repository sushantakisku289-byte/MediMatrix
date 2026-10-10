from flask import Blueprint, request, jsonify

from extensions import db

from models.patient import Patient


nurse_bp = Blueprint(
    "nurse",
    __name__,
    url_prefix="/api/nurse"
)


# ============================================================
# NURSE PATIENT QUEUE
# ============================================================

@nurse_bp.route(
    "/patients",
    methods=["GET"]
)
def nurse_patient_queue():

    try:

        patients = (
            Patient.query
            .filter_by(
                status="REGISTERED"
            )
            .order_by(
                Patient.id.asc()
            )
            .all()
        )

        return jsonify({

            "success": True,

            "total":
                len(patients),

            "patients": [

                patient.to_dict()

                for patient in patients

            ]

        }), 200

    except Exception as error:

        return jsonify({

            "success": False,

            "message":
                "Unable to load nurse patient queue.",

            "error":
                str(error)

        }), 500


# ============================================================
# GET PATIENT FOR NURSE
# ============================================================

@nurse_bp.route(
    "/patient/<string:patient_id>",
    methods=["GET"]
)
def nurse_patient(patient_id):

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

        return jsonify({

            "success": True,

            "patient":
                patient.to_dict()

        }), 200

    except Exception as error:

        return jsonify({

            "success": False,

            "message":
                "Unable to load patient.",

            "error":
                str(error)

        }), 500


# ============================================================
# MARK PATIENT AS BEING ASSESSED
# ============================================================

@nurse_bp.route(
    "/patient/<string:patient_id>/start",
    methods=["PUT"]
)
def start_patient_assessment(patient_id):

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

        if patient.status != "REGISTERED":

            return jsonify({

                "success": False,

                "message":
                    "Patient is not waiting for nurse assessment."

            }), 400

        patient.status = "UNDER_ASSESSMENT"

        db.session.commit()

        return jsonify({

            "success": True,

            "message":
                "Patient assessment started.",

            "patient":
                patient.to_dict()

        }), 200

    except Exception as error:

        db.session.rollback()

        return jsonify({

            "success": False,

            "message":
                "Unable to start assessment.",

            "error":
                str(error)

        }), 500


# ============================================================
# COMPLETE NURSE ASSESSMENT
# ============================================================

@nurse_bp.route(
    "/patient/<string:patient_id>/complete",
    methods=["PUT"]
)
def complete_nurse_assessment(patient_id):

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

        if patient.status not in [
            "REGISTERED",
            "UNDER_ASSESSMENT"
        ]:

            return jsonify({

                "success": False,

                "message":
                    "Patient cannot be assessed at this stage."

            }), 400

        patient.status = "ASSESSED"

        db.session.commit()

        return jsonify({

            "success": True,

            "message":
                "Nurse assessment completed.",

            "patient":
                patient.to_dict(),

            "next_step":
                "DOCTOR_QUEUE"

        }), 200

    except Exception as error:

        db.session.rollback()

        return jsonify({

            "success": False,

            "message":
                "Unable to complete nurse assessment.",

            "error":
                str(error)

        }), 500


# ============================================================
# NURSE DASHBOARD SUMMARY
# ============================================================

@nurse_bp.route(
    "/dashboard",
    methods=["GET"]
)
def nurse_dashboard():

    try:

        registered = Patient.query.filter_by(
            status="REGISTERED"
        ).count()

        under_assessment = Patient.query.filter_by(
            status="UNDER_ASSESSMENT"
        ).count()

        assessed = Patient.query.filter_by(
            status="ASSESSED"
        ).count()

        return jsonify({

            "success": True,

            "statistics": {

                "waiting":
                    registered,

                "under_assessment":
                    under_assessment,

                "assessed":
                    assessed,

                "total":
                    (
                        registered
                        + under_assessment
                        + assessed
                    )

            }

        }), 200

    except Exception as error:

        return jsonify({

            "success": False,

            "message":
                "Unable to load nurse dashboard.",

            "error":
                str(error)

        }), 500