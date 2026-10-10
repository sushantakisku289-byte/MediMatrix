/* ============================================================
   MEDIMATRIX
   NURSE DASHBOARD
   COMPLETE JAVASCRIPT
============================================================ */


/* ============================================================
   API CONFIGURATION
============================================================ */

const API_BASE_URL = "http://127.0.0.1:5000";

const NOTIFICATIONS_URL =
    `${API_BASE_URL}/api/notifications/nurse`;

const PATIENTS_URL =
    `${API_BASE_URL}/api/patients`;

const ASSESSMENT_URL =
    `${API_BASE_URL}/api/assessment/triage`;

const PATIENT_ASSESSMENTS_URL =
    `${API_BASE_URL}/api/assessment/patient`;

const PROFILE_URL =
    `${API_BASE_URL}/api/admin/profile`;

const PROFILE_PHOTO_URL =
    `${API_BASE_URL}/api/admin/profile`;

function setValueIfExists(id, value) {
    const element = document.getElementById(id);

    if (!element) {
        return;
    }

    element.value = value ?? "";
}
/* ============================================================
   APPLICATION STATE
============================================================ */

let nurseNotifications = [];

let selectedPatient = null;

let selectedPatientAssessments = [];

let selectedMedicalReport = null;

let currentAssessmentId = null;


/* ============================================================
   DOM READY
============================================================ */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        loadNurseProfile();

        loadNotifications();

        loadDashboard();

        setupAssessmentForm();

        toggleReportUpload();

        setInterval(
            loadNotifications,
            15000
        );

    }
);


async function loadNurseProfile() {

    const nurseName =
        localStorage.getItem("full_name") ||
        localStorage.getItem("user_name") ||
        localStorage.getItem("username") ||
        "Nurse";

    setElementText(
        "welcomeNurseName",
        nurseName
    );

    setElementText(
        "sidebarNurseName",
        nurseName
    );

    setElementText(
        "profileFullName",
        nurseName
    );

    updateSidebarAvatar(nurseName);

    // Load complete nurse profile from backend
    await loadNurseProfileFromBackend();

}

async function loadNurseProfileFromBackend() {

    try {

        const nurseId =
            localStorage.getItem("user_id") ||
            localStorage.getItem("userId") ||
            localStorage.getItem("nurse_id") ||
            "";

        if (!nurseId) {
            console.warn("Nurse ID not found.");
            loadStoredProfileFields();
            return;
        }

        const response = await fetch(
            `${PROFILE_URL}/${encodeURIComponent(nurseId)}`
        );

        const data = await response.json();

        console.log(
            "Nurse profile API response:",
            data
        );

        if (!response.ok || !data.success) {

            console.warn(
                "Unable to load nurse profile from backend."
            );

            loadStoredProfileFields();
            return;
        }

        const profile =
            data.user ||
            data.nurse ||
            data.data ||
            {};

        // ----------------------------------------------------
        // DEPARTMENT ID → DEPARTMENT NAME
        // ----------------------------------------------------

        const departmentMap = {

            1: "General Medicine",
            2: "Cardiology",
            3: "Ophthalmology",
            4: "ENT",
            5: "Orthopedics",
            6: "Dermatology",
            7: "Neurology",
            8: "Pediatrics",
            9: "Gynecology",
            10: "General Surgery",
            11: "Pulmonology",
            12: "Emergency"

        };

        const departmentId =
            profile.department_id;

        const departmentName =
            profile.department_name ||
            profile.department ||
            departmentMap[departmentId] ||
            "Department Not Assigned";

        // ----------------------------------------------------
        // SAVE CORRECT PROFILE DATA
        // ----------------------------------------------------

        if (profile.full_name) {

            localStorage.setItem(
                "full_name",
                profile.full_name
            );

        }

        if (profile.phone !== undefined) {

            localStorage.setItem(
                "phone",
                profile.phone || ""
            );

        }

        if (profile.email !== undefined) {

            localStorage.setItem(
                "email",
                profile.email || ""
            );

        }

        if (profile.department_id !== undefined) {

            localStorage.setItem(
                "department_id",
                String(profile.department_id)
            );

        }

        localStorage.setItem(
            "department",
            departmentName
        );

        localStorage.setItem(
            "department_name",
            departmentName
        );

        // ----------------------------------------------------
        // UPDATE PROFILE PAGE
        // ----------------------------------------------------

        setValueIfExists(
            "nurseId",
            profile.user_id || nurseId
        );

        setValueIfExists(
            "nurseRole",
            profile.role || "NURSE"
        );

        setValueIfExists(
            "nurseDepartment",
            departmentName
        );

        setValueIfExists(
            "nurseUsername",
            profile.username || ""
        );

        setValueIfExists(
            "nurseEmail",
            profile.email || ""
        );

        setValueIfExists(
            "nurseMobile",
            profile.phone || ""
        );

        setValueIfExists(
            "nurseAddress",
            profile.address || ""
        );

        // ----------------------------------------------------
        // UPDATE SIDEBAR
        // ----------------------------------------------------

        setElementText(
            "sidebarNurseDepartment",
            departmentName
        );

        console.log(
            "Nurse department loaded:",
            departmentName,
            "(ID:",
            departmentId,
            ")"
        );

    } catch (error) {

        console.error(
            "Nurse profile loading error:",
            error
        );

        loadStoredProfileFields();

    }

}


/* ============================================================
   LOAD STORED PROFILE DATA
============================================================ */

