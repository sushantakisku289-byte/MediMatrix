/* ============================================================
   MEDIMATRIX
   DOCTOR DASHBOARD
   CLEAN LIVE DATABASE VERSION
   ============================================================ */

"use strict";

// ============================================================
// GET CURRENT DOCTOR
// ============================================================
function getDoctorData() {

    // ========================================================
    // CURRENT LOGIN IS THE SOURCE OF TRUTH
    // ========================================================

    const currentUserId =
        localStorage.getItem("user_id") ||
        localStorage.getItem("userId");

    const currentRole =
        String(
            localStorage.getItem("role") || ""
        ).toUpperCase();

    // Only use doctor-specific stored object if
    // it belongs to the CURRENT logged-in user.
    const storedDoctor =
        (() => {

            try {

                const raw =
                    localStorage.getItem("doctor");

                if (!raw) {
                    return null;
                }

                return JSON.parse(raw);

            } catch (error) {

                console.warn(
                    "Invalid doctor session data:",
                    error
                );

                return null;
            }

        })();

    if (
        storedDoctor &&
        currentUserId &&
        String(storedDoctor.user_id) ===
        String(currentUserId)
    ) {

        return storedDoctor;
    }

    // Prefer currentUser because login.js writes
    // the fresh login response here.
    try {

        const currentUser =
            JSON.parse(
                localStorage.getItem("currentUser") || "null"
            );

        if (
            currentUser &&
            (
                !currentUserId ||
                String(currentUser.user_id) ===
                String(currentUserId)
            )
        ) {

            return currentUser;
        }

    } catch (error) {

        console.warn(
            "Unable to read currentUser:",
            error
        );

    }

    // Fallback to generic user object.
    try {

        const user =
            JSON.parse(
                localStorage.getItem("user") || "null"
            );

        if (
            user &&
            (
                !currentUserId ||
                String(user.user_id) ===
                String(currentUserId)
            )
        ) {

            return user;
        }

    } catch (error) {

        console.warn(
            "Unable to read user:",
            error
        );

    }

    // Final fallback: construct a minimal user object
    // from the CURRENT login session.
    return {
        user_id: currentUserId || "",
        role: currentRole
    };
}
// ============================================================
// LOAD LOGGED-IN DOCTOR PROFILE
// ============================================================

async function loadDoctorProfile() {

    try {

        const doctor = getDoctorData();

        const doctorId =
    localStorage.getItem("user_id") ||
    localStorage.getItem("userId") ||
    doctor.user_id ||
    doctor.doctor_id ||
    doctor.id;

        if (!doctorId) {
            console.error("Doctor ID not found. Please login again.");
            return;
        }

        console.log("Loading doctor profile:", doctorId);

        const response = await fetch(
    `http://127.0.0.1:5000/api/doctor/profile/${encodeURIComponent(doctorId)}`,
            {
                method: "GET",
                headers: {
                    "Accept": "application/json"
                }
            }
        );

        const data = await response.json();

        console.log("Doctor profile response:", data);

        if (!response.ok) {
            throw new Error(
                data.message ||
                `Doctor profile request failed: HTTP ${response.status}`
            );
        }

        const profile =
            data.doctor ||
            data.user ||
            data.data ||
            data;

        if (!profile) {
            throw new Error("Doctor profile data is empty.");
        }

        const fullName =
            profile.full_name ||
            profile.name ||
            profile.username ||
            "Doctor";

        const doctorCode =
            profile.doctor_id ||
            profile.user_id ||
            profile.id ||
            doctorId;

        const department =
            profile.department_name ||
            profile.department ||
            "Medical Department";

        const email =
            profile.email ||
            profile.email_id ||
            "";

        const phone =
            profile.phone ||
            profile.mobile ||
            profile.mobile_number ||
            "";

        const photo =
            profile.profile_photo ||
            profile.profile_picture ||
            profile.photo ||
            "";

        // ============================================================
// PROFILE FIELDS
// ============================================================

setValueIfExists("profileFullName", fullName);
setValueIfExists("profileDoctorId", doctorCode);
setValueIfExists("profileDepartment", department);
setValueIfExists("profileEmail", email);
setValueIfExists("profilePhone", phone);

// ============================================================
// PROFILE PHOTO
// ============================================================

const profilePhotoElement =
    document.getElementById("profilePhoto");

const profileInitialElement =
    document.getElementById("profileInitial");

if (profilePhotoElement && photo) {
    profilePhotoElement.src = photo;
    profilePhotoElement.style.display = "block";

    if (profileInitialElement) {
        profileInitialElement.style.display = "none";
    }
} else if (profileInitialElement) {
    profileInitialElement.textContent =
        fullName.charAt(0).toUpperCase();

    profileInitialElement.style.display = "flex";
}
        // Header
        setTextIfExists("headerDoctorName", fullName);
        setTextIfExists("headerDoctorDepartment", department);

        // Save doctor data
        localStorage.setItem(
            "doctor",
            JSON.stringify(profile)
        );

        if (profile.user_id) {
            localStorage.setItem(
                "user_id",
                String(profile.user_id)
            );
        }

        const finalDoctorId =
    profile.user_id ||
    profile.doctor_id ||
    doctorId;

localStorage.setItem(
    "doctor_id",
    String(finalDoctorId)
);

localStorage.setItem(
    "doctorId",
    String(finalDoctorId)
);

        console.log(
            "Doctor profile loaded successfully:",
            profile
        );

    } catch (error) {

        console.error(
            "Doctor profile error:",
            error
        );

    }
}


// ============================================================
// SAFE INPUT VALUE
// ============================================================

function setValueIfExists(id, value) {

    const element = document.getElementById(id);

    if (!element) {
        console.warn("Profile element not found:", id);
        return;
    }

    const finalValue = value ?? "";

    // INPUT / TEXTAREA / SELECT
    if (
        element.tagName === "INPUT" ||
        element.tagName === "TEXTAREA" ||
        element.tagName === "SELECT"
    ) {
        element.value = finalValue;
        return;
    }

    // DIV / SPAN / P / LABEL / OTHER DISPLAY ELEMENT
    element.textContent = finalValue;
}


// ============================================================
// SAFE TEXT
// ============================================================

function setTextIfExists(id, value) {

    const element =
        document.getElementById(id);

    if (!element) {
        return;
    }

    element.textContent = value ?? "";
}

/* ============================================================
   MEDIMATRIX API CONFIGURATION
   ============================================================ */

const API_BASE_URL = "http://127.0.0.1:5000";

const DOCTOR_API =
    `${API_BASE_URL}/api/assessment`;


const DOCTOR_ACTION_API =
    `${API_BASE_URL}/api/doctor`;

const DOCTOR_NOTIFICATION_API =
    `${API_BASE_URL}/api/notifications/doctor`;
let selectedDoctorPatient = null;
let doctorNotificationTimer = null;

let doctorQueue = [];

let doctorNotifications = [];

/* ============================================================
   PAGE LOAD
============================================================ */

document.addEventListener("DOMContentLoaded", function () {

    console.log("MediMatrix Doctor Dashboard loaded.");

    loadDoctorProfile();

    loadDoctorQueue();

    loadDoctorNotifications();

    setInterval(function () {
        loadDoctorQueue();
    }, 10000);

});


/* ============================================================
   LOAD DOCTOR QUEUE
============================================================ */

async function loadDoctorQueue() {

    const dashboardQueue =
        document.getElementById("dashboardQueue");

    const fullQueue =
        document.getElementById("fullDoctorQueue") ||
        document.getElementById("fullPatientQueue");

    try {

        if (dashboardQueue) {
            dashboardQueue.innerHTML = `
                <div class="loading-state">
                    <div>🩺</div>
                    <h3>Loading patient queue...</h3>
                </div>
            `;
        }

        if (fullQueue) {
            fullQueue.innerHTML = `
                <div class="loading-state">
                    <div>🩺</div>
                    <h3>Loading patient queue...</h3>
                </div>
            `;
        }

        
        const doctor = getDoctorData();

const doctorId =
    doctor.user_id ||
    doctor.doctor_id ||
    doctor.id ||
    localStorage.getItem("user_id") ||
    localStorage.getItem("userId");

if (!doctorId) {
    throw new Error(
        "Doctor ID not found. Please login again."
    );
}

console.log("Logged-in Doctor ID:", doctorId);

const response = await fetch(
    `http://127.0.0.1:5000/api/assessment/doctor-queue?doctor_id=${encodeURIComponent(doctorId)}`,
    {
        method: "GET",
        headers: {
            "Accept": "application/json"
        }
    }
);

        if (!response.ok) {
            throw new Error(
                `Doctor queue request failed: HTTP ${response.status}`
            );
        }

        const result = await response.json();

        if (!result.success) {
            throw new Error(
                result.message ||
                "Unable to load doctor queue."
            );
        }

        doctorQueue =
            Array.isArray(result.queue)
                ? result.queue
                : [];
// Remove duplicate patients from doctor queue
const uniquePatients = new Map();

doctorQueue.forEach(function (patient) {

    const patientId =
        patient.patient_id ||
        patient.patient?.patient_id ||
        patient.id;

    if (!patientId) {
        return;
    }

    // Prefer the record that contains vitals
    const existing = uniquePatients.get(patientId);

    if (
        !existing ||
        (
            patient.vitals &&
            Object.keys(patient.vitals).length >
            Object.keys(existing.vitals || {}).length
        )
    ) {
        uniquePatients.set(patientId, patient);
    }
});

doctorQueue = Array.from(uniquePatients.values());
        console.log(
            "Doctor queue loaded:",
            doctorQueue
        );

        if (
            typeof renderDashboardQueue ===
            "function"
        ) {
            renderDashboardQueue(
                doctorQueue
            );
        }

        if (
            typeof renderFullQueue ===
            "function"
        ) {
            renderFullQueue(
                doctorQueue
            );
        }

        if (
            typeof updateDoctorStatistics ===
            "function"
        ) {
            updateDoctorStatistics();
        }

    } catch (error) {

        console.error(
            "Doctor queue error:",
            error
        );

        doctorQueue = [];

        const errorHtml = `
            <div class="empty-state">
                <div style="font-size:40px;">⚠️</div>
                <h3>Unable to load patient queue</h3>
                <p>${escapeHtml(error.message)}</p>
            </div>
        `;

        if (dashboardQueue) {
            dashboardQueue.innerHTML =
                errorHtml;
        }

        if (
            fullQueue &&
            fullQueue !== dashboardQueue
        ) {
            fullQueue.innerHTML =
                errorHtml;
        }
    }
}



/* ============================================================
   QUEUE ERROR
============================================================ */

function showQueueError(
    container,
    message
) {

    if (!container) {
        return;
    }

    container.innerHTML = `
        <div class="empty-queue">
            <div class="empty-icon">⚠️</div>

            <h3>
                Unable to load queue
            </h3>

            <p>
                ${escapeHtml(message)}
            </p>

            <button
                type="button"
                class="patient-view-btn"
                onclick="loadDoctorQueue()"
            >
                🔄 Retry
            </button>
        </div>
    `;

}


/* ============================================================
   UPDATE STATISTICS
============================================================ */

