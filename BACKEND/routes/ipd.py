from datetime import datetime

from flask import Blueprint, request, jsonify

from extensions import db

from models.ipd import Bed, IPDAdmission
from models.patient import Patient
from models.user import User
from models.notification import Notification

ipd_bp = Blueprint(
    "ipd",
    __name__,
    url_prefix="/api/ipd"
)


# ============================================================
# IPD WARD RATES
# ============================================================

WARD_RATES = {
    "GENERAL WARD": 300.00,
    "ICU": 500.00,
    "EMERGENCY": 700.00,
    "SEMI-PRIVATE WARD": 800.00,
    "PRIVATE WARD": 1200.00
}


# ============================================================
# NORMALIZE WARD NAME
# ============================================================

def normalize_ward(ward):

    value = str(
        ward or ""
    ).strip().upper()

    aliases = {
        "GENERAL": "GENERAL WARD",
        "GENERAL WARD": "GENERAL WARD",

        "ICU": "ICU",

        "EMERGENCY": "EMERGENCY",

        "SEMI PRIVATE": "SEMI-PRIVATE WARD",
        "SEMI-PRIVATE": "SEMI-PRIVATE WARD",
        "SEMI-PRIVATE WARD": "SEMI-PRIVATE WARD",

        "PRIVATE": "PRIVATE WARD",
        "PRIVATE WARD": "PRIVATE WARD"
    }

    return aliases.get(
        value,
        value
    )


# ============================================================
# GET WARD RATE
# ============================================================

def get_ward_rate(ward):

    normalized = normalize_ward(
        ward
    )

    return WARD_RATES.get(
        normalized
    )


# ============================================================
# GENERATE ADMISSION NUMBER
# ============================================================

def generate_admission_number():

    last_admission = (
        IPDAdmission.query
        .order_by(
            IPDAdmission.id.desc()
        )
        .first()
    )

    if not last_admission:

        number = 1

    else:

        number = (
            last_admission.id + 1
        )

    return (
        f"MED-IPD-{number:06d}"
    )