function loadStoredProfileFields() {

    const userId =
        localStorage.getItem("user_id") ||
        localStorage.getItem("userId") ||
        localStorage.getItem("nurse_id") ||
        "";

    const username =
        localStorage.getItem("username") ||
        localStorage.getItem("user_name") ||
        "";

    const role =
        localStorage.getItem("role") ||
        "NURSE";

    const department =
        localStorage.getItem("department") ||
        localStorage.getItem("department_name") ||
        "Nursing Department";

    const phone =
        localStorage.getItem("phone") ||
        "";

    const email =
        localStorage.getItem("email") ||
        "";

    const address =
        localStorage.getItem("address") ||
        "";

    setElementValue(
        "profileNurseId",
        userId
    );

    setElementValue(
        "profileUsername",
        username
    );

    setElementValue(
        "profileRole",
        role
    );

    setElementValue(
        "profileDepartment",
        department
    );

    setElementValue(
        "profilePhone",
        phone
    );

    setElementValue(
        "profileEmail",
        email
    );

    setElementValue(
        "profileAddress",
        address
    );

}


/* ============================================================
   SIDEBAR AVATAR
============================================================ */

function updateSidebarAvatar(name) {

    const avatar =
        String(name || "N")
            .trim()
            .charAt(0)
            .toUpperCase() || "N";

    const element =
        document.getElementById(
            "sidebarAvatar"
        );

    if (element) {

        element.textContent =
            avatar;

    }

}


/* ============================================================
   SECTION NAVIGATION
============================================================ */

function showSection(
    sectionId,
    clickedButton = null
) {

    const sections =
        document.querySelectorAll(
            ".content-section"
        );

    sections.forEach(
        function (section) {

            section.classList.remove(
                "active-section"
            );

        }
    );


    const selectedSection =
        document.getElementById(
            sectionId
        );

    if (selectedSection) {

        selectedSection.classList.add(
            "active-section"
        );

    }


    const buttons =
        document.querySelectorAll(
            ".nav-item"
        );

    buttons.forEach(
        function (button) {

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
                `.nav-item[onclick*="${sectionId}"]`
            );

        if (matchingButton) {

            matchingButton.classList.add(
                "active"
            );

        }

    }


    updatePageTitle(
        sectionId
    );

}


/* ============================================================
   PAGE TITLE
============================================================ */

function updatePageTitle(
    sectionId
) {

    const title =
        document.getElementById(
            "pageTitle"
        );

    if (!title) {
        return;
    }

    const titles = {

        dashboardSection:
            "Nurse Dashboard",

        notificationsSection:
            "Patient Notifications",

        patientSection:
            "Patient Assessment",

        profileSection:
            "Nurse Profile"

    };

    title.textContent =
        titles[sectionId] ||
        "Nurse Dashboard";

}


/* ============================================================
   LOAD DASHBOARD
============================================================ */

async function loadDashboard() {

    try {

        await loadNotifications();

        await loadAssessmentStatistics();

        setBackendStatus(true);

    }
    catch (error) {

        console.error(
            "Dashboard loading error:",
            error
        );

        setBackendStatus(false);

    }

}


/* ============================================================
   LOAD NURSE NOTIFICATIONS
============================================================ */

async function loadNotifications() {

    try {

        // ====================================================
        // GET LOGGED-IN NURSE ID
        // ====================================================

        const nurseId =
            localStorage.getItem("user_id") ||
            localStorage.getItem("userId") ||
            localStorage.getItem("nurse_id") ||
            localStorage.getItem("nurseId") ||
            "";

        console.log(
            "Loading nurse notifications for:",
            nurseId
        );

        // ====================================================
        // VALIDATE NURSE ID
        // ====================================================

        if (!nurseId) {

            throw new Error(
                "Nurse ID not found. Please login again."
            );

        }

        // ====================================================
        // REQUEST NOTIFICATIONS
        // ====================================================

        const response = await fetch(
            `${NOTIFICATIONS_URL}?user_id=${encodeURIComponent(nurseId)}`,
            {
                method: "GET",

                headers: {
                    "Accept": "application/json"
                }
            }
        );

        const result = await response.json();

        console.log(
            "Nurse notifications response:",
            result
        );

        // ====================================================
        // CHECK RESPONSE
        // ====================================================

        if (!response.ok) {

            throw new Error(
                result.message ||
                `Notification request failed: HTTP ${response.status}`
            );

        }

        // ====================================================
        // STORE NOTIFICATIONS
        // ====================================================

        nurseNotifications =
            Array.isArray(result.notifications)
                ? result.notifications
                : [];

        console.log(
            "Nurse notifications loaded:",
            nurseNotifications
        );

        console.log(
            "Unread notifications:",
            result.unread_count
        );

        // ====================================================
        // RENDER
        // ====================================================

        renderDashboardNotifications();

        renderFullNotifications();

        updateNotificationStatistics();

        setBackendStatus(true);

    }

    catch (error) {

        console.error(
            "Notification error:",
            error
        );

        nurseNotifications = [];

        renderNotificationError();

        setBackendStatus(false);

    }

}


/* ============================================================
   DASHBOARD NOTIFICATIONS
============================================================ */

function renderDashboardNotifications() {

    const container =
        document.getElementById(
            "dashboardNotifications"
        );

    if (!container) {
        return;
    }


    if (!nurseNotifications.length) {

        container.innerHTML = `
            <div class="empty-state">

                <div class="empty-icon">
                    🔔
                </div>

                <h3>
                    No New Patients
                </h3>

                <p>
                    New patient registrations will
                    appear here automatically.
                </p>

            </div>
        `;

        return;

    }


    const latest =
        nurseNotifications.slice(
            0,
            5
        );


    container.innerHTML =
        latest
            .map(
                createNotificationCard
            )
            .join("");

}


/* ============================================================
   FULL NOTIFICATIONS
============================================================ */

function renderFullNotifications() {

    const container =
        document.getElementById(
            "fullNotifications"
        );

    if (!container) {
        return;
    }


    if (!nurseNotifications.length) {

        container.innerHTML = `
            <div class="empty-state">

                <div class="empty-icon">
                    🏥
                </div>

                <h3>
                    No Patient Notifications
                </h3>

                <p>
                    When a hospital employee registers
                    a patient, the patient will appear here.
                </p>

            </div>
        `;

        return;

    }


    container.innerHTML =
        nurseNotifications
            .map(
                createNotificationCard
            )
            .join("");

}


