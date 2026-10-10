"use strict";

/* =========================================================
   MEDIMATRIX - HOSPITAL EMPLOYEE DASHBOARD
   REAL DATABASE VERSION
========================================================= */

const API_BASE_URL = "http://127.0.0.1:5000";

const TRANSLATION_URL = `${API_BASE_URL}/api/translate`;

const PATIENTS_URL =
    `${API_BASE_URL}/api/patients`;

const PATIENT_REGISTER_URL =
    `${API_BASE_URL}/api/patients/register`;



const EMPLOYEE_PROFILE_KEY =
    "medimatrix_employee_profile";

let toastTimer = null;


/* =========================================================
   START
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        initializeDashboard();

    }
);


/* =========================================================
   INITIALIZE
========================================================= */

async function initializeDashboard() {

    setCurrentDate();

    loadEmployeeProfile();

    setupNavigation();

    setupRegistrationForm();

    setupVoiceInput();

    setupProfileForm();

    setupProfilePhoto();

    setupQuickActions();

    setupMobileMenu();

    await loadDashboardData();

}


/* =========================================================
   CURRENT DATE
========================================================= */

function setCurrentDate() {

    const element =
        document.getElementById("currentDate");

    if (!element) {
        return;
    }

    const today = new Date();

    element.textContent =
        today.toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        );
}


/* =========================================================
   LOAD REAL DASHBOARD DATA
========================================================= */

async function loadDashboardData() {

    try {

        const response =
            await fetch(
                PATIENTS_URL,
                {
                    method: "GET",
                    headers: {
                        "Accept":
                            "application/json"
                    }
                }
            );


        if (!response.ok) {

            throw new Error(
                `Patient API returned ${response.status}`
            );

        }


        const data =
            await response.json();


        if (
            !data ||
            data.success !== true
        ) {

            throw new Error(
                data.message ||
                "Unable to load patients."
            );

        }


        const patients =
            Array.isArray(data.patients)
                ? data.patients
                : [];


        updateDashboardStatistics(
            patients
        );


        renderRecentPatients(
            patients
        );


    } catch (error) {

        console.error(
            "Dashboard patient loading error:",
            error
        );


        updateDashboardStatistics(
            []
        );


        renderRecentPatients(
            []
        );


        showToast(
            "Dashboard",
            "Unable to load patient data from server.",
            "error"
        );

    }


    await loadWaitingPatients();

}


/* =========================================================
   DASHBOARD STATISTICS
========================================================= */

function updateDashboardStatistics(
    patients
) {

    const now =
        new Date();


    const currentYear =
        now.getFullYear();


    const currentMonth =
        now.getMonth();


    const currentDay =
        now.getDate();


    let monthCount = 0;

    let todayCount = 0;


    patients.forEach(
        (patient) => {

            const dateValue =
                patient.registration_date ||
                patient.created_at;


            if (!dateValue) {
                return;
            }


            const registrationDate =
                new Date(dateValue);


            if (
                Number.isNaN(
                    registrationDate.getTime()
                )
            ) {

                return;

            }


            if (
                registrationDate.getFullYear() ===
                    currentYear &&
                registrationDate.getMonth() ===
                    currentMonth
            ) {

                monthCount++;

            }


            if (
                registrationDate.getFullYear() ===
                    currentYear &&
                registrationDate.getMonth() ===
                    currentMonth &&
                registrationDate.getDate() ===
                    currentDay
            ) {

                todayCount++;

            }

        }
    );


    const monthElement =
        document.getElementById(
            "totalPatientsMonth"
        );


    const todayElement =
        document.getElementById(
            "totalPatientsToday"
        );


    if (monthElement) {

        monthElement.textContent =
            monthCount;

    }


    if (todayElement) {

        todayElement.textContent =
            todayCount;

    }

}
/* =========================================================
   WAITING PATIENTS
========================================================= */

async function loadWaitingPatients() {
    const waitingElement =
        document.getElementById("waitingPatients");

    if (!waitingElement) {
        return;
    }

    try {
        const response = await fetch(
            PATIENTS_URL,
            {
                method: "GET",
                headers: {
                    "Accept": "application/json"
                }
            }
        );

        if (!response.ok) {
            throw new Error(
                `Patient API returned ${response.status}`
            );
        }

        const data = await response.json();

        const patients =
            Array.isArray(data.patients)
                ? data.patients
                : [];

        const waitingStatuses = [
            "REGISTERED",
            "WAITING",
            "WAITING_NURSE",
            "NURSE_PENDING",
            "PENDING_NURSE",
            "TRIAGE_PENDING"
        ];

        const waitingPatients =
            patients.filter((patient) => {

                const status =
                    String(patient.status || "")
                        .trim()
                        .toUpperCase();

                return waitingStatuses.includes(status);
            });

        waitingElement.textContent =
            waitingPatients.length;

    } catch (error) {

        console.warn(
            "Waiting patient count unavailable:",
            error
        );

        waitingElement.textContent = "0";
    }
}

/* =========================================================
   RECENT PATIENTS
========================================================= */

