from datetime import datetime

from flask import Blueprint, request, jsonify

from extensions import db

from models.billing import Bill
from models.patient import Patient
from models.prescription import Prescription


billing_bp = Blueprint(
    "billing",
    __name__,
    url_prefix="/api/billing"
)


# ============================================================
# GENERATE BILL NUMBER
# ============================================================

def generate_bill_number():

    last_bill = (
        Bill.query
        .order_by(Bill.id.desc())
        .first()
    )

    if not last_bill:
        number = 1
    else:
        number = last_bill.id + 1

    return f"MED-B-{number:06d}"


# ============================================================
# CREATE BILL
# ============================================================

@billing_bp.route(
    "/create",
    methods=["POST"]
)
def create_bill():

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

        prescription_id = data.get(
            "prescription_id"
        )

        consultation_charge = float(
            data.get(
                "consultation_charge",
                0
            ) or 0
        )

        medicine_charge = float(
            data.get(
                "medicine_charge",
                0
            ) or 0
        )

        admission_charge = float(
            data.get(
                "admission_charge",
                0
            ) or 0
        )

        other_charge = float(
            data.get(
                "other_charge",
                0
            ) or 0
        )

        discount = float(
            data.get(
                "discount",
                0
            ) or 0
        )

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

        if consultation_charge < 0:
            return jsonify({
                "success": False,
                "message":
                    "Invalid consultation charge."
            }), 400

        if medicine_charge < 0:
            return jsonify({
                "success": False,
                "message":
                    "Invalid medicine charge."
            }), 400

        if admission_charge < 0:
            return jsonify({
                "success": False,
                "message":
                    "Invalid admission charge."
            }), 400

        if other_charge < 0:
            return jsonify({
                "success": False,
                "message":
                    "Invalid other charge."
            }), 400

        if discount < 0:
            return jsonify({
                "success": False,
                "message":
                    "Invalid discount."
            }), 400

        # ----------------------------------------------------
        # CHECK PRESCRIPTION
        # ----------------------------------------------------

        if prescription_id:

            prescription = Prescription.query.get(
                prescription_id
            )

            if not prescription:

                return jsonify({
                    "success": False,
                    "message":
                        "Prescription not found."
                }), 404

        # ----------------------------------------------------
        # CALCULATE TOTAL
        # ----------------------------------------------------

        subtotal = (
            consultation_charge
            + medicine_charge
            + admission_charge
            + other_charge
        )

        total_amount = max(
            subtotal - discount,
            0
        )

        # ----------------------------------------------------
        # CREATE BILL
        # ----------------------------------------------------

        bill = Bill(

            bill_number=
                generate_bill_number(),

            patient_id=patient_id,

            prescription_id=
                prescription_id,

            consultation_charge=
                consultation_charge,

            medicine_charge=
                medicine_charge,

            admission_charge=
                admission_charge,

            other_charge=
                other_charge,

            discount=
                discount,

            total_amount=
                total_amount,

            payment_status=
                "PENDING"

        )

        db.session.add(bill)

        db.session.commit()

        return jsonify({

            "success": True,

            "message":
                "Bill created successfully.",

            "bill":
                bill.to_dict(),

            "next_step":
                "PAYMENT"

        }), 201

    except Exception as error:

        db.session.rollback()

        return jsonify({

            "success": False,

            "message":
                "Unable to create bill.",

            "error":
                str(error)

        }), 500


# ============================================================
# GET BILL
# ============================================================

@billing_bp.route(
    "/<int:bill_id>",
    methods=["GET"]
)
def get_bill(bill_id):

    try:

        bill = Bill.query.get(
            bill_id
        )

        if not bill:

            return jsonify({
                "success": False,
                "message":
                    "Bill not found."
            }), 404

        return jsonify({

            "success": True,

            "bill":
                bill.to_dict()

        }), 200

    except Exception as error:

        return jsonify({

            "success": False,

            "message":
                str(error)

        }), 500


# ============================================================
# PATIENT BILL HISTORY
# ============================================================

@billing_bp.route(
    "/patient/<string:patient_id>",
    methods=["GET"]
)
def patient_bills(patient_id):

    try:

        bills = (
            Bill.query
            .filter_by(
                patient_id=patient_id
            )
            .order_by(
                Bill.id.desc()
            )
            .all()
        )

        return jsonify({

            "success": True,

            "patient_id":
                patient_id,

            "total":
                len(bills),

            "bills": [

                bill.to_dict()

                for bill in bills

            ]

        }), 200

    except Exception as error:

        return jsonify({

            "success": False,

            "message":
                str(error)

        }), 500


# ============================================================
# PAYMENT
# ============================================================

@billing_bp.route(
    "/<int:bill_id>/pay",
    methods=["PUT"]
)
def pay_bill(bill_id):

    try:

        data = request.get_json(
            silent=True
        ) or {}

        payment_method = str(
            data.get(
                "payment_method",
                ""
            )
        ).strip().upper()

        transaction_id = str(
            data.get(
                "transaction_id",
                ""
            )
        ).strip()

        allowed_methods = {
            "CASH",
            "UPI",
            "CARD",
            "NET_BANKING"
        }

        if payment_method not in allowed_methods:

            return jsonify({

                "success": False,

                "message":
                    "Invalid payment method."

            }), 400

        bill = Bill.query.get(
            bill_id
        )

        if not bill:

            return jsonify({

                "success": False,

                "message":
                    "Bill not found."

            }), 404

        if bill.payment_status == "PAID":

            return jsonify({

                "success": False,

                "message":
                    "Bill is already paid."

            }), 400

        bill.payment_method = (
            payment_method
        )

        bill.transaction_id = (
            transaction_id
            if transaction_id
            else None
        )

        bill.payment_status = "PAID"

        bill.paid_at = datetime.utcnow()

        db.session.commit()

        return jsonify({

            "success": True,

            "message":
                "Payment completed successfully.",

            "bill":
                bill.to_dict(),

            "next_step":
                "COMPLETED"

        }), 200

    except Exception as error:

        db.session.rollback()

        return jsonify({

            "success": False,

            "message":
                "Unable to complete payment.",

            "error":
                str(error)

        }), 500