/* ============================================================
   CREATE NOTIFICATION CARD
============================================================ */

function createNotificationCard(
    notification
) {

    const patientId =
        notification.patient_id ||
        "—";


    const patientName =
        notification.patient_name ||
        extractPatientName(
            notification.message
        ) ||
        "Patient";


    const department =
        extractDepartment(
            notification.message
        );


    const symptoms =
        extractSymptoms(
            notification.message
        );


    const createdAt =
        formatDateTime(
            notification.created_at
        );


    const unread =
        !notification.is_read;


    return `
        <div class="notification-card">

            <div class="notification-icon">
                🩺
            </div>


            <div class="notification-main">

                <h4>

                    ${
                        unread
                            ? `<span class="unread-indicator"></span>`
                            : ""
                    }

                    New Patient Registered

                </h4>


                <p>
                    ${escapeHtml(
                        notification.message ||
                        `New patient ${patientName} registered.`
                    )}
                </p>


                <div class="notification-meta">

                    <span class="meta-tag">
                        🆔
                        ${escapeHtml(patientId)}
                    </span>

                    <span class="meta-tag">
                        👤
                        ${escapeHtml(patientName)}
                    </span>

                    <span class="meta-tag">
                        🏥
                        ${escapeHtml(department)}
                    </span>

                    <span class="meta-tag">
                        🔍
                        ${escapeHtml(symptoms)}
                    </span>

                </div>

            </div>


            <div class="notification-actions">

                <span class="notification-time">
                    ${escapeHtml(createdAt)}
                </span>


                <button
                    type="button"
                    class="view-button"
                    onclick="openPatientFromNotification('${escapeJs(patientId)}')"
                >
                    Open Patient →
                </button>

            </div>

        </div>
    `;

}


/* ============================================================
   OPEN PATIENT
============================================================ */

async function openPatientFromNotification(
    patientId
) {

    if (!patientId) {

        showToast(
            "Patient ID is missing.",
            "error"
        );

        return;

    }


    showSection(
        "patientSection"
    );


    const noPatientState =
        document.getElementById(
            "noPatientState"
        );

    const workspace =
        document.getElementById(
            "assessmentWorkspace"
        );


    if (noPatientState) {

        noPatientState.classList.add(
            "hidden"
        );

    }


    if (workspace) {

        workspace.classList.remove(
            "hidden"
        );

    }


    if (workspace) {

        workspace.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

    }


    try {

        showToast(
            "Loading patient information...",
            "info"
        );


        const response =
            await fetch(
                `${PATIENTS_URL}/${encodeURIComponent(patientId)}`,
                {
                    method: "GET",
                    headers: {
                        "Accept":
                            "application/json"
                    }
                }
            );


        const result =
            await response.json();


        if (!response.ok) {

            throw new Error(
                result.message ||
                "Unable to load patient."
            );

        }


        selectedPatient =
            result.patient ||
            result.data ||
            result;


        renderSelectedPatient();


        await loadPatientAssessments(
            patientId
        );


        resetAssessmentInputs();

        showToast(
            "Patient loaded successfully.",
            "success"
        );

    }
    catch (error) {

        console.error(
            "Patient loading error:",
            error
        );


        if (workspace) {

            workspace.classList.add(
                "hidden"
            );

        }


        if (noPatientState) {

            noPatientState.classList.remove(
                "hidden"
            );

        }


        showToast(
            error.message ||
            "Unable to load patient.",
            "error"
        );

    }

}


/* ============================================================
   RENDER SELECTED PATIENT
============================================================ */

function renderSelectedPatient() {

    if (!selectedPatient) {
        return;
    }


    const patientName =
        selectedPatient.full_name ||
        selectedPatient.name ||
        "Patient";


    const patientId =
        selectedPatient.patient_id ||
        selectedPatient.id ||
        "—";


    const department =
        selectedPatient.department ||
        "General Medicine";


    const symptoms =
        selectedPatient.symptoms ||
        "No symptoms recorded";


    setElementText(
        "patientName",
        patientName
    );

    setElementText(
        "patientId",
        patientId
    );

    setElementText(
        "patientDepartment",
        department
    );


    setElementText(
        "patientInitial",
        patientName
            .trim()
            .charAt(0)
            .toUpperCase() || "P"
    );


    setElementText(
        "detailName",
        patientName
    );

    setElementText(
        "detailAge",
        selectedPatient.age ?? "—"
    );

    setElementText(
        "detailGender",
        selectedPatient.gender || "—"
    );

    setElementText(
        "detailPhone",
        selectedPatient.phone || "—"
    );

    setElementText(
        "detailAddress",
        selectedPatient.address || "—"
    );


    const emergencyName =
        selectedPatient.emergency_contact_name ||
        "";

    const emergencyPhone =
        selectedPatient.emergency_contact_phone ||
        "";


    let emergencyText = "—";


    if (
        emergencyName &&
        emergencyPhone
    ) {

        emergencyText =
            `${emergencyName} — ${emergencyPhone}`;

    }
    else if (emergencyPhone) {

        emergencyText =
            emergencyPhone;

    }
    else if (emergencyName) {

        emergencyText =
            emergencyName;

    }


    setElementText(
        "detailEmergency",
        emergencyText
    );


    setElementText(
        "registeredSymptoms",
        symptoms
    );

    setElementText(
        "symptomDepartment",
        department
    );

}


/* ============================================================
   LOAD PATIENT ASSESSMENTS
============================================================ */

