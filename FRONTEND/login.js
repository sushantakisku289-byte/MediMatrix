// ============================================================
// MEDIMATRIX LOGIN
// ============================================================

const API_BASE_URL = "http://127.0.0.1:5000";
const LOGIN_URL = `${API_BASE_URL}/api/auth/login`;


// ============================================================
// ELEMENTS
// ============================================================

const loginForm = document.getElementById("loginForm");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const roleInput = document.getElementById("role");
const rememberMeInput = document.getElementById("rememberMe");
const loginMessage = document.getElementById("loginMessage");
const togglePassword = document.getElementById("togglePassword");
const forgotPassword = document.getElementById("forgotPassword");


// ============================================================
// SHOW MESSAGE
// ============================================================

function showMessage(message, type = "info") {

    if (!loginMessage) {
        return;
    }

    loginMessage.textContent = message;
    loginMessage.className = "login-message";

    if (type) {
        loginMessage.classList.add(type);
    }
}


// ============================================================
// CLEAR OLD SESSION DATA
// ============================================================

function clearOldSessionData() {

    const keys = [
        "currentUser",
        "user",
        "user_id",
        "doctor",
        "userId",
        "nurse_id",
        "doctor_id",
        "employee_id",
        "username",
        "full_name",
        "role",
        "department_id",
        "department",
        "department_name",
        "phone",
        "email"

    ];

    keys.forEach(function (key) {
        localStorage.removeItem(key);
    });
}


// ============================================================
// SAVE USER DATA
// ============================================================

function saveUserData(user) {

    if (!user) {
        throw new Error(
            "User information was not returned by the server."
        );
    }

    const userId =
        user.user_id ??
        user.id ??
        "";

    if (!userId) {
        throw new Error(
            "Login successful, but User ID was not returned by the server."
        );
    }

    const role =
        String(user.role || "").trim().toUpperCase();


    // --------------------------------------------------------
    // MAIN USER DATA
    // --------------------------------------------------------

    localStorage.setItem(
        "currentUser",
        JSON.stringify(user)
    );

    localStorage.setItem(
        "user",
        JSON.stringify(user)
    );

    localStorage.setItem(
        "user_id",
        String(userId)
    );

    localStorage.setItem(
        "userId",
        String(userId)
    );
// --------------------------------------------------------
// ADMIN-SPECIFIC SESSION ID
// --------------------------------------------------------

if (role === "ADMIN") {

    localStorage.setItem(
        "admin_user_id",
        String(userId)
    );

}

    // --------------------------------------------------------
    // BASIC INFORMATION
    // --------------------------------------------------------

    localStorage.setItem(
        "username",
        user.username || ""
    );

    localStorage.setItem(
        "full_name",
        user.full_name || ""
    );

    localStorage.setItem(
        "role",
        role
    );

    localStorage.setItem(
        "department_id",
        user.department_id ?? ""
    );

    localStorage.setItem(
        "phone",
        user.phone || ""
    );

    localStorage.setItem(
        "email",
        user.email || ""
    );


    // --------------------------------------------------------
    // ROLE-SPECIFIC ID
    // --------------------------------------------------------

    if (
        role === "NURSE" ||
        role === "NURSE_HOD"
    ) {

        localStorage.setItem(
            "nurse_id",
            String(userId)
        );
    }


    if (
        role === "DOCTOR" ||
        role === "DOCTOR_HOD"
    ) {

        localStorage.setItem(
            "doctor_id",
            String(userId)
        );
    }


    if (
        role === "HOSPITAL_EMPLOYEE" ||
        role === "HOSPITAL_EMPLOYEE_HOD"
    ) {

        localStorage.setItem(
            "employee_id",
            String(userId)
        );
    }


    // --------------------------------------------------------
    // DEBUG
    // --------------------------------------------------------

    console.log(
        "========== MEDIMATRIX LOGIN =========="
    );

    console.log(
        "User ID:",
        localStorage.getItem("user_id")
    );

    console.log(
        "Username:",
        localStorage.getItem("username")
    );

    console.log(
        "Role:",
        localStorage.getItem("role")
    );

    console.log(
        "Nurse ID:",
        localStorage.getItem("nurse_id")
    );

    console.log(
        "Department ID:",
        localStorage.getItem("department_id")
    );

    console.log(
        "======================================"
    );
}


// ============================================================
// REDIRECT USER
// ============================================================

function redirectUser(role) {

    const dashboardMap = {

        "ADMIN":
            "admin-dashboard.html",

        "HOSPITAL_EMPLOYEE":
            "hospital-employee-dashboard.html",

        "HOSPITAL_EMPLOYEE_HOD":
            "employee-dashboard.html",

        "NURSE":
            "nurse-dashboard.html",

        "NURSE_HOD":
            "nurse-dashboard.html",

        "DOCTOR":
            "doctor-dashboard.html",

        "DOCTOR_HOD":
            "doctor-dashboard.html",

        "OPD_STAFF":
            "opd-dashboard.html",

        "OPD_HOD":
            "opd-dashboard.html",

        "IPD_STAFF":
            "ipd-dashboard.html",

        
        "IPD_HOD":
    "ipd-dashboard.html",

"PHARMACY":
    "pharmacy-dashboard.html",

"BILLING":
    "billing-dashboard.html"
    };


    const page =
        dashboardMap[role];


    if (!page) {

        showMessage(
            "No dashboard is configured for this role.",
            "error"
        );

        return;
    }


    window.location.href = page;
}