@ipd_bp.route("/request", methods=["POST"])
def create_ipd_request():

    try:

        data = request.get_json(silent=True) or {}

        patient_public_id = str(
            data.get("patient_id", "")
        ).strip()

        assessment_id = data.get("assessment_id")

        doctor_user_id = str(
            data.get("doctor_user_id", "")
        ).strip()

        ward_type = normalize_ward(
            data.get("ward_type", "")
        )

        expected_days = data.get("expected_days")

        diagnosis = str(
            data.get("diagnosis", "")
        ).strip()

        admission_reason = str(
            data.get("admission_reason", "")
        ).strip()

        # --------------------------------------------------------
        # VALIDATION
        # --------------------------------------------------------

        if not patient_public_id:
            return jsonify({
                "success": False,
                "message": "Patient ID is required."
            }), 400

        patient = (
            Patient.query
            .filter_by(
                patient_id=patient_public_id
            )
            .first()
        )

        if not patient:
            return jsonify({
                "success": False,
                "message": "Patient not found."
            }), 404

        if not ward_type:
            return jsonify({
                "success": False,
                "message": "Ward type is required."
            }), 400

        daily_rate = get_ward_rate(ward_type)

        if daily_rate is None:
            return jsonify({
                "success": False,
                "message": "Invalid ward type."
            }), 400

        try:
            expected_days = int(expected_days)

        except (TypeError, ValueError):

            return jsonify({
                "success": False,
                "message": "Expected days must be a valid number."
            }), 400

        if expected_days < 1:
            return jsonify({
                "success": False,
                "message": "Expected stay must be at least 1 day."
            }), 400

        # --------------------------------------------------------
        # CALCULATE ESTIMATED WARD CHARGE
        # --------------------------------------------------------

        estimated_charge = (
            daily_rate * expected_days
        )

        # --------------------------------------------------------
        # CREATE IPD REQUEST
        # --------------------------------------------------------

        admission = IPDAdmission(
            patient_id=patient.id,
            assessment_id=assessment_id,
            admission_number=generate_admission_number(),

            doctor_user_id=(
                doctor_user_id
                if doctor_user_id
                else None
            ),

            ward_type=ward_type,
            ward_name=ward_type,

            expected_days=expected_days,

            daily_rate=daily_rate,

            estimated_ward_charge=estimated_charge,

            diagnosis=(
                diagnosis
                if diagnosis
                else None
            ),

            admission_reason=(
                admission_reason
                if admission_reason
                else None
            ),

            billing_status="PENDING",
            payment_status="PENDING",
            verification_status="PENDING",

            status="BILLING_PENDING"
        )

        db.session.add(admission)

        # --------------------------------------------------------
        # NOTIFY BILLING STAFF
        # --------------------------------------------------------

        billing_users = (
            User.query
            .filter(
                User.is_active == True,
                User.role == "BILLING"
            )
            .all()
        )

        for billing_user in billing_users:

            billing_notification = Notification(

                recipient_user_id=billing_user.id,

                recipient_role="BILLING",

                notification_type="IPD_BILLING_REQUEST",

                title="New IPD Billing Request",

                message=(
                    f"Patient "
                    f"{patient.patient_id} "
                    f"({patient.full_name}) "
                    f"has been selected for IPD. "

                    f"Ward: "
                    f"{ward_type}. "

                    f"Expected Stay: "
                    f"{expected_days} day(s). "

                    f"Daily Rate: "
                    f"₹{daily_rate:.2f}. "

                    f"Estimated Ward Charge: "
                    f"₹{estimated_charge:.2f}. "

                    f"Please assign an available bed "
                    f"and process the IPD bill/payment."
                ),

                patient_id=patient.patient_id,

                patient_name=patient.full_name,

                is_read=False
            )

            db.session.add(
                billing_notification
            )

        # --------------------------------------------------------
        # SAVE REQUEST + NOTIFICATIONS
        # --------------------------------------------------------

        db.session.commit()

        return jsonify({

            "success": True,

            "message": (
                "IPD request sent to Billing."
            ),

            "admission": (
                admission.to_dict()
            ),

            "patient": {

                "id": patient.id,

                "patient_id": (
                    patient.patient_id
                ),

                "full_name": (
                    patient.full_name
                )
            },

            "next_step": "BILLING"

        }), 201

    except Exception as error:

        db.session.rollback()

    print("\n" + "=" * 70)
    print("IPD BED ASSIGNMENT ERROR")
    print("=" * 70)
    print("Admission ID:", admission_id)
    print("Error:", repr(error))
    print("=" * 70 + "\n")

    return jsonify({
        "success": False,
        "message": "Unable to assign bed.",
        "error": str(error)
    }), 500


# ============================================================
# GET ALL BEDS
# ============================================================

@ipd_bp.route(
    "/beds",
    methods=["GET"]
)
def get_beds():

    try:

        ward = request.args.get(
            "ward",
            ""
        ).strip()

        query = Bed.query

        if ward:

            normalized_ward = (
                normalize_ward(ward)
            )

            query = query.filter(
                db.func.upper(
                    Bed.ward
                ) == normalized_ward
            )

        beds = (
            query
            .order_by(
                Bed.ward.asc(),
                Bed.room_number.asc(),
                Bed.bed_number.asc()
            )
            .all()
        )

        return jsonify({

            "success": True,

            "total":
                len(beds),

            "available":
                len([
                    bed
                    for bed in beds
                    if bed.status == "AVAILABLE"
                ]),

            "beds": [
                bed.to_dict()
                for bed in beds
            ]

        }), 200

    except Exception as error:

        return jsonify({

            "success": False,

            "message":
                str(error)

        }), 500


# ============================================================
# GET ONLY AVAILABLE BEDS FOR A WARD
# ============================================================