function renderRecentPatients(
    patients
) {

    const tableBody =
        document.getElementById(
            "recentPatientsTable"
        );


    if (!tableBody) {
        return;
    }


    if (
        !Array.isArray(patients) ||
        patients.length === 0
    ) {

        tableBody.innerHTML = `

            <tr class="empty-row">

                <td colspan="6">

                    <div class="empty-state">

                        <div class="empty-icon">
                            👥
                        </div>

                        <strong>
                            No recent registrations
                        </strong>

                        <span>
                            Registered patients will appear here.
                        </span>

                    </div>

                </td>

            </tr>

        `;

        return;

    }


    /*
     * Backend already returns newest patients first.
     * We only display the first 10.
     */

    const recentPatients =
        patients.slice(0, 10);


    tableBody.innerHTML =
        recentPatients
            .map(
                (patient) => {

                    const department =
                        patient.department ||
                        "General Medicine";


                    const status =
                        patient.status ||
                        "REGISTERED";


                    return `

                        <tr>

                            <td>

                                <span class="patient-id">
                                    ${escapeHTML(
                                        patient.patient_id ||
                                        "-"
                                    )}
                                </span>

                            </td>


                            <td>
                                ${escapeHTML(
                                    patient.full_name ||
                                    "-"
                                )}
                            </td>


                            <td>
                                ${escapeHTML(
                                    String(
                                        patient.age ??
                                        "-"
                                    )
                                )}
                            </td>


                            <td>
                                ${escapeHTML(
                                    patient.gender ||
                                    "-"
                                )}
                            </td>


                            <td>
                                ${escapeHTML(
                                    department
                                )}
                            </td>


                            <td>

                                <span
                                    class="status-badge
                                    ${getStatusClass(status)}"
                                >
                                    ${escapeHTML(
                                        status
                                    )}
                                </span>

                            </td>

                        </tr>

                    `;

                }
            )
            .join("");

}


/* =========================================================
   STATUS CLASS
========================================================= */

function getStatusClass(status) {

    const normalized =
        String(status)
            .toUpperCase();


    if (
        normalized === "WAITING"
    ) {

        return "status-waiting";

    }


    if (
        normalized === "COMPLETED"
    ) {

        return "status-completed";

    }


    return "status-registered";

}


/* =========================================================
   NAVIGATION
========================================================= */

function setupNavigation() {

    const navItems =
        document.querySelectorAll(
            ".nav-item"
        );


    navItems.forEach(
        (button) => {

            button.addEventListener(
                "click",
                () => {

                    const sectionId =
                        button.dataset.section;


                    if (!sectionId) {
                        return;
                    }


                    showSection(
                        sectionId
                    );


                    closeMobileSidebar();

                }
            );

        }
    );


    const profileTopButton =
        document.getElementById(
            "profileTopButton"
        );


    if (profileTopButton) {

        profileTopButton.addEventListener(
            "click",
            () => {

                showSection(
                    "profileSection"
                );

            }
        );

    }

}


/* =========================================================
   SHOW SECTION
========================================================= */