function updateStatistics() {

    const queue =
        Array.isArray(doctorQueue)
            ? doctorQueue
            : [];

    const total =
        queue.length;

    const emergency =
        queue.filter(function (patient) {

            return normalizePriority(
                patient.priority
            ) === "EMERGENCY";

        }).length;

    const urgent =
        queue.filter(function (patient) {

            return normalizePriority(
                patient.priority
            ) === "URGENT";

        }).length;

    const routine =
        queue.filter(function (patient) {

            const priority =
                normalizePriority(
                    patient.priority
                );

            return (
                priority !== "EMERGENCY" &&
                priority !== "URGENT"
            );

        }).length;


    setMultipleText(
        [
            "totalPatients",
            "totalQueue",
            "queueTotal"
        ],
        total
    );


    setMultipleText(
        [
            "emergencyPatients",
            "emergencyCount"
        ],
        emergency
    );


    setMultipleText(
        [
            "urgentPatients",
            "urgentCount"
        ],
        urgent
    );


    setMultipleText(
        [
            "routinePatients",
            "routineCount"
        ],
        routine
    );


    console.log(
        "Doctor statistics updated:",
        {
            total: total,
            emergency: emergency,
            urgent: urgent,
            routine: routine
        }
    );

}


/* ============================================================
   SET TEXT
============================================================ */

function setText(
    id,
    value
) {

    const element =
        document.getElementById(id);

    if (element) {
        element.textContent = value;
    }

}


function setMultipleText(
    ids,
    value
) {

    ids.forEach(function (id) {

        setText(
            id,
            value
        );

    });

}


/* ============================================================
   EMERGENCY ALERT
============================================================ */

function updateEmergencyAlert(
    queue,
    emergencyCount
) {

    const alert =
        document.getElementById(
            "emergencyAlert"
        );

    const alertText =
        document.getElementById(
            "emergencyAlertText"
        );

    if (!alert) {
        return;
    }

    if (emergencyCount === 0) {

        alert.style.display =
            "none";

        return;
    }

    alert.style.display = "";

    const emergencyPatient =
        queue.find(function (patient) {

            return normalizePriority(
                patient.priority
            ) === "EMERGENCY";

        });

    if (
        alertText &&
        emergencyPatient
    ) {

        const name =
            emergencyPatient.patient_name ||
            getPatientName(
                emergencyPatient
            );

        const patientId =
            emergencyPatient.patient_id ||
            "N/A";

        alertText.textContent =
            `${name} (${patientId}) requires immediate attention.`;
    }

}


/* ============================================================
   DASHBOARD QUEUE
============================================================ */

function renderDashboardQueue(
    patients
) {

    const container =
        document.getElementById(
            "dashboardQueue"
        );

    if (!container) {
        return;
    }

    if (
        !Array.isArray(patients) ||
        patients.length === 0
    ) {

        container.innerHTML = `
            <div class="empty-queue">

                <div class="empty-icon">
                    🩺
                </div>

                <h3>
                    No patients waiting
                </h3>

                <p>
                    The doctor queue is currently empty.
                </p>

            </div>
        `;

        return;
    }


    const visiblePatients =
        patients.slice(
            0,
            5
        );


    container.replaceChildren(
    ...visiblePatients.map(function (patient) {
        return createPatientRow(patient);
    })
);
}


/* ============================================================
   FULL DOCTOR QUEUE
============================================================ */

function renderFullQueue(
    patients
) {

    const container =
        document.getElementById(
            "fullDoctorQueue"
        );

    if (!container) {
        return;
    }

    if (
        !Array.isArray(patients) ||
        patients.length === 0
    ) {

        container.innerHTML = `
            <div class="empty-queue">

                <div class="empty-icon">
                    🩺
                </div>

                <h3>
                    No patients waiting
                </h3>

                <p>
                    New nurse assessments will appear here.
                </p>

            </div>
        `;

        return;
    }


    container.replaceChildren(
    ...patients.map(function (patient) {
        return createPatientRow(patient);
    })
);

}


/* ============================================================
   CREATE PATIENT ROW
   ONLY ONE VERSION
============================================================ */

function createPatientRow(
    assessment
) {

    assessment =
        assessment || {};

    const patient =
        assessment.patient || {};


    const patientName =
        assessment.patient_name ||
        patient.full_name ||
        patient.name ||
        "Patient";


    const patientId =
        assessment.patient_id ||
        patient.patient_id ||
        "N/A";


    const priority =
        normalizePriority(
            assessment.priority
        );


    const symptoms =
        assessment.symptoms ||
        patient.symptoms ||
        "Clinical assessment";


    const avatar =
        getInitial(
            patientName
        );


    const vital =
        getMainVital(
            assessment
        );


    const priorityClass =
        priority.toLowerCase();


    const priorityIcon =
        getPriorityIcon(
            priority
        );


    const row =
        document.createElement(
            "div"
        );


    row.className =
        `patient-row doctor-patient-row ${priorityClass}`;


    row.innerHTML = `

        <div class="patient-avatar ${escapeHtml(priorityClass)}">
            ${escapeHtml(avatar)}
        </div>

        <div class="patient-main">

            <strong>
                ${escapeHtml(patientName)}
            </strong>

            <span>
                ${escapeHtml(patientId)}
            </span>

            <span>
                ${escapeHtml(symptoms)}
            </span>

        </div>

        <div class="patient-vital ${escapeHtml(priorityClass)}">

            <strong>
                ${priorityIcon}
                ${escapeHtml(priority)}
            </strong>

            <span>
                ${escapeHtml(vital)}
            </span>

        </div>

        <button
            type="button"
            class="patient-view-btn"
        >
            View Patient
        </button>

    `;


    const button =
        row.querySelector(
            ".patient-view-btn"
        );


    if (button) {

        button.addEventListener(
    "click",
    function () {

        openPatient(
            patientId
        );

    }
);

    }


    return row;

}


/* ============================================================
   GET MAIN VITAL
============================================================ */

function getMainVital(
    patient
) {

    if (!patient) {
        return "Vitals not recorded";
    }


    const temperature =
        patient.temperature ??
        patient.temp ??
        patient.temperature_c;


    const heartRate =
        patient.heart_rate ??
        patient.heartRate ??
        patient.pulse;


    const systolic =
        patient.systolic_bp ??
        patient.systolicBP ??
        patient.bp_systolic;


    const diastolic =
        patient.diastolic_bp ??
        patient.diastolicBP ??
        patient.bp_diastolic;


    const oxygen =
        patient.oxygen_saturation ??
        patient.oxygenSaturation ??
        patient.spo2 ??
        patient.spO2;


    const bloodPressure =
        patient.blood_pressure;


    const vitals = [];


    if (
        temperature !== null &&
        temperature !== undefined &&
        temperature !== ""
    ) {

        vitals.push(
            `Temp ${temperature}°C`
        );

    }


    if (
        heartRate !== null &&
        heartRate !== undefined &&
        heartRate !== ""
    ) {

        vitals.push(
            `HR ${heartRate} BPM`
        );

    }


    if (
        systolic !== null &&
        systolic !== undefined &&
        systolic !== "" &&
        diastolic !== null &&
        diastolic !== undefined &&
        diastolic !== ""
    ) {

        vitals.push(
            `BP ${systolic}/${diastolic}`
        );

    }
    else if (
        bloodPressure
    ) {

        vitals.push(
            `BP ${bloodPressure}`
        );

    }


    if (
        oxygen !== null &&
        oxygen !== undefined &&
        oxygen !== ""
    ) {

        vitals.push(
            `SpO₂ ${oxygen}%`
        );

    }


    if (
        vitals.length > 0
    ) {

        return vitals.join(
            " • "
        );

    }


    return "Vitals not recorded";

}


/* ============================================================
   GET PATIENT VITAL
   COMPATIBILITY FUNCTION
============================================================ */

function getPatientVital(
    patient
) {

    return getMainVital(
        patient
    );

}

/* ============================================================
   OPEN PATIENT FROM DOCTOR QUEUE
============================================================ */

async function openPatient(patientId) {

    if (!patientId) {
        alert("Patient ID is missing.");
        return;
    }

    console.log(
        "Opening doctor queue patient:",
        patientId
    );

    try {

        /* ====================================================
           1. GET PATIENT
        ==================================================== */

        const patientResponse = await fetch(
            `http://127.0.0.1:5000/api/patients/${encodeURIComponent(patientId)}`,
            {
                method: "GET",
                headers: {
                    "Accept": "application/json"
                }
            }
        );

        const patientData =
            await patientResponse.json();

        if (
            !patientResponse.ok ||
            !patientData.success ||
            !patientData.patient
        ) {
            throw new Error(
                patientData.message ||
                "Unable to load patient information."
            );
        }


        /* ====================================================
           2. GET ASSESSMENTS
        ==================================================== */

        const assessmentResponse = await fetch(
            `http://127.0.0.1:5000/api/assessment/patient/${encodeURIComponent(patientId)}`,
            {
                method: "GET",
                headers: {
                    "Accept": "application/json"
                }
            }
        );

        const assessmentData =
            await assessmentResponse.json();

        if (
            !assessmentResponse.ok ||
            !assessmentData.success
        ) {
            throw new Error(
                assessmentData.message ||
                "Unable to load patient assessment."
            );
        }


        /* ====================================================
           3. PREPARE DATA
        ==================================================== */

        const patient =
            patientData.patient;

        const assessments =
            Array.isArray(
                assessmentData.assessments
            )
                ? assessmentData.assessments
                : [];


        window.selectedDoctorPatient =
            patient;

        window.selectedDoctorAssessments =
            assessments;

        localStorage.setItem(
            "selectedPatientId",
            String(patientId)
        );


        /* ====================================================
           4. OPEN CONSULTATION SECTION
        ==================================================== */

        showSection(
            "consultationSection"
        );


        /* ====================================================
           5. SHOW REAL CONSULTATION WORKSPACE
        ==================================================== */

        const consultationWorkspace =
            document.getElementById(
                "doctorConsultationWorkspace"
            );

        const consultationEmptyState =
            document.getElementById(
                "consultationEmptyState"
            );


        if (!consultationWorkspace) {

            throw new Error(
                "doctorConsultationWorkspace not found."
            );
        }


        /* SHOW REAL FORM */
        consultationWorkspace.style.display =
            "block";


        /* HIDE EMPTY STATE */
        if (consultationEmptyState) {

            consultationEmptyState.style.display =
                "none";
        }


        /* ====================================================
           6. LOAD PATIENT INTO REAL FORM
        ==================================================== */

        if (
            typeof window.loadDoctorPatient !==
            "function"
        ) {

            throw new Error(
                "loadDoctorPatient() is not available."
            );
        }


        window.loadDoctorPatient(
            patient,
            assessments
        );


        console.log(
            "REAL CONSULTATION FORM LOADED"
        );

    } catch (error) {

        console.error(
            "Open patient error:",
            error
        );

        alert(
            error.message ||
            "Unable to open patient."
        );
    }
}


/* ============================================================
   OPEN PATIENT FROM DOCTOR NOTIFICATION
   ============================================================ */