async function loadPatientAssessments(
    patientId
) {

    const container =
        document.getElementById(
            "assessmentHistory"
        );

    if (!container) {
        return;
    }


    container.innerHTML = `
        <div class="loading-state">
            Loading assessment history...
        </div>
    `;


    try {

        const response =
            await fetch(
                `${PATIENT_ASSESSMENTS_URL}/${encodeURIComponent(patientId)}`,
                {
                    method: "GET",
                    headers: {
                        "Accept":
                            "application/json"
                    }
                }
            );


        const result =
            await response.json();


        if (!response.ok) {

            throw new Error(
                result.message ||
                "Unable to load assessments."
            );

        }


        selectedPatientAssessments =
            Array.isArray(
                result.assessments
            )
                ? result.assessments
                : [];


        renderAssessmentHistory();

        updatePatientAssessmentStatus();

    }
    catch (error) {

        console.error(
            "Assessment history error:",
            error
        );

        selectedPatientAssessments = [];


        container.innerHTML = `
            <div class="empty-small">
                Unable to load previous assessments.
            </div>
        `;

    }

}


/* ============================================================
   ASSESSMENT HISTORY
============================================================ */

function renderAssessmentHistory() {

    const container =
        document.getElementById(
            "assessmentHistory"
        );

    if (!container) {
        return;
    }


    if (!selectedPatientAssessments.length) {

        container.innerHTML = `
            <div class="empty-small">
                No previous assessments found.
            </div>
        `;

        return;

    }


    container.innerHTML =
        selectedPatientAssessments
            .map(
                function (assessment) {

                    const priority =
                        normalizePriority(
                            assessment.priority
                        );


                    const report =
                        assessment.previous_report_filename ||
                        assessment.previous_report_original_name;


                    return `
                        <div class="history-item">

                            <div class="history-date">
                                ${escapeHtml(
                                    formatDateTime(
                                        assessment.created_at
                                    )
                                )}
                            </div>


                            <div class="history-symptoms">

                                ${escapeHtml(
                                    assessment.symptoms ||
                                    "Assessment"
                                )}

                                ${
                                    report
                                        ? `
                                            <div class="history-report">
                                                📄 Previous report attached
                                            </div>
                                          `
                                        : ""
                                }

                            </div>


                            <div class="history-priority">

                                ${getPriorityIcon(priority)}

                                ${escapeHtml(priority)}

                            </div>

                        </div>
                    `;

                }
            )
            .join("");

}


/* ============================================================
   ASSESSMENT FORM
============================================================ */

function setupAssessmentForm() {

    const form =
        document.getElementById(
            "assessmentForm"
        );

    if (!form) {
        return;
    }


    form.addEventListener(
        "submit",
        submitAssessment
    );

}

/* ============================================================
   MARK NURSE NOTIFICATION AS READ
============================================================ */

async function markNurseNotificationAsRead(patientId) {

    if (!patientId) {
        return;
    }

    const notification = nurseNotifications.find(
        function (item) {
            return String(item.patient_id) === String(patientId);
        }
    );

    if (!notification || notification.is_read) {
        return;
    }

    try {

        const response = await fetch(
            `${API_BASE_URL}/api/notifications/nurse/${notification.id}/read`,
            {
                method: "PUT",
                headers: {
                    "Accept": "application/json"
                }
            }
        );

        const result = await response.json();

        if (!response.ok) {
            throw new Error(
                result.message ||
                "Unable to mark notification as read."
            );
        }

        notification.is_read = true;

        renderDashboardNotifications();
        renderFullNotifications();
        updateNotificationStatistics();

    }
    catch (error) {

        console.error(
            "Mark nurse notification read error:",
            error
        );

        /*
         * Do not stop the assessment workflow if
         * notification update fails.
         */
    }
}

/* ============================================================
   SUBMIT NURSE ASSESSMENT  
============================================================ */