function showSection(
    sectionId
) {

    const sections =
        document.querySelectorAll(
            ".page-section"
        );


    sections.forEach(
        (section) => {

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


    const navItems =
        document.querySelectorAll(
            ".nav-item"
        );


    navItems.forEach(
        (button) => {

            button.classList.remove(
                "active"
            );


            if (
                button.dataset.section ===
                sectionId
            ) {

                button.classList.add(
                    "active"
                );

            }

        }
    );


    updatePageHeading(
        sectionId
    );


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


/* =========================================================
   PAGE HEADING
========================================================= */

function updatePageHeading(
    sectionId
) {

    const title =
        document.getElementById(
            "pageTitle"
        );


    const subtitle =
        document.getElementById(
            "pageSubtitle"
        );


    if (!title || !subtitle) {
        return;
    }


    if (
        sectionId ===
        "registrationSection"
    ) {

        title.textContent =
            "Register Patient";

        subtitle.textContent =
            "Register a new patient and route them automatically.";

    }

    else if (
        sectionId ===
        "profileSection"
    ) {

        title.textContent =
            "My Profile";

        subtitle.textContent =
            "Manage your hospital employee profile.";

    }

    else {

        title.textContent =
            "Hospital Employee Dashboard";

        subtitle.textContent =
            "Manage patient registration and daily work.";

    }

}


/* =========================================================
   QUICK ACTIONS
========================================================= */

function setupQuickActions() {

    const quickRegisterButton =
        document.getElementById(
            "quickRegisterButton"
        );


    if (quickRegisterButton) {

        quickRegisterButton.addEventListener(
            "click",
            () => {

                showSection(
                    "registrationSection"
                );


                const fullName =
                    document.getElementById(
                        "fullName"
                    );


                if (fullName) {

                    setTimeout(
                        () => {

                            fullName.focus();

                        },
                        250
                    );

                }

            }
        );

    }


    const clearButton =
        document.getElementById(
            "clearFormButton"
        );


    if (clearButton) {

        clearButton.addEventListener(
            "click",
            clearRegistrationForm
        );

    }

}


/* =========================================================
   REGISTRATION FORM
========================================================= */

function setupRegistrationForm() {

    const form =
        document.getElementById(
            "patientRegistrationForm"
        );


    if (!form) {
        return;
    }


    form.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();

            await registerPatient();

        }
    );

}

/* =========================================================
   MULTILINGUAL VOICE-TO-TEXT
========================================================= */

function setupVoiceInput() {

    const voiceButton =
        document.getElementById("voiceInputButton");

    const voiceButtonText =
        document.getElementById("voiceInputText");

    const voiceLanguage =
        document.getElementById("voiceLanguage");

    const voiceStatus =
        document.getElementById("voiceStatus");

    const symptoms =
        document.getElementById("symptoms");


    if (
        !voiceButton ||
        !voiceButtonText ||
        !voiceLanguage ||
        !voiceStatus ||
        !symptoms
    ) {
        return;
    }


    /*
     * Browser Speech Recognition
     */

    const SpeechRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;


    if (!SpeechRecognition) {

        voiceButton.disabled = true;

        voiceButtonText.textContent =
            "Voice Not Supported";

        voiceStatus.textContent =
            "Use Google Chrome or Microsoft Edge.";

        return;
    }


    const recognition =
        new SpeechRecognition();


    recognition.continuous = false;

    recognition.interimResults = true;

    recognition.maxAlternatives = 1;


    let isListening = false;


    /*
     * Language selection
     */

    voiceLanguage.addEventListener(
        "change",
        () => {

            recognition.lang =
                voiceLanguage.value;

            voiceStatus.textContent =
                `Language: ${voiceLanguage.options[
                    voiceLanguage.selectedIndex
                ].text}`;
        }
    );


    /*
     * Default language
     */

    recognition.lang =
        voiceLanguage.value;


    /*
     * Start / Stop
     */

    voiceButton.addEventListener(
        "click",
        () => {

            if (isListening) {

                recognition.stop();

                return;
            }


            recognition.lang =
                voiceLanguage.value;


            try {

                recognition.start();

            } catch (error) {

                console.warn(
                    "Speech recognition start error:",
                    error
                );

            }

        }
    );


    /*
     * Started listening
     */

    recognition.onstart = () => {

        isListening = true;

        voiceButton.classList.add(
            "voice-listening"
        );

        voiceButtonText.textContent =
            "Listening...";

        voiceStatus.textContent =
            "🎙️ Speak now";

    };


    /*
     * Speech result
     */

    recognition.onresult = async (event) => {
    let finalText = "";
    let interimText = "";

    for (
        let i = event.resultIndex;
        i < event.results.length;
        i++
    ) {
        const transcript = event.results[i][0].transcript;

        if (event.results[i].isFinal) {
            finalText += transcript + " ";
        } else {
            interimText += transcript;
        }
    }

    if (interimText.trim()) {
        voiceStatus.textContent = `Listening: ${interimText}`;
    }

    if (!finalText.trim()) {
        return;
    }

    const originalText = finalText.trim();
    const selectedLanguage = voiceLanguage.value;

    voiceButton.disabled = true;
    voiceButtonText.textContent = "Translating...";
    voiceStatus.textContent = "Translating speech to English...";

    try {
        let englishText = originalText;

        if (selectedLanguage !== "en-IN") {
            const response = await fetch(
                `${API_BASE_URL}/api/translate`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Accept": "application/json"
                    },
                    body: JSON.stringify({
                        text: originalText,
                        source_language: selectedLanguage
                    })
                }
            );

            const result = await response.json();

            if (
                !response.ok ||
                !result.success ||
                !result.translated_text
            ) {
                throw new Error(
                    result.message || "Translation failed."
                );
            }

            englishText = result.translated_text.trim();
        }

        const existingText = symptoms.value.trim();

        symptoms.value = existingText
            ? `${existingText} ${englishText}`
            : englishText;

        symptoms.dispatchEvent(
            new Event("input", { bubbles: true })
        );

        voiceStatus.textContent =
            "English translation added successfully.";

    } catch (error) {
        console.error("Speech translation error:", error);

        voiceStatus.textContent =
            "Translation failed. Please try again or type symptoms manually.";

        showToast(
            "Translation Failed",
            error.message || "Could not translate speech.",
            "error"
        );
    } finally {
        voiceButton.disabled = false;
        voiceButtonText.textContent = "Speak Symptoms";
    }
};


    /*
     * Recognition ended
     */

    recognition.onend = () => {

        isListening = false;

        voiceButton.classList.remove(
            "voice-listening"
        );

        voiceButtonText.textContent =
            "Speak Symptoms";

        voiceStatus.textContent =
            "Ready";

    };


    /*
     * Recognition error
     */

    recognition.onerror = (event) => {

        isListening = false;

        voiceButton.classList.remove(
            "voice-listening"
        );

        voiceButtonText.textContent =
            "Speak Symptoms";


        let message =
            "Voice input failed.";


        if (
            event.error ===
            "not-allowed"
        ) {

            message =
                "Microphone permission denied.";

        } else if (
            event.error ===
            "no-speech"
        ) {

            message =
                "No speech detected. Please try again.";

        } else if (
            event.error ===
            "audio-capture"
        ) {

            message =
                "Microphone not available.";

        } else if (
            event.error ===
            "network"
        ) {

            message =
                "Network error during speech recognition.";

        }


        voiceStatus.textContent =
            message;


        console.warn(
            "Voice recognition error:",
            event.error
        );

    };

}

/* =========================================================
   REGISTER PATIENT
========================================================= */