async function openPatientFromNotification(patientId) {

    if (!patientId) {

        alert("Patient ID is missing.");

        return;

    }


    console.log(
        "Opening patient:",
        patientId
    );


    try {

        /* ====================================================
           1. GET REAL PATIENT INFORMATION
        ==================================================== */

        const patientResponse =
            await fetch(
                `http://127.0.0.1:5000/api/patients/${encodeURIComponent(patientId)}`,
                {
                    method: "GET",

                    headers: {
                        "Accept":
                            "application/json"
                    }
                }
            );


        const patientData =
            await patientResponse.json();


        console.log(
            "Patient information:",
            patientData
        );


        if (
            !patientResponse.ok ||
            !patientData.success ||
            !patientData.patient
        ) {

            throw new Error(
                patientData.message ||
                "Unable to load patient information."
            );

        }


        /* ====================================================
           2. GET PATIENT ASSESSMENTS
        ==================================================== */

        const assessmentResponse =
            await fetch(
                `http://127.0.0.1:5000/api/assessment/patient/${encodeURIComponent(patientId)}`,
                {
                    method: "GET",

                    headers: {
                        "Accept":
                            "application/json"
                    }
                }
            );


        const assessmentData =
            await assessmentResponse.json();


        console.log(
            "Patient assessments:",
            assessmentData
        );


        if (
            !assessmentResponse.ok ||
            !assessmentData.success
        ) {

            throw new Error(
                assessmentData.message ||
                "Unable to load patient assessment."
            );

        }


        /* ====================================================
           3. SAVE SELECTED PATIENT
        ==================================================== */

        const patient =
            patientData.patient;


        const assessments =
            Array.isArray(
                assessmentData.assessments
            )
                ? assessmentData.assessments
                : [];


        window.selectedDoctorPatient =
            patient;


        window.selectedDoctorAssessments =
            assessments;


        localStorage.setItem(
            "selectedPatientId",
            patientId
        );


        /* ====================================================
           4. OPEN CONSULTATION SECTION
        ==================================================== */

        showSection(
            "consultationSection"
        );


        /* ====================================================
           5. FIND CONSULTATION WORKSPACE
        ==================================================== */

        const consultationSection =
            document.getElementById(
                "consultationSection"
            );


        if (!consultationSection) {

            throw new Error(
                "Consultation section not found."
            );

        }


        const workspace =
            consultationSection.querySelector(
                ".coming-card"
            );


        if (!workspace) {

            throw new Error(
                "Consultation workspace not found."
            );

        }


        /* ====================================================
           6. GET LATEST ASSESSMENT
        ==================================================== */

        const latestAssessment =
            assessments.length > 0
                ? assessments[0]
                : null;


        /* ====================================================
           7. DISPLAY PATIENT CONSULTATION
        ==================================================== */

        workspace.className =
            "doctor-patient-workspace";


        workspace.innerHTML = `

            <div
                style="
                    width:100%;
                    box-sizing:border-box;
                "
            >

                <!-- HEADER -->

                <div
                    style="
                        display:flex;
                        justify-content:space-between;
                        align-items:center;
                        gap:20px;
                        margin-bottom:25px;
                        flex-wrap:wrap;
                    "
                >

                    <div>

                        <h3
                            style="
                                margin:0 0 8px 0;
                                font-size:24px;
                                color:#17213b;
                            "
                        >
                            Patient Consultation
                        </h3>

                        <p
                            style="
                                margin:0;
                                color:#718096;
                            "
                        >
                            Patient ID:
                            <strong>
                                ${escapeHtml(
                                    patient.patient_id ||
                                    patientId
                                )}
                            </strong>
                        </p>

                    </div>


                    <div
                        style="
                            padding:10px 18px;
                            border-radius:25px;
                            background:#eef5ff;
                            color:#2563eb;
                            font-weight:600;
                        "
                    >
                        🏥
                        ${escapeHtml(
                            patient.department ||
                            latestAssessment?.department ||
                            "Department"
                        )}
                    </div>

                </div>


                <!-- PATIENT DETAILS -->

                <div
                    style="
                        display:grid;
                        grid-template-columns:
                            repeat(
                                auto-fit,
                                minmax(200px, 1fr)
                            );
                        gap:15px;
                        margin-bottom:22px;
                    "
                >

                    <div
                        style="
                            background:#f8fafc;
                            padding:18px;
                            border-radius:12px;
                        "
                    >

                        <div
                            style="
                                color:#718096;
                                font-size:13px;
                                margin-bottom:6px;
                            "
                        >
                            Patient Name
                        </div>

                        <strong>
                            ${escapeHtml(
                                patient.full_name ||
                                "N/A"
                            )}
                        </strong>

                    </div>


                    <div
                        style="
                            background:#f8fafc;
                            padding:18px;
                            border-radius:12px;
                        "
                    >

                        <div
                            style="
                                color:#718096;
                                font-size:13px;
                                margin-bottom:6px;
                            "
                        >
                            Age
                        </div>

                        <strong>
                            ${escapeHtml(
                                patient.age ??
                                "N/A"
                            )}
                        </strong>

                    </div>


                    <div
                        style="
                            background:#f8fafc;
                            padding:18px;
                            border-radius:12px;
                        "
                    >

                        <div
                            style="
                                color:#718096;
                                font-size:13px;
                                margin-bottom:6px;
                            "
                        >
                            Gender
                        </div>

                        <strong>
                            ${escapeHtml(
                                patient.gender ||
                                "N/A"
                            )}
                        </strong>

                    </div>


                    <div
                        style="
                            background:#f8fafc;
                            padding:18px;
                            border-radius:12px;
                        "
                    >

                        <div
                            style="
                                color:#718096;
                                font-size:13px;
                                margin-bottom:6px;
                            "
                        >
                            Phone
                        </div>

                        <strong>
                            ${escapeHtml(
                                patient.phone ||
                                "N/A"
                            )}
                        </strong>

                    </div>

                </div>


                <!-- SYMPTOMS -->

                <div
                    style="
                        background:#f8fafc;
                        padding:20px;
                        border-radius:14px;
                        margin-bottom:20px;
                    "
                >

                    <h4
                        style="
                            margin:0 0 10px 0;
                            color:#17213b;
                        "
                    >
                        🔍 Registered Symptoms
                    </h4>

                    <p
                        style="
                            margin:0;
                            color:#4a5568;
                            line-height:1.6;
                        "
                    >
                        ${escapeHtml(
                            patient.symptoms ||
                            latestAssessment?.symptoms ||
                            "No symptoms recorded."
                        )}
                    </p>

                </div>


                ${
                    latestAssessment
                    ?

                    `

                    <!-- AI TRIAGE -->

                    <div
                        style="
                            background:#f8fafc;
                            padding:20px;
                            border-radius:14px;
                            margin-bottom:20px;
                        "
                    >

                        <h4
                            style="
                                margin:0 0 15px 0;
                                color:#17213b;
                            "
                        >
                            🤖 AI Triage Result
                        </h4>


                        <div
                            style="
                                display:grid;
                                grid-template-columns:
                                    repeat(
                                        auto-fit,
                                        minmax(180px, 1fr)
                                    );
                                gap:15px;
                            "
                        >

                            <div>

                                <small
                                    style="
                                        color:#718096;
                                    "
                                >
                                    Priority
                                </small>

                                <div
                                    style="
                                        font-size:18px;
                                        font-weight:700;
                                        margin-top:5px;
                                    "
                                >
                                    ${escapeHtml(
                                        latestAssessment.priority ||
                                        "ROUTINE"
                                    )}
                                </div>

                            </div>


                            <div>

                                <small
                                    style="
                                        color:#718096;
                                    "
                                >
                                    Status
                                </small>

                                <div
                                    style="
                                        font-size:18px;
                                        font-weight:700;
                                        margin-top:5px;
                                    "
                                >
                                    ${escapeHtml(
                                        latestAssessment.status ||
                                        "WAITING_DOCTOR"
                                    )}
                                </div>

                            </div>

                        </div>


                        ${
                            latestAssessment.priority_reasons
                            ?

                            `

                            <div
                                style="
                                    margin-top:18px;
                                    padding:14px;
                                    background:#ffffff;
                                    border-radius:10px;
                                "
                            >

                                <strong>
                                    Triage Reason
                                </strong>

                                <p
                                    style="
                                        margin:8px 0 0 0;
                                        color:#4a5568;
                                        line-height:1.6;
                                    "
                                >
                                    ${escapeHtml(
                                        latestAssessment.priority_reasons
                                    )}
                                </p>

                            </div>

                            `

                            :

                            ""

                        }

                    </div>

                    `

                    :

                    `

                    <div
                        style="
                            background:#fff8e6;
                            padding:20px;
                            border-radius:14px;
                            margin-bottom:20px;
                        "
                    >

                        <strong>
                            No nurse assessment available yet.
                        </strong>

                    </div>

                    `

                }


                <!-- VITALS -->

                ${
                    latestAssessment
                    ?

                    `

                    <div
                        style="
                            background:#f8fafc;
                            padding:20px;
                            border-radius:14px;
                            margin-bottom:20px;
                        "
                    >

                        <h4
                            style="
                                margin:0 0 15px 0;
                                color:#17213b;
                            "
                        >
                            ❤️ Patient Vitals
                        </h4>


                        <div
                            style="
                                display:grid;
                                grid-template-columns:
                                    repeat(
                                        auto-fit,
                                        minmax(160px, 1fr)
                                    );
                                gap:12px;
                            "
                        >

                            <div>
                                <small>
                                    Temperature
                                </small>

                                <strong>
                                    ${escapeHtml(
                                        latestAssessment.temperature ??
                                        "N/A"
                                    )}
                                </strong>
                            </div>


                            <div>
                                <small>
                                    Heart Rate
                                </small>

                                <strong>
                                    ${escapeHtml(
                                        latestAssessment.heart_rate ??
                                        "N/A"
                                    )}
                                </strong>
                            </div>


                            <div>
                                <small>
                                    Blood Pressure
                                </small>

                                <strong>
                                    ${
                                        latestAssessment.systolic_bp != null
                                        ?
                                        `${escapeHtml(
                                            latestAssessment.systolic_bp
                                        )}/${escapeHtml(
                                            latestAssessment.diastolic_bp
                                        )}`
                                        :
                                        "N/A"
                                    }
                                </strong>
                            </div>


                            <div>
                                <small>
                                    SpO₂
                                </small>

                                <strong>
                                    ${escapeHtml(
                                        latestAssessment.oxygen_saturation ??
                                        "N/A"
                                    )}
                                </strong>
                            </div>

                        </div>

                    </div>

                    `

                    :

                    ""

                }


                <!-- CONSULTATION ACTION -->

                <div
                    style="
                        margin-top:25px;
                        padding:20px;
                        border-radius:14px;
                        background:#eef5ff;
                    "
                >

                    <h4
                        style="
                            margin:0 0 8px 0;
                            color:#17213b;
                        "
                    >
                        🩺 Doctor Consultation
                    </h4>

                    <p
                        style="
                            margin:0;
                            color:#4a5568;
                        "
                    >
                        Patient information and AI triage
                        are loaded successfully.
                    </p>

                </div>

            </div>

        `;


        console.log(
            "Patient consultation loaded successfully:",
            patient
        );


    } catch (error) {

        console.error(
            "Open patient error:",
            error
        );


        alert(
            error.message ||
            "Unable to open patient."
        );

    }

}

/* ============================================================
   START CONSULTATION
============================================================ */