// ============================================================
// LOGIN
// ============================================================

async function handleLogin(event) {

    event.preventDefault();


    const username =
        usernameInput.value.trim();

    const password =
        passwordInput.value;

    const selectedRole =
        roleInput.value;


    // --------------------------------------------------------
    // VALIDATION
    // --------------------------------------------------------

    if (!username) {

        showMessage(
            "Please enter your username.",
            "error"
        );

        usernameInput.focus();

        return;
    }


    if (!password) {

        showMessage(
            "Please enter your password.",
            "error"
        );

        passwordInput.focus();

        return;
    }


    if (!selectedRole) {

        showMessage(
            "Please select your role.",
            "error"
        );

        roleInput.focus();

        return;
    }


    // --------------------------------------------------------
    // BUTTON
    // --------------------------------------------------------

    const loginButton =
        loginForm.querySelector(".login-button");

    const originalText =
        loginButton
            ? loginButton.textContent
            : "Login";


    if (loginButton) {

        loginButton.disabled = true;

        loginButton.textContent =
            "Signing in...";
    }


    showMessage(
        "Authenticating...",
        "info"
    );


    try {

        clearOldSessionData();


        // ----------------------------------------------------
        // SEND LOGIN REQUEST
        // ----------------------------------------------------

        const response =
            await fetch(
                LOGIN_URL,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        username: username,
                        password: password,
                        role: selectedRole
                    })
                }
            );


        let result;

        try {

            result =
                await response.json();

        } catch (error) {

            throw new Error(
                "Invalid response received from server."
            );
        }


        // ----------------------------------------------------
        // SERVER ERROR
        // ----------------------------------------------------

        if (!response.ok || !result.success) {

            throw new Error(
                result.message ||
                "Invalid username or password."
            );
        }


        // ----------------------------------------------------
        // USER
        // ----------------------------------------------------

        const user =
            result.user;


        if (!user) {

            throw new Error(
                "Server did not return user information."
            );
        }


        // ----------------------------------------------------
        // ROLE FROM SERVER
        // ----------------------------------------------------

        let serverRole =
    String(
        user.role || selectedRole
    )
    .trim()
    .toUpperCase();


/*
 * IPD compatibility:
 * Existing IPD accounts use "IPD",
 * while the login/dashboard system uses
 * "IPD_STAFF".
 */
if (serverRole === "IPD") {
    serverRole = "IPD_STAFF";
}


        // ----------------------------------------------------
        // CHECK SELECTED ROLE
        // ----------------------------------------------------

        if (
            serverRole !==
            selectedRole.toUpperCase()
        ) {

            throw new Error(
                "Selected role does not match your account role."
            );
        }


        // ----------------------------------------------------
        // SAVE LOGIN DATA
        // ----------------------------------------------------

        saveUserData(user);


        // ----------------------------------------------------
        // REMEMBER ME
        // --------------------------------------------------------

        if (
            rememberMeInput &&
            rememberMeInput.checked
        ) {

            localStorage.setItem(
                "remember_me",
                "true"
            );

        } else {

            localStorage.removeItem(
                "remember_me"
            );
        }


        // ----------------------------------------------------
        // SUCCESS
        // ----------------------------------------------------

        showMessage(
            "Login successful. Redirecting...",
            "success"
        );


        // ----------------------------------------------------
        // REDIRECT
        // ----------------------------------------------------

        setTimeout(
            function () {

                redirectUser(
                    serverRole
                );

            },
            500
        );


    } catch (error) {

        console.error(
            "MediMatrix login error:",
            error
        );


        showMessage(
            error.message ||
            "Login failed. Please try again.",
            "error"
        );


        if (loginButton) {

            loginButton.disabled = false;

            loginButton.textContent =
                originalText;
        }
    }
}


// ============================================================
// PASSWORD TOGGLE
// ============================================================

if (togglePassword) {

    togglePassword.addEventListener(
        "click",
        function () {

            const isPassword =
                passwordInput.type === "password";


            passwordInput.type =
                isPassword
                    ? "text"
                    : "password";


            togglePassword.textContent =
                isPassword
                    ? "🙈"
                    : "👁";


            togglePassword.setAttribute(
                "aria-label",
                isPassword
                    ? "Hide password"
                    : "Show password"
            );
        }
    );
}


// ============================================================
// FORGOT PASSWORD
// ============================================================

if (forgotPassword) {

    forgotPassword.addEventListener(
        "click",
        function () {

            showMessage(
                "Please contact the hospital administrator to reset your password.",
                "info"
            );
        }
    );
}


// ============================================================
// FORM SUBMIT
// ============================================================

if (loginForm) {

    loginForm.addEventListener(
        "submit",
        handleLogin
    );
}


// ============================================================
// PAGE LOAD
// ============================================================

console.log(
    "MediMatrix login.js loaded."
);

console.log(
    "Login API:",
    LOGIN_URL
);