@ipd_bp.route(
    "/beds/available",
    methods=["GET"]
)
def get_available_beds():

    try:

        ward = request.args.get(
            "ward",
            ""
        ).strip()

        if not ward:

            return jsonify({
                "success": False,
                "message":
                    "Ward is required."
            }), 400

        normalized_ward = (
            normalize_ward(ward)
        )

        beds = (
            Bed.query
            .filter(
                db.func.upper(
                    Bed.ward
                ) == normalized_ward,
                Bed.status == "AVAILABLE"
            )
            .order_by(
                Bed.room_number.asc(),
                Bed.bed_number.asc()
            )
            .all()
        )

        return jsonify({

            "success": True,

            "ward":
                normalized_ward,

            "total":
                len(beds),

            "beds": [
                bed.to_dict()
                for bed in beds
            ]

        }), 200

    except Exception as error:

        return jsonify({

            "success": False,

            "message":
                str(error)

        }), 500


# ============================================================
# GET WARD RATES
# ============================================================

@ipd_bp.route(
    "/ward-rates",
    methods=["GET"]
)
def get_ward_rates():

    return jsonify({

        "success": True,

        "rates": [
            {
                "ward":
                    ward,

                "daily_rate":
                    rate
            }

            for ward, rate
            in WARD_RATES.items()
        ]

    }), 200
# ============================================================
# GET IPD REQUESTS FOR BILLING
# ============================================================

@ipd_bp.route(
    "/requests",
    methods=["GET"]
)
def get_ipd_requests():

    try:

        status = request.args.get(
            "status",
            ""
        ).strip().upper()

        query = IPDAdmission.query

        if status:

            query = query.filter_by(
                status=status
            )

        else:

            query = query.filter(
                IPDAdmission.status.in_([
                    "REQUESTED",
                    "BILLING_PENDING",
                    "PAYMENT_PENDING",
                    "IPD_VERIFICATION"
                ])
            )

        requests = (
            query
            .order_by(
                IPDAdmission.id.desc()
            )
            .all()
        )

        result = []

        for admission in requests:

            patient = (
                Patient.query
                .filter_by(
                    id=admission.patient_id
                )
                .first()
            )

            item = admission.to_dict()

            if patient:

                item["patient"] = {
                    "id":
                        patient.id,

                    "patient_id":
                        patient.patient_id,

                    "full_name":
                        patient.full_name,

                    "phone":
                        patient.phone
                }

            result.append(
                item
            )

        return jsonify({

            "success": True,

            "total":
                len(result),

            "requests":
                result

        }), 200

    except Exception as error:

        return jsonify({

            "success": False,

            "message":
                str(error)

        }), 500


# ============================================================
# ASSIGN BED FROM BILLING
# ============================================================

@ipd_bp.route(
    "/request/<int:admission_id>/bed",
    methods=["PUT"]
)
def assign_bed(admission_id):

    try:

        admission = (
            IPDAdmission.query
            .get(admission_id)
        )

        if not admission:

            return jsonify({
                "success": False,
                "message":
                    "IPD request not found."
            }), 404

        if admission.status not in [
            "BILLING_PENDING",
            "PAYMENT_PENDING"
        ]:

            return jsonify({
                "success": False,
                "message":
                    "This IPD request is not ready for bed assignment."
            }), 400

        data = (
            request.get_json(
                silent=True
            ) or {}
        )

        bed_id = data.get(
            "bed_id"
        )

        if not bed_id:

            return jsonify({
                "success": False,
                "message":
                    "Bed ID is required."
            }), 400

        bed = (
            Bed.query
            .get(bed_id)
        )

        if not bed:

            return jsonify({
                "success": False,
                "message":
                    "Bed not found."
            }), 404

        # ----------------------------------------------------
        # CRITICAL AVAILABILITY CHECK
        # ----------------------------------------------------

        if bed.status != "AVAILABLE":

            return jsonify({
                "success": False,
                "message":
                    "Selected bed is no longer available."
            }), 409

        requested_ward = normalize_ward(
            admission.ward_type
        )

        actual_ward = normalize_ward(
            bed.ward
        )

        if requested_ward != actual_ward:

            return jsonify({
                "success": False,
                "message":
                    "Selected bed does not belong to the doctor's selected ward."
            }), 400

        admission.bed_id = (
            bed.id
        )

        admission.bed_number = (
            bed.bed_number
        )

        admission.room_number = (
            bed.room_number
        )

        admission.ward_name = (
            bed.ward
        )

        # ----------------------------------------------------
        # RESERVE BED
        # ----------------------------------------------------
        # Billing has selected this bed.
        # It must no longer appear as AVAILABLE.
        # IPD has not yet confirmed physical admission.
        # ----------------------------------------------------

        bed.status = "RESERVED"

        admission.billing_status = (
            "BED_ASSIGNED"
        )

        admission.status = (
            "PAYMENT_PENDING"
        )

        db.session.commit()

        return jsonify({

            "success": True,

            "message":
                "Bed assigned successfully. Proceed with billing/payment.",

            "admission":
                admission.to_dict(),

            "bed":
                bed.to_dict(),

            "next_step":
                "PAYMENT"

        }), 200
    except Exception as error:

        db.session.rollback()

        print("\n" + "=" * 70)
        print("IPD BED ASSIGNMENT ERROR")
        print("=" * 70)
        print("Admission ID:", admission_id)
        print("ERROR:", repr(error))
        print("=" * 70 + "\n")

        import traceback
        traceback.print_exc()

        return jsonify({
            "success": False,
            "message": "Unable to assign bed.",
            "error": str(error)
        }), 500