async function startConsultation(
    assessmentId
) {

    if (!assessmentId) {

        alert(
            "Assessment ID is missing."
        );

        return false;
    }


    try {

        const response =
            await fetch(
                `${DOCTOR_ACTION_API}/assessment/${assessmentId}/start`,
                {
                    method: "PUT",

                    headers: {
                        "Accept":
                            "application/json"
                    }
                }
            );


        const contentType =
            response.headers.get(
                "content-type"
            ) || "";


        let data;


        if (
            contentType.includes(
                "application/json"
            )
        ) {

            data =
                await response.json();

        }
        else {

            throw new Error(
                `Server returned non-JSON response (${response.status}).`
            );

        }


        if (
            !response.ok ||
            !data.success
        ) {

            alert(
                data.message ||
                "Unable to start consultation."
            );

            return false;
        }


        await loadDoctorQueue();

        return true;


    } catch (error) {

        console.error(
            "Start consultation error:",
            error
        );

        alert(
            error.message ||
            "Unable to connect to server."
        );

        return false;

    }

}


/* ============================================================
   DOCTOR CONSULTATION WORKSPACE
============================================================ */

window.selectedDoctorAssessmentId = null;
window.selectedTreatmentType = null;


/* ============================================================
   LOAD SELECTED PATIENT INTO CONSULTATION
============================================================ */
window.loadDoctorPatient = function (patient, assessments) {

    /* ========================================================
       SHOW REAL CONSULTATION WORKSPACE
    ======================================================== */

    const consultationWorkspace =
        document.getElementById(
            "doctorConsultationWorkspace"
        );

    const consultationEmptyState =
        document.getElementById(
            "consultationEmptyState"
        );

    if (consultationWorkspace) {
        consultationWorkspace.style.display = "block";
    }

    if (consultationEmptyState) {
        consultationEmptyState.style.display = "none";
    }


    /* ========================================================
       EXISTING PATIENT LOADING CODE
    ======================================================== */

    console.log(
        "Loading patient into consultation:",
        patient,
        assessments
    );


    /* --------------------------------------------------------
       FIND ACTIVE ASSESSMENT
    -------------------------------------------------------- */

    let assessment = assessments.find(function (item) {

        const status = String(
            item.status || ""
        ).toUpperCase();

        return (
            status === "IN_PROGRESS" ||
            status === "STARTED" ||
            status === "PENDING" ||
            status === "WAITING"
        );

    });


    if (!assessment && assessments.length > 0) {

        assessment = assessments[0];

    }


    if (assessment) {

        window.selectedDoctorAssessmentId =
            assessment.id ||
            assessment.assessment_id ||
            assessment.assessmentId ||
            null;

    }
    else {

        window.selectedDoctorAssessmentId = null;

    }


    console.log(
        "Selected assessment ID:",
        window.selectedDoctorAssessmentId
    );


    /* ========================================================
       PATIENT BASIC INFORMATION
    ======================================================== */

    setConsultationValue(
        "consultationPatientName",
        getPatientValue(
            patient,
            [
                "name",
                "full_name",
                "patient_name",
                "patientName"
            ],
            "Patient"
        )
    );


    setConsultationValue(
        "consultationPatientId",
        getPatientValue(
            patient,
            [
                "patient_id",
                "patientId",
                "id"
            ],
            "-"
        )
    );


    setConsultationValue(
        "consultationPatientAge",
        getPatientValue(
            patient,
            [
                "age"
            ],
            "-"
        )
    );


    setConsultationValue(
        "consultationPatientGender",
        getPatientValue(
            patient,
            [
                "gender",
                "sex"
            ],
            "-"
        )
    );


    /* ========================================================
       PATIENT DETAILS
    ======================================================== */

    setConsultationValue(
        "patientBlood",
        getPatientValue(
            patient,
            [
                "blood_group",
                "bloodGroup",
                "blood_type",
                "bloodType"
            ],
            "-"
        )
    );


    setConsultationValue(
        "patientPhone",
        getPatientValue(
            patient,
            [
                "phone",
                "mobile",
                "mobile_number",
                "phone_number"
            ],
            "-"
        )
    );


    setConsultationValue(
        "patientDepartment",
        getPatientValue(
            patient,
            [
                "department",
                "department_name"
            ],
            "-"
        )
    );


    setConsultationValue(
        "patientPriority",
        normalizePriority(
            getPatientValue(
                patient,
                [
                    "priority",
                    "triage_priority"
                ],
                "NORMAL"
            )
        )
    );


    /* ========================================================
       SYMPTOMS
    ======================================================== */

    const symptoms =
        getPatientValue(
            patient,
            [
                "symptoms",
                "symptom",
                "chief_complaint",
                "complaint"
            ],
            ""
        );


    setConsultationValue(
        "patientSymptoms",
        symptoms || "No symptoms recorded"
    );


    /* ========================================================
       VITALS
    ======================================================== */

    setConsultationValue(
        "temperature",
        getPatientValue(
            patient,
            [
                "temperature",
                "temp"
            ],
            ""
        )
    );


    setConsultationValue(
        "heartRate",
        getPatientValue(
            patient,
            [
                "heart_rate",
                "heartRate",
                "pulse"
            ],
            ""
        )
    );


    setConsultationValue(
        "bloodPressure",
        getPatientValue(
            patient,
            [
                "blood_pressure",
                "bloodPressure",
                "bp"
            ],
            ""
        )
    );


    setConsultationValue(
        "oxygen",
        getPatientValue(
            patient,
            [
                "oxygen",
                "oxygen_saturation",
                "spo2",
                "SpO2"
            ],
            ""
        )
    );


    /* ========================================================
       RESET DOCTOR INPUTS
    ======================================================== */

    setConsultationValue(
        "diagnosis",
        ""
    );

    setConsultationValue(
        "clinicalNotes",
        ""
    );

    setConsultationValue(
        "treatmentAdvice",
        ""
    );


    window.selectedTreatmentType = null;


    const message =
        document.getElementById(
            "selectedTreatmentMessage"
        );

    if (message) {

        message.textContent =
            "Select OPD or IPD treatment.";

    }


    /* ========================================================
       START ASSESSMENT
    ======================================================== */

    if (window.selectedDoctorAssessmentId) {

        startConsultation(
            window.selectedDoctorAssessmentId
        );

    }


    console.log(
        "Consultation workspace loaded successfully."
    );

};


/* ============================================================
   SAFE PATIENT VALUE READER
============================================================ */

function getPatientValue(
    object,
    keys,
    fallback = ""
) {

    if (!object) {
        return fallback;
    }

    for (const key of keys) {

        if (
            object[key] !== undefined &&
            object[key] !== null &&
            String(object[key]).trim() !== ""
        ) {

            return object[key];

        }

    }

    return fallback;
}


/* ============================================================
   SET CONSULTATION FIELD
============================================================ */

function setConsultationValue(
    elementId,
    value
) {

    const element =
        document.getElementById(elementId);

    if (!element) {
        return;
    }


    if (
        element.tagName === "INPUT" ||
        element.tagName === "TEXTAREA" ||
        element.tagName === "SELECT"
    ) {

        element.value =
            value === undefined ||
            value === null
                ? ""
                : value;

    }
    else {

        element.textContent =
            value === undefined ||
            value === null
                ? ""
                : value;

    }

}


/* ============================================================
   SELECT OPD
============================================================ */

window.selectTreatmentType = function (
    treatmentType
) {

    treatmentType =
        String(
            treatmentType || ""
        )
        .trim()
        .toUpperCase();


    if (
        treatmentType !== "OPD" &&
        treatmentType !== "IPD"
    ) {

        return;

    }


    window.selectedTreatmentType =
        treatmentType;


    const message =
        document.getElementById(
            "selectedTreatmentMessage"
        );


    if (message) {

        if (treatmentType === "OPD") {

            message.textContent =
                "OPD selected — patient will continue to prescription.";

        }
        else {

            message.textContent =
                "IPD selected — patient will continue to admission.";

        }

    }


    document
        .querySelectorAll(
            "[data-treatment-type]"
        )
        .forEach(function (button) {

            button.classList.remove(
                "selected"
            );

        });


    const selectedButton =
        document.querySelector(
            `[data-treatment-type="${treatmentType}"]`
        );


    if (selectedButton) {

        selectedButton.classList.add(
            "selected"
        );

    }

};


/* ============================================================
   SUBMIT DOCTOR CONSULTATION
============================================================ */

window.submitDoctorConsultation =
    async function () {

        const assessmentId =
            window.selectedDoctorAssessmentId;


        if (!assessmentId) {

            alert(
                "No active assessment found for this patient."
            );

            return;

        }


        const diagnosis =
            getInputValue(
                "diagnosis"
            );


        const clinicalNotes =
            getInputValue(
                "clinicalNotes"
            );


        const treatmentAdvice =
            getInputValue(
                "treatmentAdvice"
            );


        const treatmentType =
            window.selectedTreatmentType;


        if (!diagnosis) {

            alert(
                "Please enter the diagnosis."
            );

            return;

        }


        if (!clinicalNotes) {

            alert(
                "Please enter clinical notes."
            );

            return;

        }


        if (!treatmentAdvice) {

            alert(
                "Please enter treatment/advice."
            );

            return;

        }


        if (
            treatmentType !== "OPD" &&
            treatmentType !== "IPD"
        ) {

            alert(
                "Please select OPD or IPD."
            );

            return;

        }


        /* ----------------------------------------------------
           Current backend accepts consultation_notes.
           Combine doctor-entered information into that field.
        ---------------------------------------------------- */

        const consultationNotes =
`Diagnosis:
${diagnosis}

Clinical Notes:
${clinicalNotes}

Treatment / Advice:
${treatmentAdvice}`;


        const button =
            document.getElementById(
                "submitConsultationBtn"
            );


        if (button) {

            button.disabled = true;

            button.dataset.originalText =
                button.textContent;

            button.textContent =
                "Saving Consultation...";

        }


        try {

            const success =
                await completeConsultation(
                    assessmentId,
                    consultationNotes,
                    treatmentType
                );


            if (success) {

                const message =
                    document.getElementById(
                        "selectedTreatmentMessage"
                    );


                if (message) {

                    message.textContent =
                        treatmentType === "OPD"
                            ? "Consultation completed. Moving to prescription..."
                            : "Consultation completed. Moving to IPD admission...";

                }

            }


        }
        finally {

            if (button) {

                button.disabled = false;

                button.textContent =
                    button.dataset.originalText ||
                    "Complete Consultation";

            }

        }

    };


/* ============================================================
   INPUT VALUE
============================================================ */

function getInputValue(
    elementId
) {

    const element =
        document.getElementById(
            elementId
        );


    if (!element) {
        return "";
    }


    return String(
        element.value || ""
    ).trim();

};


/* ============================================================
   TREATMENT BUTTON COMPATIBILITY
============================================================ */

window.selectOPD = function () {

    selectTreatmentType(
        "OPD"
    );

};


window.selectIPD = function () {

    selectTreatmentType(
        "IPD"
    );

};


/* ============================================================
   CONSULTATION EVENT LISTENER
============================================================ */

document.addEventListener(
    "doctorPatientSelected",
    function (event) {

        if (!event.detail) {
            return;
        }


        loadDoctorPatient(
            event.detail.patient,
            event.detail.assessments
        );

    }
);
/* ============================================================
   COMPLETE CONSULTATION
============================================================ */

