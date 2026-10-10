/* =========================================================
   MEDIMATRIX ADMIN DASHBOARD
   Frontend Controller
   ========================================================= */

"use strict";


/* =========================================================
   LOCAL DATA
   ========================================================= */

let users = JSON.parse(
    localStorage.getItem("medimatrix_users") || "[]"
);

let patients = JSON.parse(
    localStorage.getItem("medimatrix_patients") || "[]"
);


/* =========================================================
   INITIALIZE
   ========================================================= */


document.addEventListener("DOMContentLoaded", async function () {
    updateDashboard();
    renderUsers();
    renderPatients();
    setupCreateUserForm();

    // Load real patient records from Flask/MySQL
    await loadPatientsFromDatabase();
});



/* =========================================================
   SECTION NAVIGATION
   ========================================================= */

function showSection(sectionId, button) {

    const sections = document.querySelectorAll(".page-section");

    sections.forEach(function (section) {
        section.classList.remove("active-section");
    });


    const selectedSection =
        document.getElementById(sectionId);

    if (selectedSection) {
        selectedSection.classList.add("active-section");
    }


    const buttons =
        document.querySelectorAll(".sidebar .nav-item");

    buttons.forEach(function (item) {
        item.classList.remove("active");
    });


    if (button) {
        button.classList.add("active");
    }


    updatePageTitle(sectionId);

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


/* =========================================================
   SECTION BY ID
   ========================================================= */

function showSectionById(sectionId) {

    const section =
        document.getElementById(sectionId);

    if (!section) {
        return;
    }


    document.querySelectorAll(".page-section")
        .forEach(function (item) {
            item.classList.remove("active-section");
        });


    section.classList.add("active-section");


    document.querySelectorAll(".sidebar .nav-item")
        .forEach(function (item) {
            item.classList.remove("active");
        });


    updatePageTitle(sectionId);

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


/* =========================================================
   PAGE TITLE
   ========================================================= */

function updatePageTitle(sectionId) {

    const titles = {

        dashboardSection: "Dashboard",

        createUserSection: "Create User ID",

        usersSection: "Manage Users",

        patientsSection: "Patient Records",

        departmentsSection: "Departments",

        notificationsSection: "Notifications",

        reportsSection: "Reports",

        settingsSection: "Settings"

    };


    const title =
        document.getElementById("pageTitle");

    if (title && titles[sectionId]) {
        title.textContent = titles[sectionId];
    }
}


/* =========================================================
   CREATE USER FORM
   ========================================================= */

function setupCreateUserForm() {

    const form = document.getElementById("createUserForm");

    if (!form) {
        return;
    }

    form.addEventListener("submit", async function (event) {

        event.preventDefault();

        const fullName =
            document.getElementById("userName").value.trim();

        const employeeId =
            document.getElementById("employeeId").value.trim();

        const role =
            document.getElementById("userRole").value.trim();

        const department =
            document.getElementById("userDepartment").value.trim();

        const phone =
            document.getElementById("userPhone").value.trim();

        const email =
            document.getElementById("userEmail").value.trim();

        const username =
            document.getElementById("username").value.trim();

        const password =
            document.getElementById("password").value;

        if (
            !fullName ||
            !employeeId ||
            !role ||
            !phone ||
            !username ||
            !password
        ) {
            showMessage(
                "Please fill all required fields.",
                "error"
            );
            return;
        }

        try {

            const adminUserId =
    localStorage.getItem("admin_user_id") ||
    "ADM001";

console.log(
    "ADMIN ID BEING SENT:",
    adminUserId
);

console.log("ADMIN ID BEING SENT:", adminUserId);

            const response = await fetch(
                "http://127.0.0.1:5000/api/admin/create-user",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({

                        admin_user_id: adminUserId,

                        full_name: fullName,

                        employee_id: employeeId,

                        username: username,

                        password: password,

                        role: role.toUpperCase(),

                        department: department,

                        phone: phone,

                        email: email
                    })
                }
            );

            const result = await response.json();

            console.log(
                "CREATE USER RESPONSE:",
                result
            );

            if (!response.ok || !result.success) {

                showMessage(
                    result.error ||
                    result.message ||
                    "Unable to create staff account.",
                    "error"
                );

                return;
            }

            showMessage(
                "Account created successfully. User ID: " +
                result.user.user_id,
                "success"
            );

            form.reset();

            if (
                typeof loadUsersFromDatabase ===
                "function"
            ) {
                await loadUsersFromDatabase();
            }

            updateDashboard();

        } catch (error) {

            console.error(
                "CREATE USER ERROR:",
                error
            );

            showMessage(
                "Unable to connect to the backend.",
                "error"
            );
        }

    });
}   

/* =========================================================
   DEPARTMENT FIELD
   ========================================================= */

function updateDepartmentField() {

    const role =
        document.getElementById("userRole").value;

    const department =
        document.getElementById("userDepartment");

    if (!department) {
        return;
    }


    if (role === "pharmacy") {

        department.value = "";

        department.disabled = true;

    }

    else if (role === "billing") {

        department.value = "";

        department.disabled = true;

    }

    else {

        department.disabled = false;

    }

}


/* =========================================================
   SHOW MESSAGE
   ========================================================= */

function showMessage(message, type) {

    const box =
        document.getElementById("createUserMessage");

    if (!box) {
        return;
    }


    box.textContent = message;

    box.className =
        "form-message " + type;


    setTimeout(function () {

        box.className = "form-message";

    }, 5000);

}


async function loadUsersFromDatabase() {

    try {

        const response = await fetch(
            "http://127.0.0.1:5000/api/admin/dashboard"
        );

        const result = await response.json();

        if (!response.ok || !result.success) {

            console.error(
                "Unable to load users:",
                result
            );

            return;
        }

        /*
         * Convert backend users into the format
         * already expected by this dashboard.
         */
        users = (result.users || []).map(function (user) {

            return {

                id: user.id,

                employee_id:
                    user.user_id || "-",

                name:
                    user.full_name || "-",

                username:
                    user.username || "",

                role:
                    String(user.role || "").toLowerCase(),

                department:
    user.department || user.department_id || "-",

                phone:
                    user.phone || "",

                email:
                    user.email || "",

                status:
                    user.is_active
                        ? "active"
                        : "inactive",

                created_at:
                    user.created_at || null

            };

        });

        localStorage.setItem(
            "medimatrix_users",
            JSON.stringify(users)
        );

        renderUsers();

    } catch (error) {

        console.error(
            "Load users error:",
            error
        );

    }
}


async function loadPatientsFromDatabase() {
    const API_URL = "http://127.0.0.1:5000/api/patients";

    try {
        console.log("Loading patient records from:", API_URL);

        const response = await fetch(API_URL, {
            method: "GET",
            headers: {
                "Accept": "application/json"
            }
        });

        if (!response.ok) {
            throw new Error(
                "Patient API returned HTTP " + response.status
            );
        }

        const result = await response.json();

        console.log("Patient API response:", result);

        if (result.success !== true) {
            throw new Error(
                result.message || "Unable to load patient records."
            );
        }

        if (!Array.isArray(result.patients)) {
            throw new Error(
                "The API response does not contain a patients array."
            );
        }

        patients = result.patients.map(function (p) {
            return {
                ...p,
                patient_id: p.patient_id ?? p.id ?? "",
                name: p.name ?? p.full_name ?? p.patient_name ?? "",
                age: p.age ?? "",
                gender: p.gender ?? "",
                department: p.department ?? p.department_name ?? "",
                priority: p.priority ?? "Normal",
                status: p.status ?? "Registered"
            };
        });

        localStorage.setItem(
            "medimatrix_patients",
            JSON.stringify(patients)
        );

        renderPatients();
        updateDashboard();

        console.log("Patients loaded:", patients.length);

    } catch (error) {
        console.error("PATIENT LOADING ERROR:", error);
    }
}

/* =========================================================
   RENDER USERS
   ========================================================= */

function renderUsers() {

    const tbody =
        document.getElementById("usersTableBody");

    if (!tbody) {
        return;
    }


    if (users.length === 0) {

        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="empty-state">
                    No users created yet.
                </td>
            </tr>
        `;

        return;
    }


    tbody.innerHTML = users.map(function (user) {

        const role =
            formatRole(user.role);

        const statusClass =
            user.status === "active"
                ? "status-active"
                : "status-inactive";


        return `
            <tr>

                <td>
                    <strong>${escapeHTML(user.employee_id)}</strong>
                </td>

                <td>
                    ${escapeHTML(user.name)}
                </td>

                <td>
                    ${role}
                </td>

                <td>
                    ${escapeHTML(user.department || "-")}
                </td>

                <td>
                    <span class="status-badge ${statusClass}">
                        ${escapeHTML(user.status)}
                    </span>
                </td>

                <td>

                    <button
                        class="secondary-btn"
                        onclick="deleteUser('${user.id}')">
                        Delete
                    </button>

                </td>

            </tr>
        `;

    }).join("");

}


/* =========================================================
   FORMAT ROLE
   ========================================================= */

function formatRole(role) {

    const roles = {

        employee: "Hospital Employee",

        nurse: "Nurse",

        doctor: "Doctor",

        opd: "OPD Staff",

        ipd: "IPD Staff",

        pharmacy: "Medicine Store",

        billing: "Billing Staff"

    };


    return roles[role] || role;

}

// =========================================================
// DELETE USER
// =========================================================

async function deleteUser(id) {

    const confirmed = confirm(
        "Are you sure you want to permanently delete this account?"
    );

    if (!confirmed) {
        return;
    }


    try {

        // -------------------------------------------------
        // GET CURRENT ADMIN ID
        // -------------------------------------------------

        const adminUserId =
            localStorage.getItem("user_id") ||
            localStorage.getItem("userId") ||
            localStorage.getItem("admin_user_id") ||
            "ADM001";


        if (!adminUserId) {

            alert(
                "Admin session not found. Please login again."
            );

            return;
        }


        console.log(
            "DELETE USER REQUEST:",
            {
                database_id: id,
                admin_user_id: adminUserId
            }
        );


        // -------------------------------------------------
        // DELETE FROM DATABASE
        // -------------------------------------------------

        const response = await fetch(
            `http://127.0.0.1:5000/api/admin/user/${Number(id)}`,
            {
                method: "DELETE",

                headers: {
                    "Content-Type":
                        "application/json",

                    "Accept":
                        "application/json"
                },

                body: JSON.stringify({
                    admin_user_id:
                        adminUserId
                })
            }
        );


        // -------------------------------------------------
        // READ RESPONSE
        // -------------------------------------------------

        const result =
            await response.json();


        console.log(
            "DELETE USER RESPONSE:",
            result
        );


        // -------------------------------------------------
        // ERROR
        // -------------------------------------------------

        if (
            !response.ok ||
            !result.success
        ) {

            throw new Error(
                result.message ||
                result.error ||
                "Unable to delete account."
            );
        }


        // -------------------------------------------------
        // REMOVE FROM FRONTEND ARRAY
        // -------------------------------------------------

        users = users.filter(
            function (user) {

                return Number(user.id) !==
                    Number(id);

            }
        );


        // -------------------------------------------------
        // UPDATE LOCAL STORAGE
        // -------------------------------------------------

        localStorage.setItem(
            "medimatrix_users",
            JSON.stringify(users)
        );


        // -------------------------------------------------
        // REFRESH TABLE
        // -------------------------------------------------

        renderUsers();

        updateDashboard();


        // -------------------------------------------------
        // SUCCESS
        // -------------------------------------------------

        alert(
            result.message ||
            "Account deleted successfully."
        );


        console.log(
            "USER DELETED SUCCESSFULLY:",
            result.deleted_user
        );


    } catch (error) {

        console.error(
            "DELETE USER ERROR:",
            error
        );


        alert(
            error.message ||
            "Unable to delete user account."
        );

    }
}


