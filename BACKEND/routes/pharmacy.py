from flask import Blueprint, request, jsonify

from extensions import db

from models.medicine import Medicine
from models.prescription import Prescription


pharmacy_bp = Blueprint(
    "pharmacy",
    __name__,
    url_prefix="/api/pharmacy"
)


# ============================================================
# ADD MEDICINE
# ============================================================

@pharmacy_bp.route(
    "/medicine",
    methods=["POST"]
)
def add_medicine():

    try:

        data = request.get_json(
            silent=True
        ) or {}

        medicine_code = str(
            data.get(
                "medicine_code",
                ""
            )
        ).strip()

        medicine_name = str(
            data.get(
                "medicine_name",
                ""
            )
        ).strip()

        category = str(
            data.get(
                "category",
                ""
            )
        ).strip()

        manufacturer = str(
            data.get(
                "manufacturer",
                ""
            )
        ).strip()

        batch_number = str(
            data.get(
                "batch_number",
                ""
            )
        ).strip()

        quantity = data.get(
            "quantity",
            0
        )

        unit_price = data.get(
            "unit_price",
            0
        )

        if not medicine_code:

            return jsonify({
                "success": False,
                "message":
                    "Medicine code is required."
            }), 400

        if not medicine_name:

            return jsonify({
                "success": False,
                "message":
                    "Medicine name is required."
            }), 400

        existing = Medicine.query.filter_by(
            medicine_code=medicine_code
        ).first()

        if existing:

            return jsonify({
                "success": False,
                "message":
                    "Medicine code already exists."
            }), 409

        medicine = Medicine(

            medicine_code=medicine_code,

            medicine_name=medicine_name,

            category=category or None,

            manufacturer=(
                manufacturer or None
            ),

            batch_number=(
                batch_number or None
            ),

            quantity=int(quantity),

            unit_price=float(unit_price)

        )

        db.session.add(medicine)

        db.session.commit()

        return jsonify({

            "success": True,

            "message":
                "Medicine added successfully.",

            "medicine":
                medicine.to_dict()

        }), 201

    except Exception as error:

        db.session.rollback()

        return jsonify({

            "success": False,

            "message":
                "Unable to add medicine.",

            "error":
                str(error)

        }), 500


# ============================================================
# MEDICINE LIST
# ============================================================

@pharmacy_bp.route(
    "/medicines",
    methods=["GET"]
)
def get_medicines():

    try:

        medicines = (
            Medicine.query
            .filter_by(
                is_active=True
            )
            .order_by(
                Medicine.medicine_name.asc()
            )
            .all()
        )

        return jsonify({

            "success": True,

            "total":
                len(medicines),

            "medicines": [

                medicine.to_dict()

                for medicine
                in medicines

            ]

        }), 200

    except Exception as error:

        return jsonify({

            "success": False,

            "message":
                str(error)

        }), 500


# ============================================================
# PENDING PRESCRIPTIONS
# ============================================================

@pharmacy_bp.route(
    "/prescriptions",
    methods=["GET"]
)
def pending_prescriptions():

    try:

        prescriptions = (
            Prescription.query
            .filter_by(
                status="PENDING_PHARMACY"
            )
            .order_by(
                Prescription.created_at.asc()
            )
            .all()
        )

        return jsonify({

            "success": True,

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
                "Unable to load prescriptions.",

            "error":
                str(error)

        }), 500


# ============================================================
# DISPENSE PRESCRIPTION
# ============================================================

@pharmacy_bp.route(
    "/prescription/<int:prescription_id>/dispense",
    methods=["PUT"]
)
def dispense_prescription(
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

        if prescription.status != "PENDING_PHARMACY":

            return jsonify({

                "success": False,

                "message":
                    "Prescription is already processed."

            }), 400

        prescription.status = "DISPENSED"

        db.session.commit()

        return jsonify({

            "success": True,

            "message":
                "Prescription marked as dispensed.",

            "prescription":
                prescription.to_dict(),

            "next_step":
                "BILLING"

        }), 200

    except Exception as error:

        db.session.rollback()

        return jsonify({

            "success": False,

            "message":
                "Unable to dispense prescription.",

            "error":
                str(error)

        }), 500