async function completeConsultation(
    assessmentId,
    consultationNotes,
    treatmentType
) {

    if (!assessmentId) {

        alert(
            "Assessment ID is missing."
        );

        return false;
    }


    if (
        !consultationNotes ||
        !String(
            consultationNotes
        ).trim()
    ) {

        alert(
            "Consultation notes are required."
        );

        return false;
    }


    treatmentType =
        String(
            treatmentType || ""
        )
        .trim()
        .toUpperCase();


    if (
        treatmentType !== "OPD" &&
        treatmentType !== "IPD"
    ) {

        alert(
            "Treatment type must be OPD or IPD."
        );

        return false;
    }


    try {

        const response =
            await fetch(
                `${DOCTOR_ACTION_API}/assessment/${assessmentId}/complete`,
                {
                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json",

                        "Accept":
                            "application/json"
                    },

                    body:
                        JSON.stringify(
                            {
                                consultation_notes:
                                    String(
                                        consultationNotes
                                    ).trim(),

                                treatment_type:
                                    treatmentType
                            }
                        )
                }
            );


        const contentType =
            response.headers.get(
                "content-type"
            ) || "";


        let data;


        if (
            contentType.includes(
                "application/json"
            )
        ) {

            data =
                await response.json();

        }
        else {

            throw new Error(
                `Server returned non-JSON response (${response.status}).`
            );

        }


        if (
            !response.ok ||
            !data.success
        ) {

            alert(
                data.message ||
                "Unable to complete consultation."
            );

            return false;
        }


        await loadDoctorQueue();


        /*
           OPD → Prescription
        */

        if (
    data.next_step ===
    "PRESCRIPTION"
) {

    /* ============================================
       OPEN PRESCRIPTION SECTION
    ============================================ */

    showSection(
        "prescriptionSection"
    );


    /* ============================================
       LOAD CURRENT PATIENT INTO PRESCRIPTION
    ============================================ */

    if (
        typeof loadOPDPrescriptionPatient ===
        "function"
    ) {

        loadOPDPrescriptionPatient();

    }

}


        /*
           IPD → Admission
        */

        else if (
    data.next_step ===
    "IPD_ADMISSION"
) {

    openDoctorIPDSection();

}


        return true;


    } catch (error) {

        console.error(
            "Complete consultation error:",
            error
        );

        alert(
            error.message ||
            "Unable to connect to server."
        );

        return false;

    }

}


/* ============================================================
   PRIORITY NORMALIZER
============================================================ */

function normalizePriority(
    value
) {

    const priority =
        String(
            value || ""
        )
        .trim()
        .toUpperCase();


    if (
        priority === "EMERGENCY" ||
        priority === "CRITICAL" ||
        priority === "RED"
    ) {

        return "EMERGENCY";

    }


    if (
        priority === "URGENT" ||
        priority === "HIGH" ||
        priority === "ORANGE"
    ) {

        return "URGENT";

    }


    if (
        priority === "MEDIUM" ||
        priority === "MODERATE" ||
        priority === "YELLOW"
    ) {

        return "MEDIUM";

    }


    if (
        priority === "NORMAL" ||
        priority === "ROUTINE" ||
        priority === "LOW" ||
        priority === "GREEN"
    ) {

        return "NORMAL";

    }


    return "NORMAL";

}


/* ============================================================
   PRIORITY ICON
============================================================ */

function getPriorityIcon(
    priority
) {

    const normalized =
        normalizePriority(
            priority
        );


    if (
        normalized ===
        "EMERGENCY"
    ) {

        return "🔴";

    }


    if (
        normalized ===
        "URGENT"
    ) {

        return "🟠";

    }


    if (
        normalized ===
        "MEDIUM"
    ) {

        return "🟡";

    }


    return "🟢";

}


/* ============================================================
   INITIAL
============================================================ */

function getInitial(
    name
) {

    if (!name) {
        return "?";
    }


    return String(
        name
    )
    .trim()
    .charAt(0)
    .toUpperCase();

}


/* ============================================================
   PATIENT NAME
============================================================ */

function getPatientName(
    patient
) {

    if (!patient) {
        return "Patient";
    }


    return (
        patient.patient_name ||
        patient.full_name ||
        patient.name ||
        (
            patient.patient &&
            (
                patient.patient.full_name ||
                patient.patient.name
            )
        ) ||
        "Patient"
    );

}


/* ============================================================
   SAFE HTML
============================================================ */

function escapeHtml(
    value
) {

    return String(
        value ?? ""
    )
    .replace(
        /&/g,
        "&amp;"
    )
    .replace(
        /</g,
        "&lt;"
    )
    .replace(
        />/g,
        "&gt;"
    )
    .replace(
        /"/g,
        "&quot;"
    )
    .replace(
        /'/g,
        "&#039;"
    );

}


/*
   Compatibility alias.
*/

function escapeHTML(
    value
) {

    return escapeHtml(
        value
    );

}


/* ============================================================
   SAFE JAVASCRIPT STRING
============================================================ */

function escapeJs(
    value
) {

    return String(
        value ?? ""
    )
    .replace(
        /\\/g,
        "\\\\"
    )
    .replace(
        /'/g,
        "\\'"
    )
    .replace(
        /"/g,
        '\\"'
    )
    .replace(
        /\r/g,
        "\\r"
    )
    .replace(
        /\n/g,
        "\\n"
    );

}
/* ============================================================
   DOCTOR SECTION NAVIGATION
   Supports both page-section and doctor-section
============================================================ */

function showSection(
    sectionId,
    clickedButton = null
) {

    if (!sectionId) {
        return;
    }

    console.log(
        "Opening doctor section:",
        sectionId
    );


    /* ========================================================
       HIDE ALL SECTIONS
    ======================================================== */

    const sections =
        document.querySelectorAll(
            ".page-section, .doctor-section"
        );


    sections.forEach(
        function(section) {

            section.classList.remove(
                "active-section"
            );

            section.style.display =
                "none";

        }
    );


    /* ========================================================
       SHOW SELECTED SECTION
    ======================================================== */

    const selectedSection =
        document.getElementById(
            sectionId
        );


    if (!selectedSection) {

        console.error(
            "Section not found:",
            sectionId
        );

        return;

    }


    selectedSection.classList.add(
        "active-section"
    );

    selectedSection.style.display =
        "block";


    /* ========================================================
       SIDEBAR ACTIVE BUTTON
    ======================================================== */

    const buttons =
        document.querySelectorAll(
            ".sidebar-nav .nav-item, .nav-item"
        );


    buttons.forEach(
        function(button) {

            button.classList.remove(
                "active"
            );

        }
    );


    if (clickedButton) {

        clickedButton.classList.add(
            "active"
        );

    }
    else {

        const matchingButton =
            document.querySelector(
                `[data-section="${sectionId}"]`
            );


        if (matchingButton) {

            matchingButton.classList.add(
                "active"
            );

        }

    }


    /* ========================================================
       LOAD QUEUE
    ======================================================== */

    if (
        sectionId ===
        "queueSection"
    ) {

        loadDoctorQueue();

    }


    /* ========================================================
       TOP OF PAGE
    ======================================================== */

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}

/* ============================================================
   COMPATIBILITY NAVIGATION
============================================================ */

function showDoctorSection(
    sectionId,
    clickedButton = null
) {

    return showSection(
        sectionId,
        clickedButton
    );

}


/* ============================================================
   LOGOUT
============================================================ */

function logoutDoctor() {

    try {

        localStorage.removeItem(
            "currentUser"
        );

        localStorage.removeItem(
            "user"
        );

        localStorage.removeItem(
            "user_id"
        );

        localStorage.removeItem(
            "userId"
        );

        localStorage.removeItem(
            "doctor_id"
        );

        localStorage.removeItem(
            "doctorId"
        );

        localStorage.removeItem(
            "username"
        );

        localStorage.removeItem(
            "full_name"
        );

        localStorage.removeItem(
            "role"
        );

        localStorage.removeItem(
            "department_id"
        );

        localStorage.removeItem(
            "phone"
        );

        localStorage.removeItem(
            "email"
        );

    } catch (error) {

        console.warn(
            "Logout storage cleanup error:",
            error
        );

    }


    window.location.href =
        "login.html";

}


function doctorLogout() {

    return logoutDoctor();

}


// ============================================================
// MEDIMATRIX DOCTOR NOTIFICATION SYSTEM
// ============================================================

async function loadDoctorNotifications() {

    try {

        
        const doctor = getDoctorData();

const doctorId =
    doctor?.user_id ||
    doctor?.doctor_id ||
    doctor?.id ||
    localStorage.getItem("doctor_id") ||
    localStorage.getItem("doctorId") ||
    "";

        if (!doctorId) {

            console.warn(
                "Doctor ID not found."
            );

            doctorNotifications = [];

            updateDoctorNotificationBadge();

            return;
        }

        const url =
    `${API_BASE_URL}/api/notifications/doctor` +
    `?user_id=${encodeURIComponent(doctorId)}`;

        console.log(
            "Loading doctor notifications:",
            url
        );

        const response =
            await fetch(
                url,
                {
                    method: "GET",
                    headers: {
                        "Accept":
                            "application/json"
                    }
                }
            );

        const data =
            await response.json();

        console.log(
            "Doctor notification response:",
            data
        );

        if (
            !response.ok ||
            !data.success
        ) {

            throw new Error(
                data.message ||
                `Notification request failed: HTTP ${response.status}`
            );
        }

        doctorNotifications =
            Array.isArray(
                data.notifications
            )
                ? data.notifications
                : [];

        updateDoctorNotificationBadge();

    }
    catch (error) {

        console.error(
            "Doctor notification error:",
            error
        );

        doctorNotifications = [];

        updateDoctorNotificationBadge();
    }
}


// ============================================================
// UPDATE NOTIFICATION BADGE
// ============================================================

function updateDoctorNotificationBadge() {

    const possibleIds = [
        "notificationCount",
        "notificationBadge",
        "doctorNotificationBadge",
        "headerNotificationBadge"
    ];

    let badge = null;

    for (
        const id of possibleIds
    ) {

        const element =
            document.getElementById(id);

        if (element) {

            badge = element;

            break;
        }
    }

    if (!badge) {

        console.warn(
            "Doctor notification badge element not found."
        );

        return;
    }

    const unreadCount =
        Array.isArray(
            doctorNotifications
        )
            ? doctorNotifications.filter(
                function (notification) {

                    return !notification.is_read;

                }
            ).length
            : 0;

    badge.textContent =
        unreadCount > 99
            ? "99+"
            : String(unreadCount);

    badge.style.display =
        unreadCount > 0
            ? "flex"
            : "none";
}


// ============================================================
// CREATE NOTIFICATION PANEL
// ============================================================

function createDoctorNotificationPanel() {

    let panel =
        document.getElementById(
            "doctorNotificationPanel"
        );

    if (panel) {

        return panel;
    }

    panel =
        document.createElement(
            "div"
        );

    panel.id =
        "doctorNotificationPanel";

    panel.style.position =
        "fixed";

    panel.style.top =
        "82px";

    panel.style.right =
        "30px";

    panel.style.width =
        "420px";

    panel.style.maxWidth =
        "calc(100vw - 40px)";

    panel.style.maxHeight =
        "520px";

    panel.style.overflowY =
        "auto";

    panel.style.background =
        "#ffffff";

    panel.style.border =
        "1px solid #e2e8f0";

    panel.style.borderRadius =
        "16px";

    panel.style.boxShadow =
        "0 20px 50px rgba(0,0,0,0.20)";

    panel.style.zIndex =
        "999999";

    panel.style.display =
        "none";

    document.body.appendChild(
        panel
    );

    return panel;
}