# ============================================================
# MARK BILLING / PAYMENT INFORMATION
# ============================================================

@ipd_bp.route(
    "/request/<int:admission_id>/billing",
    methods=["PUT"]
)
def update_billing_status(admission_id):

    try:

        admission = (
            IPDAdmission.query
            .get(admission_id)
        )

        if not admission:

            return jsonify({
                "success": False,
                "message":
                    "IPD request not found."
            }), 404

        data = (
            request.get_json(
                silent=True
            ) or {}
        )

        bill_id = data.get(
            "bill_id"
        )

        payment_status = str(
            data.get(
                "payment_status",
                admission.payment_status
            )
        ).strip().upper()
        previous_payment_status = str(
    admission.payment_status or ""
).strip().upper()

        if bill_id:

            admission.bill_id = (
                bill_id
            )

        admission.payment_status = (
            payment_status
        )

        admission.billing_status = (
            "COMPLETED"
        )

        if payment_status == "PAID":

            admission.status = (
                "IPD_VERIFICATION"
            )

        else:

            admission.status = (
                "PAYMENT_PENDING"
            )
        
                # ====================================================
        # IPD NOTIFICATION AFTER PAYMENT
        # ====================================================

        if (
            payment_status == "PAID"
            and previous_payment_status != "PAID"
        ):

            patient = Patient.query.filter_by(
                id=admission.patient_id
            ).first()


            ipd_users = User.query.filter(
    User.is_active == True,
    User.role.in_([
        "IPD",
        "IPD_STAFF",
        "IPD_HOD"
    ])
).all()


            if patient:

                for ipd_user in ipd_users:

                    notification = Notification(
                        recipient_user_id=ipd_user.id,
                        recipient_role="IPD",
                        notification_type="IPD_ADMISSION_READY",
                        title="IPD Admission Ready",
                        message=(
                            f"Payment completed for "
                            f"{patient.patient_id} "
                            f"({patient.full_name}). "
                            f"Ward: "
                            f"{admission.ward_name or 'N/A'}. "
                            f"Room: "
                            f"{admission.room_number or 'N/A'}. "
                            f"Bed: "
                            f"{admission.bed_number or 'N/A'}. "
                            f"Bill ID: "
                            f"{admission.bill_id or 'N/A'}. "
                            "Please verify and confirm admission."
                        ),
                        patient_id=patient.patient_id,
                        patient_name=patient.full_name,
                        is_read=False
                    )

                    db.session.add(
                        notification
                    )
        db.session.commit()

        return jsonify({

            "success": True,

            "message":
                "IPD billing information updated.",

            "admission":
                admission.to_dict(),

            "next_step": (
                "IPD_VERIFICATION"
                if payment_status == "PAID"
                else "PAYMENT"
            )

        }), 200

    except Exception as error:

        db.session.rollback()

        return jsonify({

            "success": False,

            "message":
                "Unable to update billing information.",

            "error":
                str(error)

        }), 500


# ============================================================
# IPD VERIFICATION
# ============================================================