/* =========================================================
   SEARCH USERS
   ========================================================= */

function filterUsers() {

    const search =
        document
            .getElementById("userSearch")
            .value
            .toLowerCase();


    const role =
        document
            .getElementById("roleFilter")
            .value;


    const tbody =
        document.getElementById("usersTableBody");


    const filtered =
        users.filter(function (user) {

            const matchesSearch =
                user.name
                    .toLowerCase()
                    .includes(search) ||

                user.employee_id
                    .toLowerCase()
                    .includes(search) ||

                user.username
                    .toLowerCase()
                    .includes(search);


            const matchesRole =
                !role ||
                user.role === role;


            return matchesSearch && matchesRole;

        });


    if (filtered.length === 0) {

        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="empty-state">
                    No matching users found.
                </td>
            </tr>
        `;

        return;
    }


    tbody.innerHTML =
        filtered.map(function (user) {

            const statusClass =
                user.status === "active"
                    ? "status-active"
                    : "status-inactive";


            return `
                <tr>

                    <td>
                        <strong>
                            ${escapeHTML(user.employee_id)}
                        </strong>
                    </td>

                    <td>
                        ${escapeHTML(user.name)}
                    </td>

                    <td>
                        ${formatRole(user.role)}
                    </td>

                    <td>
                        ${escapeHTML(user.department || "-")}
                    </td>

                    <td>
                        <span class="status-badge ${statusClass}">
                            ${escapeHTML(user.status)}
                        </span>
                    </td>

                    <td>
                        <button
                            class="secondary-btn"
                            onclick="deleteUser(${Number(user.id)})"
                            Delete
                        </button>
                    </td>

                </tr>
            `;

        }).join("");

}


/* =========================================================
   PATIENTS
   ========================================================= */

function renderPatients() {

    const tbody =
        document.getElementById("patientsTableBody");

    if (!tbody) {
        return;
    }


    if (patients.length === 0) {

        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="empty-state">
                    No patient records available.
                </td>
            </tr>
        `;

        return;
    }


    tbody.innerHTML =
        patients.map(function (patient) {

            return `
                <tr>

                    <td>
                        ${escapeHTML(patient.patient_id || "-")}
                    </td>

                    <td>
                        ${escapeHTML(patient.name || "-")}
                    </td>

                    <td>
                        ${escapeHTML(String(patient.age || "-"))}
                    </td>

                    <td>
                        ${escapeHTML(patient.gender || "-")}
                    </td>

                    <td>
                        ${escapeHTML(patient.department || "-")}
                    </td>

                    <td>
                        ${escapeHTML(patient.priority || "Normal")}
                    </td>

                    <td>
                        ${escapeHTML(patient.status || "Registered")}
                    </td>

                </tr>
            `;

        }).join("");

}