// ============================================================
// RENDER NOTIFICATIONS
// ============================================================

function renderDoctorNotifications() {

    const panel =
        createDoctorNotificationPanel();

    if (
        !Array.isArray(
            doctorNotifications
        ) ||
        doctorNotifications.length === 0
    ) {

        panel.innerHTML = `
            <div style="
                padding:30px;
                text-align:center;
                font-family:Arial,sans-serif;
            ">

                <div style="
                    font-size:40px;
                    margin-bottom:12px;
                ">
                    🔔
                </div>

                <h3 style="
                    margin:0;
                    color:#172033;
                ">
                    No Notifications
                </h3>

                <p style="
                    color:#64748b;
                    font-size:14px;
                ">
                    New patients ready for consultation
                    will appear here.
                </p>

            </div>
        `;

        return;
    }


    let html = `
        <div style="
            padding:18px 20px;
            border-bottom:1px solid #e2e8f0;
            display:flex;
            justify-content:space-between;
            align-items:center;
            font-family:Arial,sans-serif;
        ">

            <div>

                <strong style="
                    font-size:18px;
                    color:#172033;
                ">
                    🔔 Doctor Notifications
                </strong>

                <div style="
                    margin-top:4px;
                    font-size:12px;
                    color:#64748b;
                ">
                    ${doctorNotifications.length}
                    notification(s)
                </div>

            </div>

        </div>
    `;


    doctorNotifications.forEach(
        function (notification) {

            const patientId =
                notification.patient_id ||
                "-";

            const patientName =
                notification.patient_name ||
                "Patient";

            const title =
                notification.title ||
                "New Patient";

            const message =
                notification.message ||
                "Patient is ready for consultation.";

            const unread =
                !notification.is_read;


            html += `
                <div style="
                    padding:18px 20px;
                    border-bottom:1px solid #e2e8f0;
                    background:${unread
                        ? "#f8fbff"
                        : "#ffffff"
                    };
                    font-family:Arial,sans-serif;
                ">

                    <div style="
                        display:flex;
                        gap:12px;
                    ">

                        <div style="
                            width:42px;
                            height:42px;
                            min-width:42px;
                            border-radius:50%;
                            background:#eaf2ff;
                            display:flex;
                            align-items:center;
                            justify-content:center;
                            font-size:21px;
                        ">
                            🩺
                        </div>

                        <div style="
                            flex:1;
                            min-width:0;
                        ">

                            <strong style="
                                display:block;
                                color:#172033;
                                font-size:14px;
                                margin-bottom:7px;
                            ">
                                ${escapeHtml(title)}
                            </strong>

                            <div style="
                                color:#475569;
                                font-size:13px;
                                line-height:1.5;
                                margin-bottom:10px;
                            ">
                                ${escapeHtml(message)}
                            </div>

                            <div style="
                                display:flex;
                                gap:7px;
                                flex-wrap:wrap;
                                margin-bottom:12px;
                            ">

                                <span style="
                                    padding:5px 8px;
                                    border-radius:6px;
                                    background:#f1f5f9;
                                    font-size:11px;
                                ">
                                    🆔
                                    ${escapeHtml(patientId)}
                                </span>

                                <span style="
                                    padding:5px 8px;
                                    border-radius:6px;
                                    background:#f1f5f9;
                                    font-size:11px;
                                ">
                                    👤
                                    ${escapeHtml(patientName)}
                                </span>

                            </div>

                            <div style="
                                display:flex;
                                gap:8px;
                            ">

                                <button
                                    type="button"
                                    onclick="openDoctorNotificationPatient(
                                        '${escapeJs(patientId)}',
                                        ${Number(notification.id) || 0}
                                    )"
                                    style="
                                        border:none;
                                        background:#2563eb;
                                        color:white;
                                        padding:8px 14px;
                                        border-radius:8px;
                                        cursor:pointer;
                                        font-size:12px;
                                    "
                                >
                                    Open Patient
                                </button>

                                ${
                                    unread
                                        ? `
                                            <button
                                                type="button"
                                                onclick="markDoctorNotificationRead(
                                                    ${Number(notification.id) || 0}
                                                )"
                                                style="
                                                    border:1px solid #cbd5e1;
                                                    background:white;
                                                    color:#475569;
                                                    padding:8px 12px;
                                                    border-radius:8px;
                                                    cursor:pointer;
                                                    font-size:12px;
                                                "
                                            >
                                                Mark read
                                            </button>
                                        `
                                        : ""
                                }

                            </div>

                        </div>

                    </div>

                </div>
            `;
        }
    );


    panel.innerHTML =
        html;
}


// ============================================================
// SHOW / HIDE NOTIFICATIONS
// ============================================================

async function showNotifications() {

    await loadDoctorNotifications();

    const panel =
        createDoctorNotificationPanel();

    renderDoctorNotifications();

    if (
        panel.style.display === "none" ||
        panel.style.display === ""
    ) {

        panel.style.display =
            "block";

    }
    else {

        panel.style.display =
            "none";
    }
}


// ============================================================
// MARK ONE NOTIFICATION READ
// ============================================================

async function markDoctorNotificationRead(
    notificationId
) {

    if (!notificationId) {

        return;
    }

    try {

        const response =
            await fetch(
                `${API_BASE_URL}/api/notifications/${notificationId}/read`,
                {
                    method: "PUT",
                    headers: {
                        "Accept":
                            "application/json"
                    }
                }
            );

        const data =
            await response.json();

        if (
            !response.ok ||
            !data.success
        ) {

            throw new Error(
                data.message ||
                "Unable to mark notification as read."
            );
        }

        await loadDoctorNotifications();

    }
    catch (error) {

        console.error(
            "Mark notification error:",
            error
        );
    }
}


// ============================================================
// MARK ALL DOCTOR NOTIFICATIONS READ
// ============================================================

async function markAllDoctorNotificationsRead() {

    try {

        const userId =
            localStorage.getItem("user_id") ||
            localStorage.getItem("userId") ||
            localStorage.getItem("doctor_id") ||
            "";

        if (!doctorId) {

            return;
        }

        const response =
            await fetch(
                `${API_BASE_URL}/api/notifications/doctor/read-all?user_id=${encodeURIComponent(userId)}`,
                {
                    method: "PUT",
                    headers: {
                        "Accept":
                            "application/json"
                    }
                }
            );

        const data =
            await response.json();

        if (
            !response.ok ||
            !data.success
        ) {

            throw new Error(
                data.message ||
                "Unable to mark notifications as read."
            );
        }

        await loadDoctorNotifications();

        renderDoctorNotifications();

    }
    catch (error) {

        console.error(
            "Mark all notifications error:",
            error
        );
    }
}


async function openDoctorNotificationPatient(
    patientId,
    notificationId
) {

    console.log(
        "Doctor notification: opening patient:",
        patientId
    );

    /* ========================================================
       MARK NOTIFICATION AS READ
       ======================================================== */

    if (notificationId) {

        await markDoctorNotificationRead(
            notificationId
        );

    }


    /* ========================================================
       CLOSE NOTIFICATION PANEL
       ======================================================== */

    const panel =
        document.getElementById(
            "doctorNotificationPanel"
        );

    if (panel) {

        panel.style.display =
            "none";

    }


    /* ========================================================
       OPEN PATIENT USING EXISTING FUNCTION
       ======================================================== */

    if (patientId) {

        await openPatientFromNotification(
            patientId
        );

        return;

    }


    /* ========================================================
       FALLBACK
       ======================================================== */

    console.warn(
        "Patient ID is missing from doctor notification."
    );

}

// ============================================================
// NOTIFICATION POLLING
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        loadDoctorNotifications();

        doctorNotificationTimer =
            setInterval(
                loadDoctorNotifications,
                10000
            );

    }
);


// ============================================================
// CLOSE PANEL WHEN CLICKING OUTSIDE
// ============================================================

document.addEventListener(
    "click",
    function (event) {

        const panel =
            document.getElementById(
                "doctorNotificationPanel"
            );

        if (!panel) {

            return;
        }

        const notificationButton =
            event.target.closest(
                ".notification-button"
            );

        if (notificationButton) {

            return;
        }

        if (
            !panel.contains(
                event.target
            )
        ) {

            panel.style.display =
                "none";
        }

    }
);


// ============================================================
// GLOBAL FUNCTIONS
// ============================================================

window.loadDoctorNotifications =
    loadDoctorNotifications;

window.showNotifications =
    showNotifications;

window.markDoctorNotificationRead =
    markDoctorNotificationRead;

window.markAllDoctorNotificationsRead =
    markAllDoctorNotificationsRead;

window.openDoctorNotificationPatient =
    openDoctorNotificationPatient;

window.updateDoctorNotificationBadge =
    updateDoctorNotificationBadge;

window.renderDoctorNotifications =
    renderDoctorNotifications;

window.createDoctorNotificationPanel =
    createDoctorNotificationPanel;

console.log(
    "MediMatrix Doctor Notification System ready."
);


/* ============================================================
   OPD PRESCRIPTION FRONTEND
============================================================ */

function addPrescriptionMedicine() {

    const body =
        document.getElementById(
            "prescriptionMedicineBody"
        );

    if (!body) {
        return;
    }

    const row =
        document.createElement("tr");

    row.className =
        "medicine-row";

    row.innerHTML = `

        <td>
            <input
                type="text"
                class="prescription-input medicine-name"
                placeholder="Medicine name"
            >
        </td>

        <td>
            <input
                type="text"
                class="prescription-input medicine-dosage"
                placeholder="e.g. 500 mg"
            >
        </td>

        <td>
            <select
                class="prescription-input medicine-frequency"
            >
                <option value="">Select</option>
                <option value="OD">OD</option>
                <option value="BD">BD</option>
                <option value="TDS">TDS</option>
                <option value="QID">QID</option>
                <option value="SOS">SOS</option>
                <option value="HS">HS</option>
            </select>
        </td>

        <td>
            <input
                type="text"
                class="prescription-input medicine-duration"
                placeholder="e.g. 5 days"
            >
        </td>

        <td>
            <select
                class="prescription-input medicine-route"
            >
                <option value="">Select</option>
                <option value="Oral">Oral</option>
                <option value="Topical">Topical</option>
                <option value="IV">IV</option>
                <option value="IM">IM</option>
                <option value="SC">SC</option>
            </select>
        </td>

        <td>
            <input
                type="text"
                class="prescription-input medicine-instructions"
                placeholder="After food..."
            >
        </td>

        <td>
            <button
                type="button"
                class="remove-medicine-btn"
                onclick="removePrescriptionMedicine(this)"
                title="Remove medicine"
            >
                ×
            </button>
        </td>

    `;

    body.appendChild(row);
}


/* ============================================================
   REMOVE MEDICINE
============================================================ */

function removePrescriptionMedicine(button) {

    const row =
        button.closest(".medicine-row");

    if (!row) {
        return;
    }

    const body =
        document.getElementById(
            "prescriptionMedicineBody"
        );

    if (!body) {
        return;
    }

    /*
       Keep at least one medicine row.
    */

    if (
        body.querySelectorAll(
            ".medicine-row"
        ).length <= 1
    ) {

        row.querySelectorAll(
            "input"
        ).forEach(function (input) {
            input.value = "";
        });

        row.querySelectorAll(
            "select"
        ).forEach(function (select) {
            select.value = "";
        });

        return;
    }

    row.remove();
}