async function registerPatient() {

    const button =
        document.getElementById(
            "registerPatientButton"
        );


    const buttonText =
        document.getElementById(
            "registerButtonText"
        );


    const fullName =
        document.getElementById(
            "fullName"
        ).value.trim();


    const age =
        document.getElementById(
            "age"
        ).value.trim();


    const gender =
        document.getElementById(
            "gender"
        ).value;


    const phone =
        document.getElementById(
            "phone"
        ).value.trim();


    const emergencyContact =
        document.getElementById(
            "emergencyContact"
        ).value.trim();


    const address =
        document.getElementById(
            "address"
        ).value.trim();


    const symptoms =
        document.getElementById(
            "symptoms"
        ).value.trim();


    /* =====================================================
       VALIDATION
    ====================================================== */

    if (!fullName) {

        showToast(
            "Missing Information",
            "Please enter the patient's full name.",
            "error"
        );

        return;

    }


    if (
        !age ||
        Number(age) < 0 ||
        Number(age) > 150
    ) {

        showToast(
            "Invalid Age",
            "Please enter a valid patient age.",
            "error"
        );

        return;

    }


    if (!gender) {

        showToast(
            "Missing Gender",
            "Please select the patient's gender.",
            "error"
        );

        return;

    }


    if (!phone) {

        showToast(
            "Missing Phone",
            "Please enter the patient's phone number.",
            "error"
        );

        return;

    }


    if (!address) {

        showToast(
            "Missing Address",
            "Please enter the patient's address.",
            "error"
        );

        return;

    }


    if (!emergencyContact) {

        showToast(
            "Missing Emergency Contact",
            "Please enter an emergency contact number.",
            "error"
        );

        return;

    }


    if (!symptoms) {

        showToast(
            "Missing Symptoms",
            "Please enter the patient's symptoms.",
            "error"
        );

        return;

    }


    /* =====================================================
       DATA SENT TO FLASK
    ====================================================== */

    const patientData = {

        full_name:
            fullName,

        age:
            Number(age),

        gender:
            gender,

        phone:
            phone,

        address:
            address,

        emergency_contact:
            emergencyContact,

        symptoms:
            symptoms

    };


    /* =====================================================
       LOADING
    ====================================================== */

    if (button) {

        button.disabled = true;

    }


    if (buttonText) {

        buttonText.textContent =
            "Registering...";

    }


    try {

        const response =
            await fetch(
                PATIENT_REGISTER_URL,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify(
                            patientData
                        )
                }
            );


        const result =
            await response.json();


        if (!response.ok) {

            throw new Error(
                result.message ||
                result.error ||
                "Patient registration failed."
            );

        }


        if (
            result.success === false
        ) {

            throw new Error(
                result.message ||
                "Patient registration failed."
            );

        }


        const patient =
            result.patient ||
            {};


        const patientId =
            result.patient_id ||
            patient.patient_id ||
            "-";


        const department =
            result.department ||
            patient.department ||
            "General Medicine";


        const status =
            result.status ||
            patient.status ||
            "REGISTERED";


// ============================================================
// SAVE LAST REGISTERED PATIENT FOR PRINT
// ============================================================

const roomNo =
    result.room_no ||
    result.room_number ||
    result.room ||
    patient.room_no ||
    patient.room_number ||
    patient.room ||
    "Not Assigned";

const voiceLanguage =
    document.getElementById("voiceLanguage")?.value ||
    "Not Specified";

window.lastRegisteredPatient = {
    patient_id: patientId,
    full_name: fullName,
    age: age,
    gender: gender,
    phone: phone,
    emergency_contact: emergencyContact,
    address: address,
    symptoms: symptoms,
    department: department,
    room_no: roomNo,
    status: status,
    voice_language: voiceLanguage,
    registered_by:
        window.employeeProfile?.full_name ||
        localStorage.getItem("username") ||
        localStorage.getItem("user_id") ||
        "Hospital Employee",
    registration_date: new Date()
};
        /* =================================================
           SHOW RESULT
        ================================================== */

        showRegistrationResult({
    full_name: fullName,
    patient_id: patientId,
    department: department,
    room_no: roomNo,
    status: status
});


        /* =================================================
           CLEAR FORM
        ================================================== */

        document
            .getElementById(
                "patientRegistrationForm"
            )
            .reset();


        /* =================================================
           REFRESH REAL DATABASE DASHBOARD
        ================================================== */

        await loadDashboardData();


        showToast(
            "Patient Registered",
            `${fullName} registered successfully.`,
            "success"
        );


    } catch (error) {

        console.error(
            "Patient registration error:",
            error
        );


        showToast(
            "Registration Failed",
            error.message ||
            "Unable to register patient.",
            "error"
        );


    } finally {

        if (button) {

            button.disabled = false;

        }


        if (buttonText) {

            buttonText.textContent =
                "Register Patient";

        }

    }

}


/* =========================================================
   REGISTRATION RESULT
========================================================= */

function showRegistrationResult(
    patient
) {

    const resultBox =
        document.getElementById(
            "registrationResult"
        );


    if (!resultBox) {
        return;
    }


    const nameElement =
        document.getElementById(
            "resultPatientName"
        );


    const idElement =
        document.getElementById(
            "resultPatientId"
        );


    const departmentElement =
        document.getElementById(
            "resultDepartment"
        );


    const statusElement =
        document.getElementById(
            "resultStatus"
        );


    if (nameElement) {

        nameElement.textContent =
            patient.full_name;

    }


    if (idElement) {

        idElement.textContent =
            patient.patient_id;

    }


    if (departmentElement) {

        departmentElement.textContent =
            patient.department;

    }


    if (statusElement) {

        statusElement.textContent =
            patient.status;

    }


    resultBox.classList.remove(
        "hidden"
    );


    resultBox.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });

}


/* =========================================================
   CLEAR REGISTRATION
========================================================= */

function clearRegistrationForm() {

    const form =
        document.getElementById(
            "patientRegistrationForm"
        );


    if (form) {

        form.reset();

    }


    const resultBox =
        document.getElementById(
            "registrationResult"
        );


    if (resultBox) {

        resultBox.classList.add(
            "hidden"
        );

    }

}