async function submitAssessment(
    event
) {

    event.preventDefault();


    if (!selectedPatient) {

        showToast(
            "Please select a patient first.",
            "error"
        );

        return;

    }


    const patientId =
        selectedPatient.patient_id ||
        selectedPatient.id;


    const symptoms =
        selectedPatient.symptoms ||
        "";


    const department =
        selectedPatient.department ||
        "";


    if (!patientId) {

        showToast(
            "Patient ID is missing.",
            "error"
        );

        return;

    }


    if (!symptoms) {

        showToast(
            "Patient symptoms are missing.",
            "error"
        );

        return;

    }


    const temperature =
        getNumberOrNull(
            getElementValue(
                "temperature"
            )
        );


    const heartRate =
        getNumberOrNull(
            getElementValue(
                "heartRate"
            )
        );


    const systolicBP =
        getNumberOrNull(
            getElementValue(
                "systolicBP"
            )
        );


    const diastolicBP =
        getNumberOrNull(
            getElementValue(
                "diastolicBP"
            )
        );


    const oxygenSaturation =
        getNumberOrNull(
            getElementValue(
                "oxygenSaturation"
            )
        );


    const nurseObservation =
        getElementValue(
            "nurseObservation"
        ).trim();


    const payload = {

        patient_id:
            String(patientId),

        symptoms:
            symptoms,

        temperature:
            temperature,

        heart_rate:
            heartRate,

        systolic_bp:
            systolicBP,

        diastolic_bp:
            diastolicBP,

        oxygen_saturation:
            oxygenSaturation,

        department:
            department,

        nurse_observation:
            nurseObservation

    };


    const button =
        document.getElementById(
            "submitAssessmentButton"
        );


    const originalText =
        button
            ? button.textContent
            : "Complete Assessment";


    if (button) {

        button.disabled = true;

        button.textContent =
            "Saving Assessment...";

    }


    try {

        /*
         * STEP 1
         * Save the nursing assessment.
         */

        const response =
            await fetch(
                ASSESSMENT_URL,
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


        const result =
            await response.json();


        if (!response.ok) {

            throw new Error(
                result.message ||
                "Unable to save assessment."
            );

        }


        const assessment =
            result.assessment ||
            {};


        currentAssessmentId =
            assessment.id ||
            result.assessment_id ||
            null;


        /*
         * STEP 2
         * If the nurse selected a medical report,
         * upload it against the newly-created assessment.
         */

        if (
            selectedMedicalReport &&
            currentAssessmentId
        ) {

            if (button) {

                button.textContent =
                    "Uploading Medical Report...";

            }


            await uploadMedicalReport(
                currentAssessmentId,
                true
            );

        }


        /*
         * STEP 3
         * Show final result.
         */

        showAssessmentResult(
            assessment
        );


        await loadPatientAssessments(
            patientId
        );

        await markNurseNotificationAsRead(
    patientId
);

await loadNotifications();

await loadAssessmentStatistics();


        await loadAssessmentStatistics();


        showToast(
            selectedMedicalReport
                ? "Assessment and medical report saved successfully."
                : "Nurse assessment saved successfully.",
            "success"
        );


        resetAssessmentInputs();


    }
    catch (error) {

        console.error(
            "Assessment submission error:",
            error
        );


        showToast(
            error.message ||
            "Unable to save assessment.",
            "error"
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
   PREVIOUS MEDICAL REPORT
============================================================ */

function toggleReportUpload() {

    const yesRadio =
        document.querySelector(
            'input[name="previousReport"][value="yes"]'
        );

    const uploadArea =
        document.getElementById(
            "reportUploadArea"
        );


    if (!yesRadio || !uploadArea) {
        return;
    }


    if (yesRadio.checked) {

        uploadArea.classList.remove(
            "hidden"
        );

    }
    else {

        uploadArea.classList.add(
            "hidden"
        );

        removeSelectedReport();

    }

}


/* ============================================================
   SELECT MEDICAL REPORT
============================================================ */

function handleReportSelection(
    event
) {

    const input =
        event.target;

    if (
        !input ||
        !input.files ||
        !input.files.length
    ) {

        selectedMedicalReport = null;

        return;

    }


    const file =
        input.files[0];


    const allowedTypes = [
        "application/pdf",
        "image/jpeg",
        "image/png"
    ];


    const allowedExtensions = [
        ".pdf",
        ".jpg",
        ".jpeg",
        ".png"
    ];


    const fileName =
        file.name.toLowerCase();


    const extensionAllowed =
        allowedExtensions.some(
            function (extension) {
                return fileName.endsWith(
                    extension
                );
            }
        );


    const typeAllowed =
        allowedTypes.includes(
            file.type
        );


    if (
        !extensionAllowed &&
        !typeAllowed
    ) {

        showToast(
            "Only PDF, JPG, JPEG and PNG files are allowed.",
            "error"
        );

        input.value = "";

        selectedMedicalReport = null;

        return;

    }


    const maxSize =
        10 * 1024 * 1024;


    if (file.size > maxSize) {

        showToast(
            "Medical report must be smaller than 10 MB.",
            "error"
        );

        input.value = "";

        selectedMedicalReport = null;

        return;

    }


    selectedMedicalReport =
        file;


    const info =
        document.getElementById(
            "selectedReportInfo"
        );

    const name =
        document.getElementById(
            "selectedReportName"
        );


    if (info) {

        info.classList.remove(
            "hidden"
        );

    }


    if (name) {

        name.textContent =
            `${file.name} (${formatFileSize(file.size)})`;

    }


    showToast(
        "Medical report selected.",
        "success"
    );

}


/* ============================================================
   REMOVE MEDICAL REPORT
============================================================ */

function removeSelectedReport() {

    selectedMedicalReport = null;


    const input =
        document.getElementById(
            "medicalReportFile"
        );

    if (input) {

        input.value = "";

    }


    const info =
        document.getElementById(
            "selectedReportInfo"
        );

    if (info) {

        info.classList.add(
            "hidden"
        );

    }


    const name =
        document.getElementById(
            "selectedReportName"
        );

    if (name) {

        name.textContent =
            "No file selected";

    }

}


/* ============================================================
   UPLOAD MEDICAL REPORT
============================================================ */

async function uploadMedicalReport(
    assessmentId,
    silent = false
) {

    if (!selectedMedicalReport) {

        if (!silent) {

            showToast(
                "Please select a medical report first.",
                "error"
            );

        }

        return null;

    }


    if (!assessmentId) {

        throw new Error(
            "Assessment ID is missing. Report cannot be attached."
        );

    }


    const formData =
        new FormData();


    formData.append(
        "previous_report",
        selectedMedicalReport
    );


    const response =
        await fetch(
            `${API_BASE_URL}/api/assessment/${encodeURIComponent(assessmentId)}/report`,
            {
                method: "POST",
                body: formData
            }
        );


    const result =
        await response.json();


    if (!response.ok) {

        throw new Error(
            result.message ||
            "Medical report upload failed."
        );

    }


    if (!silent) {

        showToast(
            "Medical report uploaded successfully.",
            "success"
        );

    }


    return result;

}


/* ============================================================
   ASSESSMENT RESULT
============================================================ */

function showAssessmentResult(
    assessment
) {

    const resultBox =
        document.getElementById(
            "assessmentResult"
        );

    if (!resultBox) {
        return;
    }


    const priority =
        normalizePriority(
            assessment.priority
        );


    const reasons =
        assessment.priority_reasons ||
        "Priority calculated from the submitted symptoms and vital signs.";


    resultBox.className =
        "assessment-result success";


    resultBox.innerHTML = `

        <div class="result-title">
            ✅ Assessment Completed
        </div>

        <div>
            Patient assessment has been
            successfully sent to the doctor queue.
        </div>

        <div
            class="result-priority ${getPriorityClass(priority)}"
        >

            ${getPriorityIcon(priority)}

            ${escapeHtml(priority)}

        </div>


        <div class="result-reasons">

            <strong>
                Priority analysis:
            </strong>

            ${escapeHtml(reasons)}

            <br><br>

            <strong>
                Status:
            </strong>

            ${escapeHtml(
                assessment.status ||
                "WAITING_DOCTOR"
            )}

            ${
                selectedMedicalReport
                    ? `
                        <br><br>
                        <strong>
                            Previous Medical Report:
                        </strong>
                        📄 Attached
                      `
                    : ""
            }

        </div>
    `;


    resultBox.classList.remove(
        "hidden"
    );


    resultBox.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });

}


/* ============================================================
   CLEAR VITALS / ASSESSMENT
============================================================ */

function clearVitals() {

    resetAssessmentInputs();

}


function resetAssessmentInputs() {

    const ids = [

        "temperature",
        "heartRate",
        "systolicBP",
        "diastolicBP",
        "oxygenSaturation",
        "nurseObservation"

    ];


    ids.forEach(
        function (id) {

            const element =
                document.getElementById(
                    id
                );

            if (element) {

                element.value = "";

            }

        }
    );


    const noReport =
        document.querySelector(
            'input[name="previousReport"][value="no"]'
        );


    if (noReport) {

        noReport.checked = true;

    }


    removeSelectedReport();

    toggleReportUpload();

}

/* ============================================================
   LOAD NURSE DASHBOARD STATISTICS
============================================================ */

async function loadAssessmentStatistics() {

    try {

        /*
         * ----------------------------------------------------
         * WAITING PATIENTS
         * ----------------------------------------------------
         */

        const waitingPatients =
            nurseNotifications.filter(
                function (notification) {

                    return !notification.is_read;

                }
            );

        const waitingCount =
            waitingPatients.length;


        /*
         * ----------------------------------------------------
         * ASSESSED TODAY
         * ----------------------------------------------------
         */

        let assessedToday = 0;

        try {

            const response =
                await fetch(
                    `${API_BASE_URL}/api/assessment/stats/today`,
                    {
                        method: "GET",
                        headers: {
                            "Accept":
                                "application/json"
                        }
                    }
                );

            const result =
                await response.json();

            if (
                response.ok &&
                result.success
            ) {

                assessedToday =
                    Number(
                        result.assessed_today || 0
                    );

            }

        }
        catch (statsError) {

            console.error(
                "Unable to load assessment statistics:",
                statsError
            );

        }


        /*
         * ----------------------------------------------------
         * DASHBOARD ELEMENTS
         * ----------------------------------------------------
         */

        const newPatientsElement =
            document.getElementById(
                "newPatientsCount"
            );

        const unreadElement =
            document.getElementById(
                "unreadCount"
            );

        const assessedElement =
            document.getElementById(
                "assessedTodayCount"
            );

        const awaitingElement =
            document.getElementById(
                "awaitingCount"
            );

        const notificationBadge =
            document.getElementById(
                "notificationBadge"
            );


        /*
         * ----------------------------------------------------
         * NEW PATIENTS
         * ----------------------------------------------------
         */

        if (newPatientsElement) {

            newPatientsElement.textContent =
                waitingCount;

        }


        /*
         * ----------------------------------------------------
         * UNREAD NOTIFICATIONS
         * ----------------------------------------------------
         */

        if (unreadElement) {

            unreadElement.textContent =
                waitingCount;

        }


        /*
         * ----------------------------------------------------
         * ASSESSED TODAY
         * ----------------------------------------------------
         */

        if (assessedElement) {

            assessedElement.textContent =
                assessedToday;

        }


        /*
         * ----------------------------------------------------
         * AWAITING ASSESSMENT
         * ----------------------------------------------------
         */

        if (awaitingElement) {

            awaitingElement.textContent =
                waitingCount;

        }


        /*
         * ----------------------------------------------------
         * NOTIFICATION BADGE
         * ----------------------------------------------------
         */

        if (notificationBadge) {

            notificationBadge.textContent =
                waitingCount;

        }

    }
    catch (error) {

        console.error(
            "Dashboard statistics error:",
            error
        );

    }

}


/* ============================================================
   ASSESSED TODAY
============================================================ */

function calculateAssessedToday() {

    const today =
        new Date();


    const year =
        today.getFullYear();

    const month =
        today.getMonth();

    const date =
        today.getDate();


    return selectedPatientAssessments.filter(
        function (assessment) {

            if (!assessment.created_at) {
                return false;
            }


            const created =
                new Date(
                    assessment.created_at
                );


            return (
                created.getFullYear() === year &&
                created.getMonth() === month &&
                created.getDate() === date
            );

        }
    ).length;

}


/* ============================================================
   PATIENT ASSESSMENT STATUS
============================================================ */

function updatePatientAssessmentStatus() {

    const status =
        document.getElementById(
            "patientStatus"
        );

    if (!status) {
        return;
    }


    if (selectedPatientAssessments.length) {

        status.textContent =
            "Assessment Available";

    }
    else {

        status.textContent =
            "Registered";

    }

}


/* ============================================================
   NOTIFICATION STATISTICS
============================================================ */

function updateNotificationStatistics() {

    const unread =
        nurseNotifications.filter(
            function (notification) {

                return !notification.is_read;

            }
        ).length;


    setElementText(
        "notificationBadge",
        unread
    );

    setElementText(
        "unreadCount",
        unread
    );

    setElementText(
        "newPatientsCount",
        nurseNotifications.length
    );

    setElementText(
        "awaitingCount",
        nurseNotifications.length
    );

}


/* ============================================================
   REFRESH DASHBOARD
============================================================ */

async function refreshDashboard() {

    showToast(
        "Refreshing dashboard...",
        "info"
    );


    await loadDashboard();


    if (selectedPatient) {

        const patientId =
            selectedPatient.patient_id ||
            selectedPatient.id;

        if (patientId) {

            await loadPatientAssessments(
                patientId
            );

        }

    }


    showToast(
        "Dashboard refreshed.",
        "success"
    );

}


/* ============================================================
   BACKEND STATUS
============================================================ */

function setBackendStatus(
    connected
) {

    const status =
        document.getElementById(
            "connectionStatus"
        );

    if (!status) {
        return;
    }


    if (connected) {

        status.innerHTML =
            `
                <span class="status-dot"></span>
                Backend Connected
            `;

        status.classList.remove(
            "offline"
        );

    }
    else {

        status.innerHTML =
            `
                <span class="status-dot"></span>
                Backend Offline
            `;

        status.classList.add(
            "offline"
        );

    }

}


/* ============================================================
   PROFILE SAVE
============================================================ */

async function saveNurseProfile() {

    const fullName =
        getElementValue(
            "profileFullName"
        ).trim();


    const address =
        getElementValue(
            "profileAddress"
        ).trim();


    if (!fullName) {

        showToast(
            "Full name is required.",
            "error"
        );

        return;

    }


    const userId =
        localStorage.getItem("user_id") ||
        localStorage.getItem("userId") ||
        localStorage.getItem("nurse_id");


    /*
     * Always keep the local profile immediately updated.
     * The API update is attempted when a user ID exists.
     */

    localStorage.setItem(
        "full_name",
        fullName
    );

    localStorage.setItem(
        "address",
        address
    );


    setElementText(
        "welcomeNurseName",
        fullName
    );

    setElementText(
        "sidebarNurseName",
        fullName
    );

    updateSidebarAvatar(
        fullName
    );


    if (!userId) {

        showToast(
            "Profile updated locally. User ID is not available for server synchronization.",
            "info"
        );

        return;

    }


    try {

        const response =
            await fetch(
                `${PROFILE_URL}/${encodeURIComponent(userId)}`,
                {
                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json",

                        "Accept":
                            "application/json"
                    },

                    body:
                        JSON.stringify({

                            full_name:
                                fullName,

                            address:
                                address

                        })
                }
            );


        const result =
            await response.json();


        if (!response.ok) {

            throw new Error(
                result.message ||
                "Unable to update profile."
            );

        }


        const user =
            result.user ||
            result.profile ||
            {};


        if (user.full_name) {

            localStorage.setItem(
                "full_name",
                user.full_name
            );

        }


        if (
            user.address !== undefined &&
            user.address !== null
        ) {

            localStorage.setItem(
                "address",
                user.address
            );

        }


        showToast(
            "Nurse profile updated successfully.",
            "success"
        );

    }
    catch (error) {

        console.error(
            "Profile update error:",
            error
        );


        /*
         * The local profile has already been updated.
         * We clearly tell the nurse that server sync failed.
         */

        showToast(
            error.message ||
            "Profile saved locally, but server update failed.",
            "error"
        );

    }

}


/* ============================================================
   PROFILE PHOTO UPLOAD
============================================================ */

async function uploadNurseProfilePhoto(
    event
) {

    const input =
        event.target;


    if (
        !input ||
        !input.files ||
        !input.files.length
    ) {

        return;

    }


    const file =
        input.files[0];


    const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp"
    ];


    if (
        !allowedTypes.includes(
            file.type
        )
    ) {

        showToast(
            "Only JPG, PNG and WEBP profile photos are allowed.",
            "error"
        );

        input.value = "";

        return;

    }


    const maxSize =
        5 * 1024 * 1024;


    if (file.size > maxSize) {

        showToast(
            "Profile photo must be smaller than 5 MB.",
            "error"
        );

        input.value = "";

        return;

    }


    const userId =
        localStorage.getItem("user_id") ||
        localStorage.getItem("userId") ||
        localStorage.getItem("nurse_id");


    if (!userId) {

        showToast(
            "Nurse user ID is missing.",
            "error"
        );

        input.value = "";

        return;

    }


    const formData =
        new FormData();


    formData.append(
        "profile_photo",
        file
    );


    try {

        showToast(
            "Uploading profile photo...",
            "info"
        );


        const response =
            await fetch(
                `${PROFILE_URL}/${encodeURIComponent(userId)}/photo`,
                {
                    method: "POST",
                    body: formData
                }
            );


        const result =
            await response.json();


        if (!response.ok) {

            throw new Error(
                result.message ||
                "Unable to upload profile photo."
            );

        }


        let photoUrl =
            result.photo_url ||
            result.url ||
            "";


        if (
            photoUrl &&
            !photoUrl.startsWith("http")
        ) {

            photoUrl =
                `${API_BASE_URL}${photoUrl}`;

        }


        if (photoUrl) {

            displayNurseProfilePhoto(
                photoUrl
            );

        }
        else {

            displayLocalProfilePhoto(
                file
            );

        }


        showToast(
            "Profile photo updated successfully.",
            "success"
        );

    }
    catch (error) {

        console.error(
            "Profile photo error:",
            error
        );


        /*
         * Show the selected image locally even if
         * the server endpoint is unavailable.
         */

        displayLocalProfilePhoto(
            file
        );


        showToast(
            error.message ||
            "Profile photo could not be synchronized with the server.",
            "error"
        );

    }

}