/* ============================================================
   LOAD PATIENT INTO PRESCRIPTION
============================================================ */

function loadOPDPrescriptionPatient() {

    const patient =
        window.selectedDoctorPatient || {};

    const assessment =
        window.selectedDoctorAssessments &&
        Array.isArray(window.selectedDoctorAssessments)
            ? window.selectedDoctorAssessments[0]
            : {};

    console.log(
        "Loading patient into prescription:",
        patient
    );

    console.log(
        "Prescription assessment:",
        assessment
    );


    /* ========================================================
       SAFE VALUE
    ======================================================== */

    function firstValue(...values) {

        for (const value of values) {

            if (
                value !== undefined &&
                value !== null &&
                String(value).trim() !== ""
            ) {

                return value;

            }

        }

        return "—";
    }


    /* ========================================================
       PATIENT INFORMATION
    ======================================================== */

    const patientName =
        firstValue(
            patient.patient_name,
            patient.full_name,
            patient.name,
            patient.patientName,
            patient.patient?.patient_name,
            patient.patient?.full_name,
            patient.patient?.name
        );


    const patientId =
        firstValue(
            patient.patient_id,
            patient.patientId,
            patient.id,
            patient.patient?.patient_id
        );


    const age =
        firstValue(
            patient.age,
            patient.patient_age,
            patient.patient?.age
        );


    const gender =
        firstValue(
            patient.gender,
            patient.sex,
            patient.patient_gender,
            patient.patient?.gender,
            patient.patient?.sex
        );


    const department =
        firstValue(
            patient.department,
            patient.department_name,
            assessment.department,
            assessment.department_name,
            patient.patient?.department,
            patient.patient?.department_name
        );


    /* ========================================================
       SET HTML VALUE
    ======================================================== */

    function setValue(id, value) {

        const element =
            document.getElementById(id);

        if (!element) {

            console.warn(
                "Prescription element not found:",
                id
            );

            return;
        }

        element.textContent =
            value || "—";
    }


    /* ========================================================
       POPULATE PRESCRIPTION PATIENT CARD
    ======================================================== */

    setValue(
        "prescriptionPatientName",
        patientName
    );

    setValue(
        "prescriptionPatientId",
        patientId
    );

    setValue(
        "prescriptionPatientAge",
        age
    );

    setValue(
        "prescriptionPatientGender",
        gender
    );

    setValue(
        "prescriptionPatientDepartment",
        department
    );


    /* ========================================================
       SAVE CURRENT PATIENT ID
    ======================================================== */

    if (
        patientId &&
        patientId !== "—"
    ) {

        localStorage.setItem(
            "selectedPatientId",
            String(patientId)
        );

    }


    console.log(
        "Prescription patient loaded successfully:",
        {
            name: patientName,
            patient_id: patientId,
            age: age,
            gender: gender,
            department: department
        }
    );
}


/* ============================================================
   SAVE + SUBMIT OPD PRESCRIPTION
   DOCTOR → PHARMACY
============================================================ */

async function saveOPDPrescription() {

    const rows =
        document.querySelectorAll(
            "#prescriptionMedicineBody .medicine-row"
        );

    const medicines = [];

    
    /* --------------------------------------------------------
       COLLECT MEDICINES
    -------------------------------------------------------- */

    rows.forEach(function (row) {

        const medicine =
            row.querySelector(
                ".medicine-name"
            )?.value.trim() || "";

        const dosage =
            row.querySelector(
                ".medicine-dosage"
            )?.value.trim() || "";

        const frequency =
            row.querySelector(
                ".medicine-frequency"
            )?.value || "";

        const duration =
            row.querySelector(
                ".medicine-duration"
            )?.value.trim() || "";

        const route =
            row.querySelector(
                ".medicine-route"
            )?.value || "";

        const instructions =
            row.querySelector(
                ".medicine-instructions"
            )?.value.trim() || "";


        if (medicine) {

            medicines.push({

                medicine: medicine,

                dosage: dosage,

                frequency: frequency,

                duration: duration,

                route: route,

                instructions: instructions

            });

        }

    });


    /* --------------------------------------------------------
       VALIDATE MEDICINES
    -------------------------------------------------------- */

    if (medicines.length === 0) {

        alert(
            "Please add at least one medicine."
        );

        return;

    }


    /* --------------------------------------------------------
       PATIENT
    -------------------------------------------------------- */

    const patient =
        window.selectedDoctorPatient || {};


    const patientId =
        patient.patient_id ||
        patient.id ||
        "";


    if (!patientId) {

        alert(
            "Patient ID is missing."
        );

        return;

    }


    /* --------------------------------------------------------
       ASSESSMENT
    -------------------------------------------------------- */

    const assessmentId =
        window.selectedDoctorAssessmentId ||
        null;


    if (!assessmentId) {

        alert(
            "Assessment ID is missing."
        );

        return;

    }


    /* --------------------------------------------------------
       DOCTOR INFORMATION
    -------------------------------------------------------- */

    let doctor = {};

    try {

        doctor = JSON.parse(
            localStorage.getItem("doctor") ||
            localStorage.getItem("currentUser") ||
            localStorage.getItem("user") ||
            "{}"
        );

    } catch (error) {

        console.error(
            "Unable to read doctor information:",
            error
        );

        doctor = {};

    }


    const doctorUserId =
        doctor.user_id ||
        doctor.doctor_id ||
        doctor.id ||
        localStorage.getItem("user_id") ||
        localStorage.getItem("userId") ||
        localStorage.getItem("doctor_id") ||
        localStorage.getItem("doctorId") ||
        "";


    /* --------------------------------------------------------
       TREATMENT TYPE
    -------------------------------------------------------- */

    const treatmentType =
        String(
            window.selectedTreatmentType ||
            "OPD"
        )
        .trim()
        .toUpperCase();


    if (
        treatmentType !== "OPD" &&
        treatmentType !== "IPD"
    ) {

        alert(
            "Please select OPD or IPD treatment type."
        );

        return;

    }


    /* --------------------------------------------------------
       DIAGNOSIS
    -------------------------------------------------------- */

    const diagnosis =
    document.getElementById("diagnosis")?.value.trim() || "";

if (!diagnosis) {
    alert("Please enter the diagnosis.");
    return;
}

    /* --------------------------------------------------------
       CONSULTATION INFORMATION
    -------------------------------------------------------- */

    const clinicalNotes =
        document.getElementById(
            "clinicalNotes"
        )?.value.trim() || "";


    const treatmentAdvice =
        document.getElementById(
            "treatmentAdvice"
        )?.value.trim() || "";


    const prescriptionAdvice =
        document.getElementById(
            "prescriptionAdvice"
        )?.value.trim() || "";


    const followUp =
        document.getElementById(
            "prescriptionFollowup"
        )?.value.trim() || "";


    const remarks =
        document.getElementById(
            "prescriptionRemarks"
        )?.value.trim() || "";


    /* --------------------------------------------------------
       COMBINE CONSULTATION NOTES
    -------------------------------------------------------- */

    const consultationNotes =
`Clinical Notes:
${clinicalNotes}

Treatment / Advice:
${treatmentAdvice}

Prescription Advice:
${prescriptionAdvice}

Follow-up:
${followUp}

Remarks:
${remarks}`;


    /* --------------------------------------------------------
       BACKEND PAYLOAD
    -------------------------------------------------------- */

    const payload = {

        patient_id:
            String(patientId),

        assessment_id:
            assessmentId,

        doctor_user_id:
            doctorUserId
                ? String(doctorUserId)
                : "",

        treatment_type:
            treatmentType,

        diagnosis:
            diagnosis,

        consultation_notes:
            consultationNotes.trim(),

        medicines:
            medicines,

        instructions:
            prescriptionAdvice ||
            treatmentAdvice ||
            ""

    };


    console.log(
        "Submitting prescription to pharmacy:",
        payload
    );


    /* --------------------------------------------------------
       SUBMIT BUTTON
    -------------------------------------------------------- */

    const button =
        document.querySelector(
            "#prescriptionSection button[onclick*='saveOPDPrescription']"
        );


    if (button) {

        button.disabled = true;

        button.dataset.originalText =
            button.textContent;

        button.textContent =
            "Submitting to Pharmacy...";

    }


    try {

        /* ----------------------------------------------------
           CREATE PRESCRIPTION
        ---------------------------------------------------- */

        const response =
            await fetch(
                `${API_BASE_URL}/api/prescriptions/create`,
                {

                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json",

                        "Accept":
                            "application/json"

                    },

                    body:
                        JSON.stringify(
                            payload
                        )

                }
            );


        /* ----------------------------------------------------
           READ RESPONSE
        ---------------------------------------------------- */

        const contentType =
            response.headers.get(
                "content-type"
            ) || "";


        let data;


        if (
            contentType.includes(
                "application/json"
            )
        ) {

            data =
                await response.json();

        }
        else {

            throw new Error(
                `Server returned non-JSON response (${response.status}).`
            );

        }


        /* ----------------------------------------------------
           CHECK RESPONSE
        ---------------------------------------------------- */

        if (
            !response.ok ||
            !data.success
        ) {

            throw new Error(
                data.message ||
                "Unable to submit prescription."
            );

        }


        /* ----------------------------------------------------
           SAVE FOR PRINT / LOCAL ACCESS
        ---------------------------------------------------- */

        const prescriptionRecord = {

            patient:
                patient,

            patient_id:
                patientId,

            assessment_id:
                assessmentId,

            doctor_user_id:
                doctorUserId,

            treatment_type:
                treatmentType,

            diagnosis:
                diagnosis,

            consultation_notes:
                consultationNotes,

            medicines:
                medicines,

            instructions:
                prescriptionAdvice ||
                treatmentAdvice,

            prescription_id:
                data.prescription?.id ||
                null,

            status:
                data.prescription?.status ||
                "PENDING_PHARMACY"

        };


        localStorage.setItem(
            "currentOPDPrescription",
            JSON.stringify(
                prescriptionRecord
            )
        );


        /* ----------------------------------------------------
           SUCCESS MESSAGE
        ---------------------------------------------------- */

        const message =
            document.getElementById(
                "prescriptionSaveMessage"
            );


        if (message) {

            message.textContent =
                "✓ Prescription submitted successfully to Pharmacy.";

        }


        alert(
            `Prescription submitted successfully.\n\n` +
            `Prescription No: RX-${String(
                data.prescription?.id || ""
            ).padStart(4, "0")}\n\n` +
            `Status: PENDING PHARMACY`
        );


        console.log(
            "Prescription submitted successfully:",
            data
        );


    } catch (error) {

        console.error(
            "Prescription submission error:",
            error
        );


        alert(
            error.message ||
            "Unable to submit prescription to Pharmacy."
        );


    } finally {

        if (button) {

            button.disabled = false;

            button.textContent =
                button.dataset.originalText ||
                "Submit Prescription";

        }

    }
}
/* ============================================================
   LOAD DOCTOR INFORMATION FOR PRINT
============================================================ */