/* =========================================================
   EMPLOYEE PROFILE
========================================================= */

function getEmployeeProfile() {

    const defaultProfile = {

        name:
            "Hospital Employee",

        employee_id:
            "EMP-0001",

        role:
            "Hospital Employee",

        phone:
            "",

        email:
            "",

        profile_photo:
            ""

    };


    try {

        const saved =
            localStorage.getItem(
                EMPLOYEE_PROFILE_KEY
            );


        if (!saved) {

            return defaultProfile;

        }


        const profile =
            JSON.parse(saved);


        return {
            ...defaultProfile,
            ...profile
        };


    } catch (error) {

        console.error(
            "Profile loading error:",
            error
        );


        return defaultProfile;

    }

}


/* =========================================================
   SAVE PROFILE
========================================================= */

function saveEmployeeProfile(
    profile
) {

    try {

        localStorage.setItem(
            EMPLOYEE_PROFILE_KEY,
            JSON.stringify(profile)
        );

    } catch (error) {

        console.error(
            "Profile saving error:",
            error
        );

    }

}


/* =========================================================
   LOAD PROFILE
========================================================= */

function loadEmployeeProfile() {

    const profile =
        getEmployeeProfile();


    const elements = {

        sidebarName:
            document.getElementById(
                "sidebarEmployeeName"
            ),

        topName:
            document.getElementById(
                "topEmployeeName"
            ),

        welcomeName:
            document.getElementById(
                "welcomeEmployeeName"
            ),

        cardName:
            document.getElementById(
                "profileCardName"
            ),

        profileName:
            document.getElementById(
                "profileName"
            ),

        employeeId:
            document.getElementById(
                "profileEmployeeId"
            ),

        role:
            document.getElementById(
                "profileRole"
            ),

        phone:
            document.getElementById(
                "profilePhone"
            ),

        email:
            document.getElementById(
                "profileEmail"
            )

    };


    if (elements.sidebarName) {

        elements.sidebarName.textContent =
            profile.name;

    }


    if (elements.topName) {

        elements.topName.textContent =
            profile.name;

    }


    if (elements.welcomeName) {

        elements.welcomeName.textContent =
            profile.name;

    }


    if (elements.cardName) {

        elements.cardName.textContent =
            profile.name;

    }


    if (elements.profileName) {

        elements.profileName.value =
            profile.name;

    }


    if (elements.employeeId) {

        elements.employeeId.value =
            profile.employee_id;

    }


    if (elements.role) {

        elements.role.value =
            profile.role;

    }


    if (elements.phone) {

        elements.phone.value =
            profile.phone;

    }


    if (elements.email) {

        elements.email.value =
            profile.email;

    }


    updateProfileImage(
        profile.profile_photo
    );

}


/* =========================================================
   PROFILE FORM
========================================================= */

function setupProfileForm() {

    const form =
        document.getElementById(
            "profileForm"
        );


    if (!form) {
        return;
    }


    form.addEventListener(
        "submit",
        (event) => {

            event.preventDefault();


            const profile =
                getEmployeeProfile();


            profile.phone =
                document.getElementById(
                    "profilePhone"
                ).value.trim();


            profile.email =
                document.getElementById(
                    "profileEmail"
                ).value.trim();


            saveEmployeeProfile(
                profile
            );


            showToast(
                "Profile Saved",
                "Your profile has been updated.",
                "success"
            );

        }
    );

}


/* =========================================================
   PROFILE PHOTO
========================================================= */

function setupProfilePhoto() {

    const input =
        document.getElementById(
            "profilePhotoInput"
        );


    if (!input) {
        return;
    }


    input.addEventListener(
        "change",
        function () {

            const file =
                this.files &&
                this.files[0];


            if (!file) {
                return;
            }


            if (
                !file.type.startsWith(
                    "image/"
                )
            ) {

                showToast(
                    "Invalid File",
                    "Please select an image file.",
                    "error"
                );

                return;

            }


            const reader =
                new FileReader();


            reader.onload =
                (event) => {

                    const profile =
                        getEmployeeProfile();


                    profile.profile_photo =
                        event.target.result;


                    saveEmployeeProfile(
                        profile
                    );


                    updateProfileImage(
                        profile.profile_photo
                    );


                    showToast(
                        "Profile Photo Updated",
                        "Your profile photo has been changed.",
                        "success"
                    );

                };


            reader.readAsDataURL(
                file
            );

        }
    );

}


/* =========================================================
   UPDATE PROFILE IMAGE
========================================================= */

function updateProfileImage(
    imageData
) {

    const elements = [

        document.getElementById(
            "sidebarProfileImage"
        ),

        document.getElementById(
            "topProfileImage"
        ),

        document.getElementById(
            "profileImagePreview"
        )

    ];


    elements.forEach(
        (element) => {

            if (!element) {
                return;
            }


            if (imageData) {

                element.innerHTML =
                    "";


                const image =
                    document.createElement(
                        "img"
                    );


                image.src =
                    imageData;


                image.alt =
                    "Employee Profile";


                element.appendChild(
                    image
                );

            } else {

                element.textContent =
                    "👤";

            }

        }
    );

}


/* =========================================================
   MOBILE MENU
========================================================= */

