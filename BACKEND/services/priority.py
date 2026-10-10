# ============================================================
# MEDIMATRIX - PRIORITY / AI-ASSISTED TRIAGE SERVICE
# ============================================================

def calculate_priority(
    symptoms="",
    temperature=None,
    heart_rate=None,
    systolic_bp=None,
    diastolic_bp=None,
    oxygen_saturation=None,
    nurse_observation="",
    ocr_text=""
):

    # --------------------------------------------------------
    # NORMALIZE INPUT
    # --------------------------------------------------------

    symptoms_text = str(
        symptoms or ""
    ).lower().strip()

    observation_text = str(
        nurse_observation or ""
    ).lower().strip()

    report_text = str(
        ocr_text or ""
    ).lower().strip()

    combined_text = " ".join([
        symptoms_text,
        observation_text,
        report_text
    ])

    reasons = []

    emergency_score = 0
    urgent_score = 0
    medium_score = 0

    # --------------------------------------------------------
    # EMERGENCY SYMPTOMS
    # --------------------------------------------------------

    emergency_keywords = [
        "unconscious",
        "unresponsive",
        "not breathing",
        "no breathing",
        "severe chest pain",
        "crushing chest pain",
        "severe breathing difficulty",
        "severe shortness of breath",
        "severe bleeding",
        "uncontrolled bleeding",
        "stroke",
        "seizure",
        "severe allergic reaction",
        "anaphylaxis",
        "cardiac arrest",
        "heart attack"
    ]

    for keyword in emergency_keywords:

        if keyword in combined_text:

            emergency_score += 5

            reasons.append(
                f"Emergency indicator detected: {keyword}"
            )

    # --------------------------------------------------------
    # CHEST / CARDIAC RISK
    # --------------------------------------------------------

    cardiac_keywords = [
        "chest pain",
        "chest pressure",
        "chest tightness",
        "palpitation",
        "palpitations",
        "heart pain"
    ]

    cardiac_detected = False

    for keyword in cardiac_keywords:

        if keyword in combined_text:

            cardiac_detected = True

            urgent_score += 2

            reasons.append(
                f"Cardiac warning symptom: {keyword}"
            )

            break

    # --------------------------------------------------------
    # BREATHING RISK
    # --------------------------------------------------------

    breathing_keywords = [
        "difficulty breathing",
        "breathing difficulty",
        "shortness of breath",
        "breathlessness",
        "respiratory distress",
        "cannot breathe"
    ]

    breathing_detected = False

    for keyword in breathing_keywords:

        if keyword in combined_text:

            breathing_detected = True

            urgent_score += 2

            reasons.append(
                f"Breathing warning symptom: {keyword}"
            )

            break

    # --------------------------------------------------------
    # NEUROLOGICAL RISK
    # --------------------------------------------------------

    neurological_keywords = [
        "fainting",
        "loss of consciousness",
        "confusion",
        "weakness",
        "slurred speech",
        "facial drooping",
        "sudden numbness"
    ]

    for keyword in neurological_keywords:

        if keyword in combined_text:

            urgent_score += 2

            reasons.append(
                f"Neurological warning indicator: {keyword}"
            )

            break

    # --------------------------------------------------------
    # SEVERE PAIN
    # --------------------------------------------------------

    severe_pain_keywords = [
        "severe pain",
        "extreme pain",
        "unbearable pain",
        "excruciating pain"
    ]

    for keyword in severe_pain_keywords:

        if keyword in combined_text:

            urgent_score += 2

            reasons.append(
                "Severe pain reported"
            )

            break

    # --------------------------------------------------------
    # OXYGEN SATURATION
    # --------------------------------------------------------

    try:

        if oxygen_saturation is not None:

            spo2 = float(
                oxygen_saturation
            )

            if spo2 < 90:

                emergency_score += 5

                reasons.append(
                    "Critically low oxygen saturation"
                )

            elif spo2 < 94:

                urgent_score += 3

                reasons.append(
                    "Low oxygen saturation"
                )

            elif spo2 < 95:

                medium_score += 1

                reasons.append(
                    "Borderline oxygen saturation"
                )

    except (
        ValueError,
        TypeError
    ):

        pass

    # --------------------------------------------------------
    # HEART RATE
    # --------------------------------------------------------

    try:

        if heart_rate is not None:

            hr = float(
                heart_rate
            )

            if hr > 140:

                emergency_score += 4

                reasons.append(
                    "Critically high heart rate"
                )

            elif hr > 130:

                urgent_score += 3

                reasons.append(
                    "Very high heart rate"
                )

            elif hr < 40:

                emergency_score += 4

                reasons.append(
                    "Critically low heart rate"
                )

            elif hr < 50:

                urgent_score += 2

                reasons.append(
                    "Low heart rate"
                )

            elif hr > 110:

                medium_score += 1

                reasons.append(
                    "Elevated heart rate"
                )

    except (
        ValueError,
        TypeError
    ):

        pass

    # --------------------------------------------------------
    # BLOOD PRESSURE
    # --------------------------------------------------------

    try:

        if systolic_bp is not None:

            systolic = float(
                systolic_bp
            )

            if systolic < 80:

                emergency_score += 5

                reasons.append(
                    "Critically low systolic blood pressure"
                )

            elif systolic < 90:

                urgent_score += 3

                reasons.append(
                    "Low systolic blood pressure"
                )

            elif systolic >= 180:

                emergency_score += 4

                reasons.append(
                    "Critically high systolic blood pressure"
                )

            elif systolic >= 160:

                urgent_score += 2

                reasons.append(
                    "Very high systolic blood pressure"
                )

            elif systolic >= 140:

                medium_score += 1

                reasons.append(
                    "Elevated systolic blood pressure"
                )

    except (
        ValueError,
        TypeError
    ):

        pass

    # --------------------------------------------------------
    # DIASTOLIC BLOOD PRESSURE
    # --------------------------------------------------------

    try:

        if diastolic_bp is not None:

            diastolic = float(
                diastolic_bp
            )

            if diastolic < 50:

                urgent_score += 2

                reasons.append(
                    "Low diastolic blood pressure"
                )

            elif diastolic >= 120:

                emergency_score += 4

                reasons.append(
                    "Critically high diastolic blood pressure"
                )

            elif diastolic >= 100:

                urgent_score += 2

                reasons.append(
                    "Very high diastolic blood pressure"
                )

    except (
        ValueError,
        TypeError
    ):

        pass

    # --------------------------------------------------------
    # TEMPERATURE
    # --------------------------------------------------------

    try:

        if temperature is not None:

            temp = float(
                temperature
            )

            if temp >= 40:

                emergency_score += 4

                reasons.append(
                    "Critically high temperature"
                )

            elif temp >= 39:

                urgent_score += 2

                reasons.append(
                    "High fever"
                )

            elif temp < 35:

                emergency_score += 4

                reasons.append(
                    "Abnormally low body temperature"
                )

            elif temp < 36:

                urgent_score += 2

                reasons.append(
                    "Low body temperature"
                )

    except (
        ValueError,
        TypeError
    ):

        pass

    # --------------------------------------------------------
    # MULTIPLE CRITICAL VITALS
    # --------------------------------------------------------

    critical_vitals = 0

    try:

        if oxygen_saturation is not None:

            if float(oxygen_saturation) < 90:

                critical_vitals += 1

    except (
        ValueError,
        TypeError
    ):

        pass

    try:

        if heart_rate is not None:

            hr = float(heart_rate)

            if hr > 140 or hr < 40:

                critical_vitals += 1

    except (
        ValueError,
        TypeError
    ):

        pass

    try:

        if systolic_bp is not None:

            systolic = float(systolic_bp)

            if systolic < 80 or systolic >= 180:

                critical_vitals += 1

    except (
        ValueError,
        TypeError
    ):

        pass

    try:

        if temperature is not None:

            temp = float(temperature)

            if temp >= 40 or temp < 35:

                critical_vitals += 1

    except (
        ValueError,
        TypeError
    ):

        pass

    if critical_vitals >= 2:

        emergency_score += 5

        reasons.append(
            "Multiple critical vital-sign abnormalities detected"
        )

    # --------------------------------------------------------
    # OCR MEDICAL REPORT RISK
    # --------------------------------------------------------

    ocr_emergency_keywords = [
        "acute myocardial infarction",
        "myocardial infarction",
        "heart attack",
        "cardiac arrest",
        "severe hypoxia",
        "respiratory failure",
        "acute stroke",
        "intracranial hemorrhage",
        "internal bleeding",
        "septic shock",
        "shock"
    ]

    for keyword in ocr_emergency_keywords:

        if keyword in report_text:

            emergency_score += 4

            reasons.append(
                f"High-risk previous report finding: {keyword}"
            )

    ocr_urgent_keywords = [
        "abnormal ecg",
        "abnormal ekg",
        "pneumonia",
        "infection",
        "high blood pressure",
        "hypertension",
        "tachycardia",
        "bradycardia",
        "low oxygen",
        "anemia",
        "diabetes",
        "abnormal cardiac",
        "abnormal chest x-ray"
    ]

    for keyword in ocr_urgent_keywords:

        if keyword in report_text:

            urgent_score += 1

            reasons.append(
                f"Previous report finding requires attention: {keyword}"
            )

    # --------------------------------------------------------
    # NURSE OBSERVATION RISK
    # --------------------------------------------------------

    observation_emergency_keywords = [
        "unresponsive",
        "cyanosis",
        "blue lips",
        "severe distress",
        "collapse",
        "collapsed",
        "active seizure",
        "uncontrolled bleeding"
    ]

    for keyword in observation_emergency_keywords:

        if keyword in observation_text:

            emergency_score += 4

            reasons.append(
                f"Nurse observation indicates serious condition: {keyword}"
            )

    observation_urgent_keywords = [
        "distress",
        "weak",
        "very weak",
        "pale",
        "drowsy",
        "vomiting",
        "dehydrated",
        "confused",
        "painful"
    ]

    for keyword in observation_urgent_keywords:

        if keyword in observation_text:

            urgent_score += 1

            reasons.append(
                f"Nurse observation requires attention: {keyword}"
            )

    # --------------------------------------------------------
    # COMBINED CARDIO-RESPIRATORY EMERGENCY
    # --------------------------------------------------------

    if (
        cardiac_detected
        and breathing_detected
        and (
            emergency_score > 0
            or critical_vitals >= 1
        )
    ):

        emergency_score += 6

        reasons.append(
            "Combined cardiac and breathing risk detected"
        )

    # --------------------------------------------------------
    # FINAL PRIORITY
    # --------------------------------------------------------

    if emergency_score >= 4:

        priority = "EMERGENCY"

    elif urgent_score >= 2:

        priority = "URGENT"

    elif medium_score >= 1 or urgent_score == 1:

        priority = "MEDIUM"

    else:

        priority = "ROUTINE"

    # --------------------------------------------------------
    # DEFAULT REASON
    # --------------------------------------------------------

    if not reasons:

        reasons.append(
            "No immediate high-risk indicator detected"
        )

    # --------------------------------------------------------
    # RESULT
    # --------------------------------------------------------

    return {

        "priority":
            priority,

        "reasons":
            reasons,

        "analysis": {

            "emergency_score":
                emergency_score,

            "urgent_score":
                urgent_score,

            "medium_score":
                medium_score,

            "critical_vitals":
                critical_vitals,

            "ocr_analyzed":
                bool(
                    report_text
                ),

            "nurse_observation_analyzed":
                bool(
                    observation_text
                )

        }

    }