function loadPrintDoctorInformation() {

    let doctor = {};

    try {

        doctor =
            JSON.parse(
                localStorage.getItem("doctor") ||
                localStorage.getItem("currentUser") ||
                localStorage.getItem("user") ||
                "{}"
            );

    } catch (error) {

        console.error(
            "Unable to read doctor information:",
            error
        );

        doctor = {};

    }


    console.log(
        "PRINT DOCTOR INFORMATION:",
        doctor
    );


    /* ========================================================
       DOCTOR NAME
    ======================================================== */

    const doctorName =
        doctor.full_name ||
        doctor.doctor_name ||
        doctor.name ||
        doctor.username ||
        document.getElementById("headerDoctorName")?.textContent ||
        "—";


    /* ========================================================
       DOCTOR ID
    ======================================================== */

    const doctorId =
        doctor.user_id ||
        doctor.doctor_id ||
        doctor.id ||
        localStorage.getItem("user_id") ||
        localStorage.getItem("userId") ||
        localStorage.getItem("doctor_id") ||
        localStorage.getItem("doctorId") ||
        "—";


    /* ========================================================
       DEPARTMENT
    ======================================================== */

    const department =
        doctor.department ||
        doctor.department_name ||
        doctor.departmentName ||
        document.getElementById("headerDoctorDepartment")?.textContent ||
        "—";


    /* ========================================================
       PRINT DOCTOR NAME
    ======================================================== */

    const printDoctorName =
        document.getElementById(
            "printDoctorName"
        );

    if (printDoctorName) {

        const cleanName =
            String(doctorName).trim();

        printDoctorName.textContent =
            cleanName === "—"
                ? "—"
                : (
                    cleanName
                        .toLowerCase()
                        .startsWith("dr.")
                        ? cleanName
                        : `Dr. ${cleanName}`
                );

    }


    /* ========================================================
       PRINT DEPARTMENT
    ======================================================== */

    const printDoctorDepartment =
        document.getElementById(
            "printDoctorDepartment"
        );

    if (printDoctorDepartment) {

        printDoctorDepartment.textContent =
            String(department).trim() || "—";

    }


    /* ========================================================
       PRINT DOCTOR ID
    ======================================================== */

    const printDoctorId =
        document.getElementById(
            "printDoctorId"
        );

    if (printDoctorId) {

        printDoctorId.textContent =
            String(doctorId).trim() || "—";

    }


    /* ========================================================
       PRINT DATE
    ======================================================== */

    const printDate =
        document.getElementById(
            "printPrescriptionDate"
        );

    if (printDate) {

        const now =
            new Date();

        const day =
            String(
                now.getDate()
            ).padStart(2, "0");

        const month =
            String(
                now.getMonth() + 1
            ).padStart(2, "0");

        const year =
            now.getFullYear();

        printDate.textContent =
            `${day}/${month}/${year}`;

    }


    console.log(
        "Print doctor information loaded:",
        {
            doctorName,
            doctorId,
            department
        }
    );
}

/* ============================================================
   PRINT OPD PRESCRIPTION
============================================================ */

function printOPDPrescription() {

    /* Load patient information */
    loadOPDPrescriptionPatient();


    /* Load doctor information */
    loadPrintDoctorInformation();


    /* Make sure prescription section is active */
    showSection("prescriptionSection");


    /* Give browser time to render before print */
    setTimeout(function () {

        window.print();

    }, 150);

}

/* ============================================================
   MEDIMATRIX IPD ADMISSION REQUEST
   DOCTOR → BILLING
============================================================ */


const IPD_WARD_RATES = {

    "GENERAL WARD": 300,

    "ICU": 500,

    "EMERGENCY": 700,

    "SEMI-PRIVATE WARD": 800,

    "PRIVATE WARD": 1200

};


/* ============================================================
   CALCULATE IPD CHARGE
============================================================ */

function calculateIPDCharge() {

    const wardElement =
        document.getElementById(
            "ipdWardType"
        );

    const daysElement =
        document.getElementById(
            "ipdExpectedDays"
        );

    const rateElement =
        document.getElementById(
            "ipdDailyRate"
        );

    const totalElement =
        document.getElementById(
            "ipdEstimatedCharge"
        );

    const messageElement =
        document.getElementById(
            "ipdCalculationMessage"
        );


    if (
        !wardElement ||
        !daysElement ||
        !rateElement ||
        !totalElement
    ) {

        return;

    }


    const ward =
        String(
            wardElement.value || ""
        )
        .trim()
        .toUpperCase();


    const days =
        Number(
            daysElement.value || 0
        );


    const rate =
        IPD_WARD_RATES[ward] || 0;


    const total =
        rate * days;


    rateElement.textContent =
        `₹${rate.toFixed(2)}`;


    totalElement.textContent =
        `₹${total.toFixed(2)}`;


    if (
        messageElement
    ) {

        if (
            ward &&
            days > 0
        ) {

            messageElement.innerHTML =
                `
                <strong>
                    ${ward}
                </strong>
                &nbsp; × &nbsp;
                <strong>
                    ${days} day${days > 1 ? "s" : ""}
                </strong>
                &nbsp; = &nbsp;
                <strong>
                    ₹${total.toFixed(2)}
                </strong>

                <br>

                <small>
                    This is the estimated ward charge.
                    Final charges may change if the actual
                    stay is longer or additional hospital
                    charges are added.
                </small>
                `;

        }
        else {

            messageElement.textContent =
                "Select ward and expected stay to calculate the estimated ward charge.";

        }

    }

}


/* ============================================================
   LOAD PATIENT INTO IPD SECTION
============================================================ */

function loadIPDPatientDetails() {

    const patient =
        window.selectedDoctorPatient || {};


    const assessment =
        window.selectedDoctorAssessment || {};


    function firstValue(
        ...values
    ) {

        for (
            const value of values
        ) {

            if (
                value !== undefined &&
                value !== null &&
                String(value).trim() !== ""
            ) {

                return value;

            }

        }

        return "—";

    }


    const patientName =
        firstValue(
            patient.patient_name,
            patient.full_name,
            patient.name,
            patient.patientName,
            patient.patient?.patient_name,
            patient.patient?.full_name,
            patient.patient?.name
        );


    const patientId =
        firstValue(
            patient.patient_id,
            patient.patientId,
            patient.patient?.patient_id,
            patient.id
        );


    const age =
        firstValue(
            patient.age,
            patient.patient_age,
            patient.patient?.age
        );


    const department =
        firstValue(
            patient.department,
            patient.department_name,
            assessment.department,
            assessment.department_name,
            patient.patient?.department,
            patient.patient?.department_name
        );


    const elements = {

        ipdPatientName:
            patientName,

        ipdPatientId:
            patientId,

        ipdPatientAge:
            age,

        ipdPatientDepartment:
            department

    };


    Object.keys(elements)
        .forEach(
            function (id) {

                const element =
                    document.getElementById(
                        id
                    );

                if (element) {

                    element.textContent =
                        elements[id];

                }

            }
        );

}


/* ============================================================
   GET DOCTOR ID
============================================================ */

function getCurrentDoctorUserId() {

    let doctor = {};

    try {

        doctor =
            JSON.parse(
                localStorage.getItem(
                    "doctor"
                ) ||
                localStorage.getItem(
                    "currentUser"
                ) ||
                localStorage.getItem(
                    "user"
                ) ||
                "{}"
            );

    }
    catch (error) {

        console.error(
            "Unable to read doctor information:",
            error
        );

    }


    return (
        doctor.user_id ||
        doctor.doctor_id ||
        doctor.id ||
        localStorage.getItem(
            "doctor_id"
        ) ||
        localStorage.getItem(
            "doctorId"
        ) ||
        ""
    );

}


/* ============================================================
   SUBMIT IPD REQUEST
============================================================ */

async function submitIPDAdmissionRequest() {

    const patient =
        window.selectedDoctorPatient || {};


    const assessmentId =
        window.selectedDoctorAssessmentId ||
        null;


    const patientPublicId =
        patient.patient_id ||
        patient.patientId ||
        patient.patient?.patient_id ||
        "";


    const wardElement =
        document.getElementById(
            "ipdWardType"
        );


    const daysElement =
        document.getElementById(
            "ipdExpectedDays"
        );


    const reasonElement =
        document.getElementById(
            "ipdAdmissionReason"
        );


    const diagnosisElement =
        document.getElementById(
            "ipdDiagnosis"
        );


    if (!patientPublicId) {

        alert(
            "Patient ID is missing."
        );

        return;

    }


    if (!assessmentId) {

        alert(
            "Assessment ID is missing."
        );

        return;

    }


    const ward =
        wardElement?.value || "";


    const expectedDays =
        Number(
            daysElement?.value || 0
        );


    const admissionReason =
        reasonElement?.value.trim() || "";


    const diagnosis =
        diagnosisElement?.value.trim() || "";


    if (!ward) {

        alert(
            "Please select the IPD ward."
        );

        return;

    }


    if (
        !expectedDays ||
        expectedDays < 1
    ) {

        alert(
            "Please select the expected length of stay."
        );

        return;

    }


    if (!admissionReason) {

        alert(
            "Please enter the clinical reason for IPD admission."
        );

        return;

    }


    const doctorUserId =
        getCurrentDoctorUserId();


    const button =
        document.querySelector(
            "#ipdSection .complete-consultation-button"
        );


    const originalText =
        button?.textContent ||
        "Send IPD Request to Billing";


    try {

        if (button) {

            button.disabled = true;

            button.textContent =
                "Sending IPD Request...";

        }


        const response =
            await fetch(
                `${API_BASE_URL}/api/ipd/request`,
                {

                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json",

                        "Accept":
                            "application/json"

                    },

                    body:
                        JSON.stringify({

                            patient_id:
                                patientPublicId,

                            assessment_id:
                                assessmentId,

                            doctor_user_id:
                                doctorUserId,

                            ward_type:
                                ward,

                            expected_days:
                                expectedDays,

                            diagnosis:
                                diagnosis,

                            admission_reason:
                                admissionReason

                        })

                }
            );


        const data =
            await response.json();


        console.log(
            "IPD request response:",
            data
        );


        if (
            !response.ok ||
            !data.success
        ) {

            throw new Error(
                data.message ||
                "Unable to send IPD request."
            );

        }


        alert(
            `IPD request sent successfully to Billing.\n\n` +
            `Ward: ${data.admission?.ward_type || ward}\n` +
            `Expected Stay: ${expectedDays} day(s)\n` +
            `Estimated Ward Charge: ₹${Number(
                data.admission?.estimated_ward_charge || 0
            ).toFixed(2)}`
        );


        console.log(
            "IPD request created:",
            data
        );


        if (
            typeof loadDoctorQueue ===
            "function"
        ) {

            await loadDoctorQueue();

        }


        if (
            typeof showSection ===
            "function"
        ) {

            showSection(
                "dashboardSection"
            );

        }


    }
    catch (error) {

        console.error(
            "IPD request error:",
            error
        );


        alert(
            error.message ||
            "Unable to send IPD request."
        );

    }
    finally {

        if (button) {

            button.disabled = false;

            button.textContent =
                originalText;

        }

    }

}


/* ============================================================
   OPEN IPD SECTION
============================================================ */

function openDoctorIPDSection() {

    showSection(
        "ipdSection"
    );


    loadIPDPatientDetails();


    calculateIPDCharge();

}


/* ============================================================
   GLOBAL FUNCTIONS
============================================================ */

window.calculateIPDCharge =
    calculateIPDCharge;


window.loadIPDPatientDetails =
    loadIPDPatientDetails;


window.submitIPDAdmissionRequest =
    submitIPDAdmissionRequest;


window.openDoctorIPDSection =
    openDoctorIPDSection;