@ipd_bp.route(
    "/request/<int:admission_id>/verify",
    methods=["PUT"]
)
def verify_ipd_request(admission_id):

    try:

        admission = IPDAdmission.query.get(admission_id)

        if not admission:
            return jsonify({
                "success": False,
                "message": "IPD request not found."
            }), 404

        if admission.status != "IPD_VERIFICATION":
            return jsonify({
                "success": False,
                "message": "This IPD request is not ready for verification."
            }), 400

        if not admission.bed_id:
            return jsonify({
                "success": False,
                "message": "No bed has been assigned."
            }), 400

        if admission.payment_status != "PAID":
            return jsonify({
                "success": False,
                "message": "Payment must be completed before IPD verification."
            }), 400

        data = request.get_json(silent=True) or {}

        verifier_identifier = data.get("verified_by")

        verifier_user_id = None

        # --------------------------------------------------------
        # RESOLVE IPD USER
        # Frontend may send IPD001, username, or numeric DB id.
        # Database stores the actual users.id.
        # --------------------------------------------------------

        if verifier_identifier:

            identifier = str(verifier_identifier).strip()

            verifier = None

            # Numeric database user ID
            if identifier.isdigit():
                verifier = User.query.get(int(identifier))

            # User code such as IPD001
            if verifier is None:
                verifier = User.query.filter_by(
                    user_id=identifier
                ).first()

            # Username fallback
            if verifier is None:
                verifier = User.query.filter_by(
                    username=identifier
                ).first()

            if verifier:
                verifier_user_id = verifier.id

        # --------------------------------------------------------
        # UPDATE VERIFICATION
        # --------------------------------------------------------

        admission.verification_status = "VERIFIED"

        admission.verified_by = verifier_user_id

        admission.verified_at = datetime.utcnow()

        db.session.commit()

        return jsonify({
            "success": True,
            "message": "IPD request verified successfully.",
            "admission": admission.to_dict(),
            "next_step": "CONFIRM_ADMISSION"
        }), 200

    except Exception as error:

        db.session.rollback()

        print(
            "IPD VERIFICATION ERROR:",
            repr(error)
        )

        return jsonify({
            "success": False,
            "message": "Unable to verify IPD request.",
            "error": str(error)
        }), 500

# ============================================================
# CONFIRM IPD ADMISSION
# ============================================================

@ipd_bp.route(
    "/request/<int:admission_id>/confirm",
    methods=["PUT"]
)
def confirm_ipd_admission(admission_id):

    try:

        # --------------------------------------------------------
        # FIND IPD ADMISSION
        # --------------------------------------------------------

        admission = IPDAdmission.query.get(admission_id)

        if not admission:
            return jsonify({
                "success": False,
                "message": "IPD request not found."
            }), 404

        # --------------------------------------------------------
        # VERIFY WORKFLOW
        # --------------------------------------------------------

        if admission.verification_status != "VERIFIED":
            return jsonify({
                "success": False,
                "message": "IPD request must be verified before admission."
            }), 400

        if admission.payment_status != "PAID":
            return jsonify({
                "success": False,
                "message": "Payment has not been completed."
            }), 400

        if not admission.bed_id:
            return jsonify({
                "success": False,
                "message": "No bed assigned."
            }), 400

        # --------------------------------------------------------
        # FIND BED
        # --------------------------------------------------------

        bed = Bed.query.get(admission.bed_id)

        if not bed:
            return jsonify({
                "success": False,
                "message": "Assigned bed not found."
            }), 404

        # --------------------------------------------------------
        # FINAL BED AVAILABILITY CHECK
        # --------------------------------------------------------

        if bed.status != "AVAILABLE":
            return jsonify({
                "success": False,
                "message": "Assigned bed is no longer available."
            }), 409

        # --------------------------------------------------------
        # GET IPD STAFF USER
        # Frontend may send:
        # IPD001 / username / numeric users.id
        # --------------------------------------------------------

        data = request.get_json(silent=True) or {}

        admitted_identifier = data.get("admitted_by")

        admitted_user_id = None

        if admitted_identifier:

            identifier = str(
                admitted_identifier
            ).strip()

            admitted_user = None

            # Numeric database ID
            if identifier.isdigit():

                admitted_user = User.query.get(
                    int(identifier)
                )

            # User ID such as IPD001
            if admitted_user is None:

                admitted_user = User.query.filter_by(
                    user_id=identifier
                ).first()

            # Username fallback
            if admitted_user is None:

                admitted_user = User.query.filter_by(
                    username=identifier
                ).first()

            if admitted_user:

                admitted_user_id = admitted_user.id

        # --------------------------------------------------------
        # FINAL IPD ADMISSION
        # --------------------------------------------------------

        admission.status = "ADMITTED"

        admission.admitted_by = admitted_user_id

        admission.admitted_at = datetime.utcnow()

        admission.admission_date = datetime.utcnow()

        admission.verification_status = "VERIFIED"

        # --------------------------------------------------------
        # OCCUPY BED
        # --------------------------------------------------------

        bed.status = "OCCUPIED"

        bed.patient_id = admission.patient_id

        # --------------------------------------------------------
        # SAVE EVERYTHING
        # --------------------------------------------------------

        db.session.commit()

        return jsonify({
            "success": True,
            "message": "IPD admission confirmed successfully.",
            "admission": admission.to_dict(),
            "bed": bed.to_dict(),
            "next_step": "IPD_CARE"
        }), 200

    except Exception as error:

        db.session.rollback()

        print(
            "IPD CONFIRMATION ERROR:",
            repr(error)
        )

        return jsonify({
            "success": False,
            "message": "Unable to confirm IPD admission.",
            "error": str(error)
        }), 500


