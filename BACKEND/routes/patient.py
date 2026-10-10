from flask import Blueprint, request, jsonify

from extensions import db

from models.patient import Patient
from models.notification import Notification
from models.user import User

from sqlalchemy import text


# ============================================================
# PATIENT BLUEPRINT
# ============================================================

patient_bp = Blueprint(
    "patient",
    __name__,
    url_prefix="/api/patients"
)


# ============================================================
# GENERATE PATIENT ID
# ============================================================

def generate_patient_id():

    last_patient = (
        Patient.query
        .order_by(
            Patient.id.desc()
        )
        .first()
    )

    if not last_patient:

        number = 1

    else:

        number = last_patient.id + 1

    return f"MED-P-{number:06d}"


# ============================================================
# SYMPTOM → DEPARTMENT ROUTING
# ============================================================

def determine_department(symptoms):

    text_value = (
        str(symptoms)
        .lower()
        .strip()
    )


    cardiology_keywords = [
    "heart",
    "cardiac",
    "chest pain",
    "heart pain",
    "heart problem",
    "heart disease",
    "heart attack",
    "palpitation",
    "palpitations",
    "irregular heartbeat",
    "high heart rate",
    "fast heartbeat",
    "heartbeat problem"
]

    # --------------------------------------------------------
    # OPHTHALMOLOGY
    # --------------------------------------------------------

    eye_keywords = [

        "eye pain",
        "eye problem",
        "eye infection",
        "red eye",
        "blurred vision",
        "blur vision",
        "vision problem",
        "poor vision",
        "itchy eyes",
        "watery eyes"

    ]


    # --------------------------------------------------------
    # ENT
    # --------------------------------------------------------

    ent_keywords = [

        "ear pain",
        "ear problem"
        "ear infection",
        "hearing problem",
        "hearing loss",
        "sore throat",
        "throat pain",
        "nose problem",
        "nasal problem",
        "sinus",
        "tonsil"

    ]


    # --------------------------------------------------------
    # DERMATOLOGY
    # --------------------------------------------------------

    dermatology_keywords = [

        "skin rash",
        "rash",
        "skin problem",
        "skin infection",
        "itching",
        "itchy skin",
        "acne",
        "eczema",
        "skin allergy",

    ]


    # --------------------------------------------------------
    # DENTAL
    # --------------------------------------------------------

    dental_keywords = [

        "tooth pain",
        "toothache",
        "teeth pain",
        "gum pain",
        "gum bleeding",
        "dental pain",
        "tooth problem"
        "The tooth is aching",

    ]


    # --------------------------------------------------------
    # ORTHOPEDICS
    # --------------------------------------------------------

    orthopedic_keywords = [

        "bone pain",
        "joint pain",
        "knee pain",
        "back pain",
        "shoulder pain",
        "neck pain",
        "fracture",
        "bone injury",
        "joint problem",
        "muscle pain"

    ]


    # --------------------------------------------------------
    # GASTROENTEROLOGY
    # --------------------------------------------------------

    gastro_keywords = [

        "stomach pain",
        "abdominal pain",
        "gastric",
        "acidity",
        "indigestion",
        "digestion problem",
        "vomiting",
        "diarrhea",
        "constipation",
        "loose motion"

    ]


    # --------------------------------------------------------
    # NEUROLOGY
    # --------------------------------------------------------

    neurology_keywords = [

        "severe headache",
        "migraine",
        "dizziness",
        "vertigo",
        "seizure",
        "nerve pain",
        "numbness",
        "tingling",
        "memory problem"

    ]


    # --------------------------------------------------------
    # CHECK DEPARTMENTS
    # --------------------------------------------------------

    if any(
        keyword in text_value
        for keyword in cardiology_keywords
    ):

        return "Cardiology"


    if any(
        keyword in text_value
        for keyword in eye_keywords
    ):

        return "Ophthalmology"


    if any(
        keyword in text_value
        for keyword in ent_keywords
    ):

        return "ENT"


    if any(
        keyword in text_value
        for keyword in dermatology_keywords
    ):

        return "Dermatology"


    if any(
        keyword in text_value
        for keyword in dental_keywords
    ):

        return "Dental"


    if any(
        keyword in text_value
        for keyword in orthopedic_keywords
    ):

        return "Orthopedics"


    if any(
        keyword in text_value
        for keyword in gastro_keywords
    ):

        return "Gastroenterology"


    if any(
        keyword in text_value
        for keyword in neurology_keywords
    ):

        return "Neurology"


    # --------------------------------------------------------
    # DEFAULT
    # --------------------------------------------------------

    return "General Medicine"


# ============================================================
# REGISTER PATIENT
# ============================================================