function setupMobileMenu() {

    const button =
        document.getElementById(
            "mobileMenuButton"
        );


    const sidebar =
        document.querySelector(
            ".sidebar"
        );


    const overlay =
        document.getElementById(
            "sidebarOverlay"
        );


    if (!button || !sidebar) {
        return;
    }


    button.addEventListener(
        "click",
        () => {

            sidebar.classList.toggle(
                "mobile-open"
            );


            if (overlay) {

                overlay.classList.toggle(
                    "show"
                );

            }

        }
    );


    if (overlay) {

        overlay.addEventListener(
            "click",
            closeMobileSidebar
        );

    }

}


function closeMobileSidebar() {

    const sidebar =
        document.querySelector(
            ".sidebar"
        );


    const overlay =
        document.getElementById(
            "sidebarOverlay"
        );


    if (sidebar) {

        sidebar.classList.remove(
            "mobile-open"
        );

    }


    if (overlay) {

        overlay.classList.remove(
            "show"
        );

    }

}


/* =========================================================
   TOAST
========================================================= */

function showToast(
    title,
    message,
    type = "success"
) {

    const toast =
        document.getElementById(
            "toast"
        );


    const toastTitle =
        document.getElementById(
            "toastTitle"
        );


    const toastMessage =
        document.getElementById(
            "toastMessage"
        );


    const toastIcon =
        document.getElementById(
            "toastIcon"
        );


    if (
        !toast ||
        !toastTitle ||
        !toastMessage ||
        !toastIcon
    ) {

        return;

    }


    toastTitle.textContent =
        title;


    toastMessage.textContent =
        message;


    if (type === "error") {

        toastIcon.textContent =
            "!";

        toastIcon.style.background =
            "#fee2e2";

        toastIcon.style.color =
            "#b91c1c";

    } else {

        toastIcon.textContent =
            "✓";

        toastIcon.style.background =
            "#dcfce7";

        toastIcon.style.color =
            "#15803d";

    }


    toast.classList.add(
        "show"
    );


    if (toastTimer) {

        clearTimeout(
            toastTimer
        );

    }


    toastTimer =
        setTimeout(
            () => {

                toast.classList.remove(
                    "show"
                );

            },
            3500
        );

}


/* =========================================================
   HTML ESCAPE
========================================================= */

