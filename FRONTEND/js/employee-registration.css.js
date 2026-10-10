/* ============================================================
   MEDIMATRIX — EMPLOYEE REGISTRATION
============================================================ */

document.addEventListener("DOMContentLoaded", () => {

    const form =
        document.getElementById(
            "employeeRegistrationForm"
        );

    if (!form) {
        return;
    }


    const registerButton =
        document.getElementById(
            "registerButton"
        );

    const registerButtonText =
        document.getElementById(
            "registerButtonText"
        );

    const registrationMessage =
        document.getElementById(
            "registrationMessage"
        );


    /* ========================================================
       HELPERS
    ======================================================== */

    function getValue(id) {

        const element =
            document.getElementById(id);

        return element
            ? element.value.trim()
            : "";

    }


    function clearErrors() {

        document
            .querySelectorAll(".field-error")
            .forEach((element) => {

                element.textContent = "";

            });

        registrationMessage.className =
            "registration-message";

        registrationMessage.textContent = "";

    }


    function showError(
        elementId,
        message
    ) {

        const element =
            document.getElementById(
                elementId
            );

        if (element) {

            element.textContent =
                message;

        }

    }


    function showMessage(
        message,
        type
    ) {

        registrationMessage.textContent =
            message;

        registrationMessage.className =
            `registration-message ${type}`;

    }


    function setLoading(
        loading
    ) {

        registerButton.disabled =
            loading;

        if (loading) {

            registerButton.classList.add(
                "loading"
            );

            registerButtonText.textContent =
                "Submitting Registration...";

        } else {

            registerButton.classList.remove(
                "loading"
            );

            registerButtonText.textContent =
                "Submit Registration";

        }

    }


    /* ========================================================
       VALIDATION
    ======================================================== */

    function validateForm() {

        let valid = true;


        const fullName =
            getValue("fullName");

        const email =
            getValue("email");

        const mobile =
            getValue("mobile");

        const role =
            getValue("role");

        const department =
            getValue("department");

        const password =
            getValue("password");

        const confirmPassword =
            getValue("confirmPassword");

        const terms =
            document.getElementById(
                "terms"
            );


        /* ----------------------------------------------------
           FULL NAME
        ---------------------------------------------------- */

        if (!fullName) {

            showError(
                "fullNameError",
                "Full name is required."
            );

            valid = false;

        } else if (fullName.length < 3) {

            showError(
                "fullNameError",
                "Enter a valid full name."
            );

            valid = false;

        }


        /* ----------------------------------------------------
           EMAIL
        ---------------------------------------------------- */

        const emailPattern =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


        if (!email) {

            showError(
                "emailError",
                "Email address is required."
            );

            valid = false;

        } else if (
            !emailPattern.test(email)
        ) {

            showError(
                "emailError",
                "Enter a valid email address."
            );

            valid = false;

        }


        /* ----------------------------------------------------
           MOBILE
        ---------------------------------------------------- */

        const mobilePattern =
            /^[6-9][0-9]{9}$/;


        if (!mobile) {

            showError(
                "mobileError",
                "Mobile number is required."
            );

            valid = false;

        } else if (
            !mobilePattern.test(mobile)
        ) {

            showError(
                "mobileError",
                "Enter a valid 10-digit mobile number."
            );

            valid = false;

        }


        /* ----------------------------------------------------
           ROLE
        ---------------------------------------------------- */

        if (!role) {

            showError(
                "roleError",
                "Select an employee role."
            );

            valid = false;

        }


        /* ----------------------------------------------------
           DEPARTMENT
        ---------------------------------------------------- */

        if (!department) {

            showError(
                "departmentError",
                "Select a department."
            );

            valid = false;

        }


        /* ----------------------------------------------------
           PASSWORD
        ---------------------------------------------------- */

        if (!password) {

            showError(
                "passwordError",
                "Password is required."
            );

            valid = false;

        } else if (
            password.length < 6
        ) {

            showError(
                "passwordError",
                "Password must contain at least 6 characters."
            );

            valid = false;

        }


        /* ----------------------------------------------------
           CONFIRM PASSWORD
        ---------------------------------------------------- */

        if (!confirmPassword) {

            showError(
                "confirmPasswordError",
                "Please confirm your password."
            );

            valid = false;

        } else if (
            password !== confirmPassword
        ) {

            showError(
                "confirmPasswordError",
                "Passwords do not match."
            );

            valid = false;

        }


        /* ----------------------------------------------------
           TERMS
        ---------------------------------------------------- */

        if (
            !terms ||
            !terms.checked
        ) {

            showError(
                "termsError",
                "Please confirm the information provided."
            );

            valid = false;

        }


        return valid;

    }


    /* ========================================================
       SUBMIT REGISTRATION
    ======================================================== */

    form.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();

            clearErrors();


            /* ------------------------------------------------
               VALIDATE
            ------------------------------------------------ */

            if (!validateForm()) {

                return;

            }


            /* ------------------------------------------------
               BUILD PAYLOAD
            ------------------------------------------------ */

            const payload = {

                full_name:
                    getValue("fullName"),

                email:
                    getValue("email"),

                mobile:
                    getValue("mobile"),

                role:
                    getValue("role"),

                department:
                    getValue("department"),

                password:
                    getValue("password")

            };


            /* ------------------------------------------------
               LOADING
            ------------------------------------------------ */

            setLoading(true);


            try {

                const response =
                    await fetch(
                        "/api/employee/register",
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


                let result = {};

                try {

                    result =
                        await response.json();

                } catch (
                    jsonError
                ) {

                    result = {

                        success: false,

                        message:
                            "Invalid server response."

                    };

                }


                /* --------------------------------------------
                   SERVER ERROR
                -------------------------------------------- */

                if (
                    !response.ok ||
                    !result.success
                ) {

                    showMessage(

                        result.message ||
                        "Employee registration failed.",

                        "error"

                    );

                    console.error(
                        "Registration error:",
                        result
                    );

                    return;

                }


                /* --------------------------------------------
                   SUCCESS
                -------------------------------------------- */

                showMessage(

                    "Registration submitted successfully. " +
                    "The administrator has been notified.",

                    "success"

                );


                console.log(
                    "Employee registration:",
                    result
                );


                /* --------------------------------------------
                   RESET FORM
                -------------------------------------------- */

                form.reset();


                /*
                 * Notification is created by Flask.
                 *
                 * The frontend does NOT create the
                 * Admin notification itself.
                 *
                 * Backend:
                 *
                 * Employee registration
                 *        ↓
                 * Notification created
                 *        ↓
                 * Admin notification bell
                 */

            } catch (error) {

                console.error(
                    "Registration request failed:",
                    error
                );


                showMessage(

                    "Unable to connect to the server. " +
                    "Please try again.",

                    "error"

                );

            } finally {

                setLoading(false);

            }

        }
    );


    /* ========================================================
       MOBILE NUMBER — NUMBERS ONLY
    ======================================================== */

    const mobileInput =
        document.getElementById(
            "mobile"
        );


    if (mobileInput) {

        mobileInput.addEventListener(
            "input",
            () => {

                mobileInput.value =
                    mobileInput.value
                        .replace(/\D/g, "")
                        .slice(0, 10);

            }
        );

    }


    /* ========================================================
       PASSWORD LIVE CHECK
    ======================================================== */

    const passwordInput =
        document.getElementById(
            "password"
        );

    const confirmPasswordInput =
        document.getElementById(
            "confirmPassword"
        );


    if (
        passwordInput &&
        confirmPasswordInput
    ) {

        confirmPasswordInput.addEventListener(
            "input",
            () => {

                const password =
                    passwordInput.value;

                const confirmPassword =
                    confirmPasswordInput.value;

                const error =
                    document.getElementById(
                        "confirmPasswordError"
                    );


                if (
                    confirmPassword &&
                    password !== confirmPassword
                ) {

                    error.textContent =
                        "Passwords do not match.";

                } else {

                    error.textContent =
                        "";

                }

            }
        );

    }

});