/* ============================================================
   DISPLAY PROFILE PHOTO
============================================================ */

function displayNurseProfilePhoto(
    photoUrl
) {

    const image =
        document.getElementById(
            "nurseProfileImage"
        );

    const avatar =
        document.getElementById(
            "nurseProfileAvatar"
        );


    if (image) {

        image.src =
            `${photoUrl}?t=${Date.now()}`;

        image.classList.remove(
            "hidden"
        );

    }


    if (avatar) {

        avatar.classList.add(
            "hidden"
        );

    }


    localStorage.setItem(
        "profile_photo",
        photoUrl
    );

}


/* ============================================================
   DISPLAY LOCAL PROFILE PHOTO
============================================================ */

function displayLocalProfilePhoto(
    file
) {

    const reader =
        new FileReader();


    reader.onload =
        function (event) {

            const image =
                document.getElementById(
                    "nurseProfileImage"
                );

            const avatar =
                document.getElementById(
                    "nurseProfileAvatar"
                );


            if (image) {

                image.src =
                    event.target.result;

                image.classList.remove(
                    "hidden"
                );

            }


            if (avatar) {

                avatar.classList.add(
                    "hidden"
                );

            }

        };


    reader.readAsDataURL(
        file
    );

}


/* ============================================================
   LOAD SAVED PROFILE PHOTO
============================================================ */