# ============================================================
# ACTIVE IPD PATIENTS
# ============================================================

@ipd_bp.route(
    "/admissions",
    methods=["GET"]
)
def get_admissions():

    try:

        admissions = (
            IPDAdmission.query
            .filter_by(
                status="ADMITTED"
            )
            .order_by(
                IPDAdmission.admitted_at.desc()
            )
            .all()
        )

        result = []

        for admission in admissions:

            item = (
                admission.to_dict()
            )

            patient = (
                Patient.query
                .filter_by(
                    id=admission.patient_id
                )
                .first()
            )

            if patient:

                item["patient"] = {

                    "id":
                        patient.id,

                    "patient_id":
                        patient.patient_id,

                    "full_name":
                        patient.full_name,

                    "phone":
                        patient.phone
                }

            result.append(
                item
            )

        return jsonify({

            "success": True,

            "total":
                len(result),

            "admissions":
                result

        }), 200

    except Exception as error:

        return jsonify({

            "success": False,

            "message":
                str(error)

        }), 500


# ============================================================
# DISCHARGE PATIENT
# ============================================================

@ipd_bp.route(
    "/admission/<int:admission_id>/discharge",
    methods=["PUT"]
)
def discharge_patient(admission_id):

    try:

        admission = (
            IPDAdmission.query
            .get(admission_id)
        )

        if not admission:

            return jsonify({
                "success": False,
                "message":
                    "Admission not found."
            }), 404

        if admission.status != (
            "ADMITTED"
        ):

            return jsonify({
                "success": False,
                "message":
                    "Patient is not currently admitted."
            }), 400

        bed = None

        if admission.bed_id:

            bed = (
                Bed.query
                .get(
                    admission.bed_id
                )
            )

        admission.status = (
            "DISCHARGED"
        )

        admission.discharged_at = (
            datetime.utcnow()
        )

        admission.discharge_date = (
            datetime.utcnow()
        )

        if bed:

            bed.status = (
                "AVAILABLE"
            )

            bed.patient_id = None

        db.session.commit()

        return jsonify({

            "success": True,

            "message":
                "Patient discharged successfully.",

            "admission":
                admission.to_dict(),

            "bed": (
                bed.to_dict()
                if bed
                else None
            ),

            "next_step":
                "FINAL_BILLING"

        }), 200

    except Exception as error:

        db.session.rollback()

        return jsonify({

            "success": False,

            "message":
                "Unable to discharge patient.",

            "error":
                str(error)

        }), 500