/* =========================================================
   DASHBOARD STATISTICS
   ========================================================= */

function updateDashboard() {

    const totalUsers =
        document.getElementById("totalUsers");

    const totalPatients =
        document.getElementById("totalPatients");

    const emergencyCases =
        document.getElementById("emergencyCases");

    const reportPatients =
        document.getElementById("reportPatients");

    const reportEmergency =
        document.getElementById("reportEmergency");


    if (totalUsers) {
        totalUsers.textContent =
            users.length;
    }


    if (totalPatients) {
        totalPatients.textContent =
            patients.length;
    }


    const emergencyCount =
        patients.filter(function (patient) {

            return (
                patient.priority &&
                patient.priority.toLowerCase() ===
                "emergency"
            );

        }).length;


    if (emergencyCases) {
        emergencyCases.textContent =
            emergencyCount;
    }


    if (reportPatients) {
        reportPatients.textContent =
            patients.length;
    }


    if (reportEmergency) {
        reportEmergency.textContent =
            emergencyCount;
    }

}


/* =========================================================
   NOTIFICATIONS
   ========================================================= */

function markAllRead() {

    document
        .querySelectorAll(".notification-card")
        .forEach(function (notification) {

            notification.classList.remove("unread");

        });


    const notificationCount =
        document.querySelector(".notification-count");

    if (notificationCount) {
        notificationCount.textContent = "0";
    }


    const topCount =
        document.querySelector(".notification-btn span");

    if (topCount) {
        topCount.textContent = "0";
    }

}