function escapeHTML(
    value
) {

    return String(value)
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

// ============================================================
// MEDIMATRIX - PROFESSIONAL PATIENT REGISTRATION PRINT
// ============================================================

window.printPatientRegistration = function () {

    const patient = window.lastRegisteredPatient;

    if (!patient) {
        alert("No registered patient data found.");
        return;
    }

    const escapeHTML = (value) => {
        if (value === null || value === undefined || value === "") {
            return "-";
        }

        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    };

    const patientId = escapeHTML(patient.patient_id);
    const fullName = escapeHTML(patient.full_name);
    const age = escapeHTML(patient.age);
    const gender = escapeHTML(patient.gender);
    const phone = escapeHTML(patient.phone);
    const emergencyContact = escapeHTML(patient.emergency_contact);
    const address = escapeHTML(patient.address);
    const symptoms = escapeHTML(patient.symptoms);

    const department = escapeHTML(
        patient.department || "Not Assigned"
    );

    const roomNo = escapeHTML(
        patient.room_no ||
        patient.room_number ||
        patient.room ||
        "Not Assigned"
    );

    const status = escapeHTML(
        patient.status || "REGISTERED"
    );

    const voiceLanguage = escapeHTML(
        patient.voice_language || "Not Specified"
    );

    const registeredBy = escapeHTML(
        patient.registered_by ||
        localStorage.getItem("username") ||
        localStorage.getItem("user_id") ||
        "Hospital Employee"
    );

    const registrationDate = patient.registration_date
        ? new Date(patient.registration_date)
        : new Date();

    const date = registrationDate.toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        }
    );

    const time = registrationDate.toLocaleTimeString(
        "en-IN",
        {
            hour: "2-digit",
            minute: "2-digit"
        }
    );

    /*
     * QR contains ONLY patient ID.
     * Do not place medical information inside the QR code.
     */
    const qrData = encodeURIComponent(
        patient.patient_id || ""
    );

    const printWindow = window.open(
        "",
        "_blank",
        "width=1000,height=900"
    );

    if (!printWindow) {
        alert(
            "Print window was blocked. Please allow pop-ups for MediMatrix."
        );
        return;
    }

    printWindow.document.open();

    printWindow.document.write(`
<!DOCTYPE html>

<html lang="en">

<head>

<meta charset="UTF-8">

<title>
MediMatrix - Patient Registration
</title>

<style>

* {
    box-sizing: border-box;
}

html,
body {
    margin: 0;
    padding: 0;
}

body {

    background: #eef2f7;

    font-family:
        "Segoe UI",
        Arial,
        Helvetica,
        sans-serif;

    color: #172033;

    padding: 25px;
}

.page {

    width: 210mm;

    min-height: 297mm;

    margin: auto;

    background: #ffffff;

    padding: 14mm;

    position: relative;

    box-shadow:
        0 8px 30px rgba(0,0,0,0.12);
}


/* ============================================================
   HEADER
============================================================ */

.header {

    display: flex;

    justify-content: space-between;

    align-items: center;

    padding-bottom: 13px;

    border-bottom: 3px solid #0f766e;
}

.brand {

    display: flex;

    align-items: center;

    gap: 12px;
}

.logo {

    width: 56px;

    height: 56px;

    border-radius: 13px;

    background:
        linear-gradient(
            135deg,
            #0f766e,
            #14b8a6
        );

    color: white;

    display: flex;

    justify-content: center;

    align-items: center;

    font-size: 28px;

    font-weight: 800;
}

.brand-name {

    font-size: 27px;

    font-weight: 800;

    letter-spacing: 1px;

    color: #0f766e;
}

.brand-subtitle {

    font-size: 10px;

    color: #64748b;

    margin-top: 2px;

    letter-spacing: 0.5px;
}

.qr {

    width: 72px;

    height: 72px;

    border: 1px solid #cbd5e1;

    padding: 3px;
}


/* ============================================================
   TITLE
============================================================ */

.title {

    text-align: center;

    margin: 18px 0;
}

.title h1 {

    margin: 0;

    font-size: 20px;

    letter-spacing: 1px;

    color: #0f172a;
}

.title p {

    margin: 5px 0 0;

    font-size: 9px;

    color: #64748b;

    letter-spacing: 1.5px;

    text-transform: uppercase;
}


/* ============================================================
   PATIENT SUMMARY
============================================================ */

.summary {

    display: grid;

    grid-template-columns:
        1.5fr
        1fr
        1fr;

    border: 1px solid #cbd5e1;

    border-radius: 7px;

    overflow: hidden;
}

.summary-item {

    padding: 10px 12px;

    border-right: 1px solid #e2e8f0;
}

.summary-item:last-child {

    border-right: none;
}

.label {

    font-size: 8px;

    color: #64748b;

    text-transform: uppercase;

    letter-spacing: 0.8px;

    margin-bottom: 4px;
}

.value {

    font-size: 12px;

    font-weight: 700;

    color: #0f172a;
}


/* ============================================================
   SECTIONS
============================================================ */

.section {

    margin-top: 16px;

    border: 1px solid #dbe3ea;

    border-radius: 7px;

    overflow: hidden;
}

.section-title {

    padding: 8px 11px;

    background: #f0fdfa;

    border-bottom: 1px solid #dbe3ea;

    color: #115e59;

    font-size: 10px;

    font-weight: 800;

    letter-spacing: 0.8px;

    text-transform: uppercase;
}

.section-body {

    padding: 11px;
}


/* ============================================================
   INFORMATION
============================================================ */

.info-grid {

    display: grid;

    grid-template-columns:
        1fr
        1fr;
}

.info {

    padding: 8px 9px;

    border-right: 1px solid #e2e8f0;

    border-bottom: 1px solid #e2e8f0;
}

.info:nth-child(even) {

    border-right: none;
}

.info.full {

    grid-column: 1 / -1;

    border-right: none;
}

.info-label {

    font-size: 8px;

    color: #64748b;

    margin-bottom: 3px;
}

.info-value {

    font-size: 10.5px;

    font-weight: 600;

    color: #1e293b;

    word-break: break-word;
}


/* ============================================================
   SYMPTOMS
============================================================ */

.symptoms {

    min-height: 55px;

    padding: 10px;

    background: #f8fafc;

    border: 1px solid #e2e8f0;

    border-radius: 5px;

    font-size: 10.5px;

    line-height: 1.55;

    white-space: pre-wrap;
}


/* ============================================================
   CARE ASSIGNMENT
============================================================ */

.assignment {

    display: grid;

    grid-template-columns:
        1fr
        1fr;

    gap: 12px;
}

.assignment-box {

    padding: 13px;

    border: 1px solid #99f6e4;

    border-radius: 7px;

    background: #f0fdfa;
}

.assignment-label {

    font-size: 8px;

    color: #0f766e;

    text-transform: uppercase;

    font-weight: 700;

    margin-bottom: 5px;
}

.assignment-value {

    font-size: 14px;

    font-weight: 800;

    color: #134e4a;
}


/* ============================================================
   STATUS
============================================================ */

.status {

    display: inline-block;

    padding: 4px 10px;

    border-radius: 15px;

    background: #dcfce7;

    color: #166534;

    font-size: 9px;

    font-weight: 800;
}


/* ============================================================
   SIGNATURE
============================================================ */

.signatures {

    display: grid;

    grid-template-columns:
        1fr
        1fr;

    gap: 65px;

    margin-top: 45px;
}

.signature {

    padding-top: 7px;

    border-top: 1px solid #64748b;

    text-align: center;

    font-size: 9px;

    color: #475569;
}


/* ============================================================
   FOOTER
============================================================ */

.footer {

    position: absolute;

    left: 14mm;

    right: 14mm;

    bottom: 9mm;

    padding-top: 6px;

    border-top: 1px solid #e2e8f0;

    display: flex;

    justify-content: space-between;

    font-size: 7.5px;

    color: #94a3b8;
}


/* ============================================================
   PRINT
============================================================ */

@page {

    size: A4;

    margin: 0;
}

@media print {

    body {

        padding: 0;

        background: #ffffff;
    }

    .page {

        width: 210mm;

        min-height: 297mm;

        margin: 0;

        box-shadow: none;
    }
}

</style>

</head>


<body>

<div class="page">


    <!-- ======================================================
         HEADER
    ======================================================= -->

    <div class="header">

        <img
    class="logo-image"
    src="images/medimatrix-logo.png"
    alt="MediMatrix Logo"
>          
            </div>

            <div>

                <div class="brand-name">
                    MEDIMATRIX
                </div>

                <div class="brand-subtitle">
                    Integrated Digital Healthcare System
                </div>

            </div>

        </div>


        <img
            class="qr"
            src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${qrData}"
            alt="Patient QR Code"
        >

    </div>


    <!-- ======================================================
         DOCUMENT TITLE
    ======================================================= -->

    <div class="title">

        <h1>
            PATIENT REGISTRATION DOCUMENT
        </h1>

        <p>
            Official Patient Registration Record
        </p>

    </div>


    <!-- ======================================================
         SUMMARY
    ======================================================= -->

    <div class="summary">

        <div class="summary-item">

            <div class="label">
                Patient ID
            </div>

            <div class="value">
                ${patientId}
            </div>

        </div>


        <div class="summary-item">

            <div class="label">
                Registration Date
            </div>

            <div class="value">
                ${date}
            </div>

        </div>


        <div class="summary-item">

            <div class="label">
                Registration Time
            </div>

            <div class="value">
                ${time}
            </div>

        </div>

    </div>


    <!-- ======================================================
         PATIENT INFORMATION
    ======================================================= -->

    <div class="section">

        <div class="section-title">
            Patient Information
        </div>

        <div class="section-body">

            <div class="info-grid">


                <div class="info">

                    <div class="info-label">
                        Full Name
                    </div>

                    <div class="info-value">
                        ${fullName}
                    </div>

                </div>


                <div class="info">

                    <div class="info-label">
                        Age
                    </div>

                    <div class="info-value">
                        ${age}
                    </div>

                </div>


                <div class="info">

                    <div class="info-label">
                        Gender
                    </div>

                    <div class="info-value">
                        ${gender}
                    </div>

                </div>


                <div class="info">

                    <div class="info-label">
                        Mobile Number
                    </div>

                    <div class="info-value">
                        ${phone}
                    </div>

                </div>


                <div class="info">

                    <div class="info-label">
                        Emergency Contact
                    </div>

                    <div class="info-value">
                        ${emergencyContact}
                    </div>

                </div>


                <div class="info">

                    <div class="info-label">
                        Department
                    </div>

                    <div class="info-value">
                        ${department}
                    </div>

                </div>


                <div class="info full">

                    <div class="info-label">
                        Address
                    </div>

                    <div class="info-value">
                        ${address}
                    </div>

                </div>

            </div>

        </div>

    </div>


    <!-- ======================================================
         CLINICAL INFORMATION
    ======================================================= -->

    <div class="section">

        <div class="section-title">
            Clinical Information
        </div>

        <div class="section-body">

            <div class="info-label">
                Chief Complaint / Symptoms
            </div>

            <div class="symptoms">
                ${symptoms}
            </div>


            <div style="height: 10px;"></div>


            <div class="info-grid">

                <div class="info">

                    <div class="info-label">
                        Voice Language
                    </div>

                    <div class="info-value">
                        ${voiceLanguage}
                    </div>

                </div>


                <div class="info">

                    <div class="info-label">
                        Routing Department
                    </div>

                    <div class="info-value">
                        ${department}
                    </div>

                </div>

            </div>

        </div>

    </div>


    <!-- ======================================================
         CARE ASSIGNMENT
    ======================================================= -->

    <div class="section">

        <div class="section-title">
            Care Assignment
        </div>

        <div class="section-body">

            <div class="assignment">


                <div class="assignment-box">

                    <div class="assignment-label">
                        Department
                    </div>

                    <div class="assignment-value">
                        ${department}
                    </div>

                </div>


                <div class="assignment-box">

                    <div class="assignment-label">
                        Room No.
                    </div>

                    <div class="assignment-value">
                        ${roomNo}
                    </div>

                </div>


            </div>

        </div>

    </div>


    <!-- ======================================================
         REGISTRATION DETAILS
    ======================================================= -->

    <div class="section">

        <div class="section-title">
            Registration Details
        </div>

        <div class="section-body">

            <div class="info-grid">


                <div class="info">

                    <div class="info-label">
                        Registered By
                    </div>

                    <div class="info-value">
                        ${registeredBy}
                    </div>

                </div>


                <div class="info">

                    <div class="info-label">
                        Registration Status
                    </div>

                    <div class="info-value">

                        <span class="status">
                            ${status}
                        </span>

                    </div>

                </div>


            </div>

        </div>

    </div>


    <!-- ======================================================
         SIGNATURES
    ======================================================= -->

    <div class="signatures">

        <div class="signature">
            Patient / Guardian Signature
        </div>

        <div class="signature">
            Registration Staff Signature
        </div>

    </div>


    <!-- ======================================================
         FOOTER
    ======================================================= -->

    <div class="footer">

        <span>
            MediMatrix • Digital Healthcare Management System
        </span>

        <span>
            Computer Generated Document
        </span>

    </div>


</div>


<script>

window.onload = function () {

    setTimeout(function () {

        window.print();

    }, 800);

};

<\/script>

</body>

</html>
    `);

    printWindow.document.close();
};

/* =========================================================
   MEDIMATRIX HOSPITAL EMPLOYEE LOGOUT
========================================================= */

document.addEventListener("DOMContentLoaded", function () {
    const logoutButton = document.getElementById("logoutButton");

    if (!logoutButton) return;

    logoutButton.addEventListener("click", function () {
        const confirmed = window.confirm(
            "Are you sure you want to log out of MediMatrix?"
        );

        if (!confirmed) return;

        // Use the existing application logout route if available.
        window.location.href = "login.html";
    });
});