function loadSavedProfilePhoto() {

    const photo =
        localStorage.getItem(
            "profile_photo"
        );


    if (photo) {

        displayNurseProfilePhoto(
            photo
        );

    }

}


/* ============================================================
   TOAST
============================================================ */

function showToast(
    message,
    type = "success"
) {

    const toast =
        document.getElementById(
            "toast"
        );

    const messageElement =
        document.getElementById(
            "toastMessage"
        );

    const iconElement =
        document.getElementById(
            "toastIcon"
        );


    if (!toast) {
        return;
    }


    if (messageElement) {

        messageElement.textContent =
            message;

    }


    if (iconElement) {

        if (type === "error") {

            iconElement.textContent =
                "✕";

        }
        else if (type === "info") {

            iconElement.textContent =
                "ℹ";

        }
        else {

            iconElement.textContent =
                "✓";

        }

    }


    toast.classList.remove(
        "show",
        "error",
        "info"
    );


    if (type === "error") {

        toast.classList.add(
            "error"
        );

    }
    else if (type === "info") {

        toast.classList.add(
            "info"
        );

    }


    requestAnimationFrame(
        function () {

            toast.classList.add(
                "show"
            );

        }
    );


    clearTimeout(
        window.__nurseToastTimer
    );


    window.__nurseToastTimer =
        setTimeout(
            function () {

                toast.classList.remove(
                    "show"
                );

            },
            3500
        );

}