/* =========================================================
   LOGOUT
   ========================================================= */

function logout() {

    const confirmed =
        confirm(
            "Are you sure you want to logout?"
        );


    if (!confirmed) {
        return;
    }


    /*
     * Later we will clear the Flask session/token here.
     */

    window.location.href = "login.html";

}


/* =========================================================
   HTML SECURITY
   ========================================================= */

function escapeHTML(value) {

    if (value === null || value === undefined) {
        return "";
    }


    return String(value)

        .replace(/&/g, "&amp;")

        .replace(/</g, "&lt;")

        .replace(/>/g, "&gt;")

        .replace(/"/g, "&quot;")

        .replace(/'/g, "&#039;");

}

/* =========================================================
   ADMIN PROFILE
   ========================================================= */

let adminProfile = JSON.parse(
    localStorage.getItem("medimatrix_admin_profile") ||
    "null"
);


/* DEFAULT PROFILE */

const defaultAdminProfile = {

    name: "MediMatrix Admin",

    mobile: "",

    email: "",

    username: "admin",

    profileImage: "images/default-profile.png"

};


/* LOAD PROFILE */

function loadAdminProfile() {

    if (!adminProfile) {

        adminProfile = {
            ...defaultAdminProfile
        };

    }


    const name =
        document.getElementById("profileName");

    const mobile =
        document.getElementById("profileMobile");

    const email =
        document.getElementById("profileEmail");

    const username =
        document.getElementById("profileUsername");

    const image =
        document.getElementById("profileImage");

    const displayName =
        document.getElementById("profileDisplayName");


    if (name) {
        name.value =
            adminProfile.name || "";
    }

    if (mobile) {
        mobile.value =
            adminProfile.mobile || "";
    }

    if (email) {
        email.value =
            adminProfile.email || "";
    }

    if (username) {
        username.value =
            adminProfile.username || "admin";
    }

    if (image && adminProfile.profileImage) {
        image.src =
            adminProfile.profileImage;
    }

    if (displayName) {
        displayName.textContent =
            adminProfile.name ||
            "MediMatrix Admin";
    }

    updateAdminProfileUI();

}


/* PROFILE IMAGE */

function setupProfileImage() {

    const input =
        document.getElementById("profilePhotoInput");

    if (!input) {
        return;
    }


    input.addEventListener(
        "change",
        function (event) {

            const file =
                event.target.files[0];

            if (!file) {
                return;
            }


            if (file.size > 2 * 1024 * 1024) {

                alert(
                    "Profile picture must be less than 2 MB."
                );

                input.value = "";

                return;
            }


            if (!file.type.startsWith("image/")) {

                alert(
                    "Please select a valid image."
                );

                input.value = "";

                return;
            }


            const reader =
                new FileReader();


            reader.onload =
                function (e) {

                    const image =
                        document.getElementById(
                            "profileImage"
                        );

                    if (image) {
                        image.src =
                            e.target.result;
                    }

                };


            reader.readAsDataURL(file);

        }
    );

}


/* SAVE PROFILE */

function setupAdminProfileForm() {

    const form =
        document.getElementById(
            "adminProfileForm"
        );

    if (!form) {
        return;
    }


    form.addEventListener(
        "submit",
        function (event) {

            event.preventDefault();


            const name =
                document
                    .getElementById("profileName")
                    .value
                    .trim();

            const mobile =
                document
                    .getElementById("profileMobile")
                    .value
                    .trim();

            const email =
                document
                    .getElementById("profileEmail")
                    .value
                    .trim();

            const currentPassword =
                document
                    .getElementById("currentPassword")
                    .value;

            const newPassword =
                document
                    .getElementById("newPassword")
                    .value;

            const confirmPassword =
                document
                    .getElementById("confirmPassword")
                    .value;

            const image =
                document
                    .getElementById("profileImage");


            if (!name) {

                showProfileMessage(
                    "Please enter your name.",
                    "error"
                );

                return;
            }


            if (mobile && !/^[0-9]{10}$/.test(mobile)) {

                showProfileMessage(
                    "Please enter a valid 10-digit mobile number.",
                    "error"
                );

                return;
            }


            if (!email) {

                showProfileMessage(
                    "Please enter your email address.",
                    "error"
                );

                return;
            }


            /*
             * PASSWORD VALIDATION
             */

            if (
                currentPassword ||
                newPassword ||
                confirmPassword
            ) {

                if (!currentPassword) {

                    showProfileMessage(
                        "Enter your current password.",
                        "error"
                    );

                    return;
                }


                if (!newPassword) {

                    showProfileMessage(
                        "Enter a new password.",
                        "error"
                    );

                    return;
                }


                if (newPassword !== confirmPassword) {

                    showProfileMessage(
                        "New passwords do not match.",
                        "error"
                    );

                    return;
                }


                if (newPassword.length < 6) {

                    showProfileMessage(
                        "Password must contain at least 6 characters.",
                        "error"
                    );

                    return;
                }

            }


            adminProfile.name =
                name;

            adminProfile.mobile =
                mobile;

            adminProfile.email =
                email;


            if (image) {

                adminProfile.profileImage =
                    image.src;

            }


            localStorage.setItem(
                "medimatrix_admin_profile",
                JSON.stringify(adminProfile)
            );


            updateAdminProfileUI();


            showProfileMessage(
                "Profile updated successfully.",
                "success"
            );


            document.getElementById(
                "currentPassword"
            ).value = "";

            document.getElementById(
                "newPassword"
            ).value = "";

            document.getElementById(
                "confirmPassword"
            ).value = "";

        }
    );

}


/* UPDATE SIDEBAR + TOPBAR */

function updateAdminProfileUI() {

    const name =
        adminProfile.name ||
        "MediMatrix Admin";


    const sidebarName =
        document.getElementById(
            "sidebarAdminName"
        );

    const topName =
        document.getElementById(
            "topAdminName"
        );

    const sidebarAvatar =
        document.getElementById(
            "sidebarAdminAvatar"
        );

    const topAvatar =
        document.getElementById(
            "topAdminAvatar"
        );


    if (sidebarName) {
        sidebarName.textContent =
            name;
    }

    if (topName) {
        topName.textContent =
            name;
    }


    const firstLetter =
        name
            .charAt(0)
            .toUpperCase();


    if (
        sidebarAvatar &&
        !adminProfile.profileImage
    ) {
        sidebarAvatar.textContent =
            firstLetter;
    }

    if (
        topAvatar &&
        !adminProfile.profileImage
    ) {
        topAvatar.textContent =
            firstLetter;
    }

}


/* PROFILE MESSAGE */

function showProfileMessage(
    message,
    type
) {

    const box =
        document.getElementById(
            "profileMessage"
        );

    if (!box) {
        return;
    }


    box.textContent =
        message;

    box.className =
        "form-message " + type;


    setTimeout(
        function () {

            box.className =
                "form-message";

        },
        5000
    );

}


/* RESET PROFILE */

function resetAdminProfile() {

    loadAdminProfile();

    document.getElementById(
        "currentPassword"
    ).value = "";

    document.getElementById(
        "newPassword"
    ).value = "";

    document.getElementById(
        "confirmPassword"
    ).value = "";

}


/* INITIALIZE PROFILE */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        loadAdminProfile();

        setupProfileImage();

        setupAdminProfileForm();

    }
);