@patient_bp.route(
    "/register",
    methods=["POST"]
)
def register_patient():

    try:

        data = (
            request.get_json(
                silent=True
            )
            or {}
        )


        # ====================================================
        # GET PATIENT DATA
        # ====================================================

        full_name = str(
            data.get(
                "full_name",
                ""
            )
        ).strip()


        age = data.get(
            "age"
        )


        gender = str(
            data.get(
                "gender",
                ""
            )
        ).strip()


        phone = str(
            data.get(
                "phone",
                ""
            )
        ).strip()


        address = str(
            data.get(
                "address",
                ""
            )
        ).strip()


        emergency_contact = str(
            data.get(
                "emergency_contact",
                ""
            )
        ).strip()


        symptoms = str(
            data.get(
                "symptoms",
                ""
            )
        ).strip()


        # ====================================================
        # VALIDATION
        # ====================================================

        if not full_name:

            return jsonify({

                "success": False,

                "message":
                    "Patient full name is required."

            }), 400


        if age in [
            None,
            ""
        ]:

            return jsonify({

                "success": False,

                "message":
                    "Patient age is required."

            }), 400


        try:

            parsed_age = int(
                age
            )

        except (
            ValueError,
            TypeError
        ):

            return jsonify({

                "success": False,

                "message":
                    "Invalid patient age."

            }), 400


        if (
            parsed_age < 0
            or parsed_age > 150
        ):

            return jsonify({

                "success": False,

                "message":
                    "Invalid patient age."

            }), 400


        if not gender:

            return jsonify({

                "success": False,

                "message":
                    "Patient gender is required."

            }), 400


        if not phone:

            return jsonify({

                "success": False,

                "message":
                    "Patient phone number is required."

            }), 400


        if not address:

            return jsonify({

                "success": False,

                "message":
                    "Patient address is required."

            }), 400


        if not emergency_contact:

            return jsonify({

                "success": False,

                "message":
                    "Emergency contact is required."

            }), 400


        if not symptoms:

            return jsonify({

                "success": False,

                "message":
                    "Patient symptoms are required."

            }), 400


        # ====================================================
        # AUTOMATIC PATIENT ID
        # ====================================================

        new_patient_id = (
            generate_patient_id()
        )


        # ====================================================
        # AUTOMATIC DEPARTMENT
        # ====================================================

        department = (
            determine_department(
                symptoms
            )
        )


        # ====================================================
        # CREATE PATIENT
        # ====================================================

        patient = Patient(

            patient_id=
                new_patient_id,

            registration_number=
                new_patient_id,

            full_name=
                full_name,

            age=
                parsed_age,

            gender=
                gender,

            phone=
                phone,

            address=
                address,

            emergency_contact_phone=
                emergency_contact,

            symptoms=
                symptoms,

            department=
                department,

            registration_status=
                "REGISTERED"

        )


        db.session.add(
            patient
        )


        # ====================================================
        # FIND DEPARTMENT
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
                        department
                }

            )
            .mappings()
            .first()
        )


        # ====================================================
        # DEPARTMENT NOT FOUND
        # ====================================================

        if not department_record:

            raise ValueError(

                f"Department '{department}' "
                "was not found in the "
                "departments table."

            )


        department_id = (
            department_record["id"]
        )


        # ====================================================
        # FIND ONLY MATCHING NURSES
        # ====================================================

        department_nurses = (

            User.query

            .filter(

                User.is_active == True,

                User.role.in_([
                    "NURSE",
                    "NURSE_HOD"
                ]),

                User.department_id
                == department_id

            )

            .all()

        )


        # ====================================================
        # CREATE NOTIFICATIONS
        # ONLY FOR MATCHING DEPARTMENT
        # ====================================================

        for nurse in department_nurses:

            nurse_notification = Notification(

                recipient_user_id=
                    nurse.id,

                recipient_role=
                    "NURSE",

                notification_type=
                    "PATIENT_REGISTRATION",

                title=
                    "New Patient Registered",

                message=(

                    f"Patient "
                    f"{new_patient_id} "
                    f"({full_name}) has been "
                    f"registered for "
                    f"{department}. "

                    f"Symptoms: "
                    f"{symptoms}. "

                    f"Patient is waiting "
                    f"for nurse assessment."

                ),

                patient_id=
                    new_patient_id,

                patient_name=
                    full_name,

                is_read=
                    False

            )


            db.session.add(
                nurse_notification
            )


        # ====================================================
        # SAVE DATABASE
        # ====================================================

        db.session.commit()


        # ====================================================
        # SUCCESS RESPONSE
        # ====================================================

        return jsonify({

            "success":
                True,

            "message": (

                "Patient registered "
                "successfully and routed "
                "to the appropriate "
                "department."

            ),

            "patient":
                patient.to_dict(),

            "patient_id":
                patient.patient_id,

            "department":
                department,

            "department_id":
                department_id,

            "status":
                patient.status,

            "notified_nurses":
                len(department_nurses),

            "next_step":
                "NURSE_NOTIFICATION"

        }), 201


    # ========================================================
    # ERROR HANDLING
    # ========================================================

    except Exception as error:

        db.session.rollback()


        print(
            "========================================"
        )

        print(
            "PATIENT REGISTRATION ERROR:",
            error
        )

        print(
            "========================================"
        )


        return jsonify({

            "success":
                False,

            "message":
                "Unable to register patient.",

            "error":
                str(error)

        }), 500


# ============================================================
# GET PATIENT BY PATIENT ID
# ============================================================

@patient_bp.route(
    "/<string:patient_id>",
    methods=["GET"]
)
def get_patient(patient_id):

    try:

        patient = (

            Patient.query

            .filter_by(
                patient_id=patient_id
            )

            .first()

        )


        if not patient:

            return jsonify({

                "success":
                    False,

                "message":
                    "Patient not found."

            }), 404


        return jsonify({

            "success":
                True,

            "patient":
                patient.to_dict()

        }), 200


    except Exception as error:

        return jsonify({

            "success":
                False,

            "message":
                str(error)

        }), 500


# ============================================================
# GET ALL PATIENTS
# ============================================================

@patient_bp.route(
    "",
    methods=["GET"]
)
def get_patients():

    try:

        patients = (

            Patient.query

            .order_by(
                Patient.id.desc()
            )

            .all()

        )


        return jsonify({

            "success":
                True,

            "total":
                len(patients),

            "patients": [

                patient.to_dict()

                for patient in patients

            ]

        }), 200


    except Exception as error:

        return jsonify({

            "success":
                False,

            "message":
                "Unable to load patients.",

            "error":
                str(error)

        }), 500