/* ============================================================
   LOGOUT
============================================================ */

function logout() {

    /*
     * Keep the current project's local-storage approach.
     */

    localStorage.removeItem(
        "selectedPatientId"
    );


    /*
     * If your login page is index.html,
     * this returns to the login page.
     */

    window.location.href =
        "index.html";

}


/* ============================================================
   UTILITY FUNCTIONS
============================================================ */

function setElementText(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );

    if (element) {

        element.textContent =
            value ?? "—";

    }

}


function setElementValue(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );

    if (element) {

        element.value =
            value ?? "";

    }

}


function getElementValue(
    id
) {

    const element =
        document.getElementById(
            id
        );

    return element
        ? element.value
        : "";

}


function getNumberOrNull(
    value
) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {

        return null;

    }


    const number =
        Number(value);


    return Number.isFinite(
        number
    )
        ? number
        : null;

}


/* ============================================================
   PRIORITY HELPERS
============================================================ */

function normalizePriority(
    priority
) {

    const value =
        String(
            priority || ""
        )
            .trim()
            .toUpperCase();


    if (
        value === "EMERGENCY" ||
        value === "CRITICAL"
    ) {

        return "EMERGENCY";

    }


    if (
        value === "URGENT"
    ) {

        return "URGENT";

    }


    if (
        value === "MEDIUM" ||
        value === "MODERATE"
    ) {

        return "MEDIUM";

    }


    return "ROUTINE";

}


function getPriorityIcon(
    priority
) {

    const normalized =
        normalizePriority(
            priority
        );


    if (
        normalized === "EMERGENCY"
    ) {

        return "🔴";

    }


    if (
        normalized === "URGENT"
    ) {

        return "🟠";

    }


    if (
        normalized === "MEDIUM"
    ) {

        return "🟡";

    }


    return "🟢";

}


function getPriorityClass(
    priority
) {

    const normalized =
        normalizePriority(
            priority
        );


    return normalized
        .toLowerCase();

}


/* ============================================================
   DATE / FILE HELPERS
============================================================ */

function formatDateTime(
    value
) {

    if (!value) {
        return "—";
    }


    const date =
        new Date(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return String(value);

    }


    return date.toLocaleString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }
    );

}


function formatFileSize(
    bytes
) {

    if (!bytes) {
        return "0 KB";
    }


    if (bytes < 1024) {

        return `${bytes} B`;

    }


    if (bytes < 1024 * 1024) {

        return `${(
            bytes / 1024
        ).toFixed(1)} KB`;

    }


    return `${(
        bytes /
        (1024 * 1024)
    ).toFixed(1)} MB`;

}


/* ============================================================
   NOTIFICATION TEXT EXTRACTION
============================================================ */

function extractPatientName(
    message
) {

    const text =
        String(
            message || ""
        );


    const match =
        text.match(
            /Patient\s*:\s*([^|,\n]+)/i
        );


    return match
        ? match[1].trim()
        : "";

}


function extractDepartment(
    message
) {

    const text =
        String(
            message || ""
        );


    const match =
        text.match(
            /Department\s*:\s*([^|,\n]+)/i
        );


    return match
        ? match[1].trim()
        : "General Medicine";

}


function extractSymptoms(
    message
) {

    const text =
        String(
            message || ""
        );


    const match =
        text.match(
            /Symptoms?\s*:\s*(.+)$/i
        );


    return match
        ? match[1].trim()
        : "—";

}


/* ============================================================
   HTML SAFETY
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
            /\n/g,
            "\\n"
        )
        .replace(
            /\r/g,
            "\\r"
        );

}


/* ============================================================
   NOTIFICATION ERROR
============================================================ */

function renderNotificationError() {

    const dashboard =
        document.getElementById(
            "dashboardNotifications"
        );

    const full =
        document.getElementById(
            "fullNotifications"
        );


    const html = `
        <div class="empty-state">

            <div class="empty-icon">
                ⚠️
            </div>

            <h3>
                Unable to Load Notifications
            </h3>

            <p>
                Please check that the MediMatrix
                backend is running.
            </p>

        </div>
    `;


    if (dashboard) {

        dashboard.innerHTML =
            html;

    }


    if (full) {

        full.innerHTML =
            html;

    }

}


/* ============================================================
   LOAD PROFILE PHOTO ON START
============================================================ */

loadSavedProfilePhoto();