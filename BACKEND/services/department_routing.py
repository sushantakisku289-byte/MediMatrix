# ============================================================
# MEDIMATRIX - DEPARTMENT ROUTING
# ============================================================

DEPARTMENT_RULES = {

    "CARDIOLOGY": [
        "chest pain",
        "chest pressure",
        "heart pain",
        "palpitation",
        "palpitations",
        "shortness of breath",
        "breathing difficulty"
    ],

    "OPHTHALMOLOGY": [
        "eye pain",
        "eye pain",
        "blurred vision",
        "red eye",
        "itchy eye",
        "eye swelling",
        "vision problem"
    ],

    "ENT": [
        "ear pain",
        "hearing problem",
        "sore throat",
        "throat pain",
        "nasal blockage",
        "sinus problem",
        "nose bleeding"
    ],

    "DERMATOLOGY": [
        "skin rash",
        "rash",
        "itching",
        "skin infection",
        "acne",
        "skin allergy",
        "hair loss"
    ],

    "ORTHOPEDICS": [
        "bone pain",
        "joint pain",
        "back pain",
        "knee pain",
        "shoulder pain",
        "fracture",
        "muscle pain"
    ],

    "NEUROLOGY": [
        "severe headache",
        "migraine",
        "dizziness",
        "seizure",
        "numbness",
        "weakness",
        "memory problem"
    ],

    "GASTROENTEROLOGY": [
        "stomach pain",
        "abdominal pain",
        "vomiting",
        "diarrhea",
        "constipation",
        "acidity",
        "indigestion"
    ],

    "GENERAL_MEDICINE": [
        "fever",
        "cold",
        "cough",
        "body pain",
        "weakness",
        "fatigue"
    ]
}


# ============================================================
# FIND DEPARTMENT
# ============================================================

def route_department(symptoms):

    if not symptoms:

        return {
            "department": "GENERAL_MEDICINE",
            "matched_symptoms": [],
            "confidence": "LOW"
        }

    text = str(symptoms).lower().strip()

    matches = {}

    for department, keywords in DEPARTMENT_RULES.items():

        matched = []

        for keyword in keywords:

            if keyword in text:
                matched.append(keyword)

        if matched:
            matches[department] = matched

    # --------------------------------------------------------
    # NO MATCH
    # --------------------------------------------------------

    if not matches:

        return {
            "department": "GENERAL_MEDICINE",
            "matched_symptoms": [],
            "confidence": "LOW"
        }

    # --------------------------------------------------------
    # BEST MATCH
    # --------------------------------------------------------

    best_department = max(
        matches,
        key=lambda department:
            len(matches[department])
    )

    matched_symptoms = matches[
        best_department
    ]

    if len(matched_symptoms) >= 2:

        confidence = "HIGH"

    else:

        confidence = "MEDIUM"

    return {

        "department":
            best_department,

        "matched_symptoms":
            matched_symptoms,

        "confidence":
            confidence

    }