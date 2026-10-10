from flask import Blueprint, request, jsonify

from extensions import db

from models.prescription import Prescription
from models.assessment import Assessment
from models.patient import Patient


prescription_bp = Blueprint(
    "prescription",
    __name__,
    url_prefix="/api/prescriptions"
)


# ============================================================
# CREATE PRESCRIPTION
# ============================================================

@prescription_bp.route(
    "/create",
    methods=["POST"]
)
def create_prescription():

    try:

        data = request.get_json(
            silent=True
        ) or {}

        patient_id = str(
            data.get(
                "patient_id",
                ""
            )
        ).strip()

        assessment_id = data.get(
            "assessment_id"
        )

        doctor_user_id = str(
            data.get(
                "doctor_user_id",
                ""
            )
        ).strip()

        treatment_type = str(
            data.get(
                "treatment_type",
                ""
            )
        ).strip().upper()

        diagnosis = str(
            data.get(
                "diagnosis",
                ""
            )
        ).strip()

        consultation_notes = str(
            data.get(
                "consultation_notes",
                ""
            )
        ).strip()

        medicines = data.get(
            "medicines",
            []
        )

        instructions = str(
            data.get(
                "instructions",
                ""
            )
        ).strip()

        # ----------------------------------------------------
        # VALIDATION
        # ----------------------------------------------------

        if not patient_id:

            return jsonify({
                "success": False,
                "message":
                    "Patient ID is required."
            }), 400

        patient = Patient.query.filter_by(
            patient_id=patient_id
        ).first()

        if not patient:

            return jsonify({
                "success": False,
                "message":
                    "Patient not found."
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

        if not diagnosis:

            return jsonify({
                "success": False,
                "message":
                    "Diagnosis is required."
            }), 400

        # ----------------------------------------------------
        # CONVERT MEDICINES TO JSON TEXT
        # ----------------------------------------------------

        import json

        if not isinstance(
            medicines,
            list
        ):

            medicines = []

        medicines_text = json.dumps(
            medicines
        )

        # ----------------------------------------------------
        # CREATE PRESCRIPTION
        # ----------------------------------------------------

        prescription = Prescription(

            patient_id=patient_id,

            assessment_id=assessment_id,

            doctor_user_id=(
                doctor_user_id
                if doctor_user_id
                else None
            ),

            treatment_type=treatment_type,

            diagnosis=diagnosis,

            consultation_notes=(
                consultation_notes
                if consultation_notes
                else None
            ),

            medicines=medicines_text,

            instructions=(
                instructions
                if instructions
                else None
            ),

            status="PENDING_PHARMACY"

        )

        db.session.add(
            prescription
        )

        # ----------------------------------------------------
        # UPDATE ASSESSMENT
        # ----------------------------------------------------

        if assessment_id:

            assessment = Assessment.query.get(
                assessment_id
            )

            if assessment:

                assessment.status = (
                    "PRESCRIPTION_CREATED"
                )

        db.session.commit()

        return jsonify({

            "success": True,

            "message":
                "Prescription created successfully.",

            "prescription":
                prescription.to_dict(),

            "next_step":
                "MEDICINE_STORE"

        }), 201

    except Exception as error:

        db.session.rollback()

        return jsonify({

            "success": False,

            "message":
                "Unable to create prescription.",

            "error":
                str(error)

        }), 500


# ============================================================
# GET PRESCRIPTION
# ============================================================

@prescription_bp.route(
    "/<int:prescription_id>",
    methods=["GET"]
)
def get_prescription(
    prescription_id
):

    try:

        prescription = Prescription.query.get(
            prescription_id
        )

        if not prescription:

            return jsonify({
                "success": False,
                "message":
                    "Prescription not found."
            }), 404

        return jsonify({

            "success": True,

            "prescription":
                prescription.to_dict()

        }), 200

    except Exception as error:

        return jsonify({

            "success": False,

            "message":
                str(error)

        }), 500


# ============================================================
# PATIENT PRESCRIPTIONS
# ============================================================

@prescription_bp.route(
    "/patient/<string:patient_id>",
    methods=["GET"]
)
def patient_prescriptions(
    patient_id
):

    try:

        prescriptions = (
            Prescription.query
            .filter_by(
                patient_id=patient_id
            )
            .order_by(
                Prescription.id.desc()
            )
            .all()
        )

        return jsonify({

            "success": True,

            "patient_id":
                patient_id,

            "total":
                len(prescriptions),

            "prescriptions": [

                prescription.to_dict()

                for prescription
                in prescriptions

            ]

        }), 200

    except Exception as error:

        return jsonify({

            "success": False,

            "message":
                str(error)

        }), 500