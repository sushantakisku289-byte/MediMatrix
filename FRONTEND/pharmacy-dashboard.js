/* ============================================================
   MEDIMATRIX PHARMACY DASHBOARD
============================================================ */

"use strict";


/* ============================================================
   CONFIGURATION
============================================================ */

const API_BASE_URL = "http://127.0.0.1:5000";

const PHARMACY_API =
    `${API_BASE_URL}/api/pharmacy`;

const PRESCRIPTION_API =
    `${API_BASE_URL}/api/prescriptions`;


/* ============================================================
   GLOBAL DATA
============================================================ */

let pendingPrescriptions = [];

let medicines = [];

let selectedPrescription = null;


/* ============================================================
   PAGE INITIALIZATION
============================================================ */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        loadPharmacyProfile();

        loadPharmacyDashboard();

        setInterval(
            loadPendingPrescriptions,
            30000
        );

    }
);


/* ============================================================
   PROFILE
============================================================ */

function loadPharmacyProfile() {

    let user = {};

    try {

        user = JSON.parse(
            localStorage.getItem("currentUser") ||
            localStorage.getItem("user") ||
            localStorage.getItem("pharmacy") ||
            "{}"
        );

    } catch (error) {

        console.error(
            "Unable to load pharmacy profile:",
            error
        );

        user = {};

    }


    const name =
        user.full_name ||
        user.name ||
        user.username ||
        user.employee_name ||
        "Pharmacy";


    const sidebarName =
        document.getElementById(
            "sidebarPharmacyName"
        );

    if (sidebarName) {

        sidebarName.textContent =
            name;

    }


    const topName =
        document.getElementById(
            "topPharmacyName"
        );

    if (topName) {

        topName.textContent =
            name;

    }


    const profileName =
        document.getElementById(
            "profilePharmacyName"
        );

    if (profileName) {

        profileName.textContent =
            name;

    }

}


/* ============================================================
   LOAD DASHBOARD
============================================================ */

async function loadPharmacyDashboard() {

    try {

        await Promise.all([
            loadPendingPrescriptions(),
            loadMedicines()
        ]);

        updateDashboardStatistics();

        renderDashboardPrescriptions();

    } catch (error) {

        console.error(
            "Pharmacy dashboard loading error:",
            error
        );

        showToast(
            "Unable to load pharmacy data.",
            "error"
        );

    }

}


/* ============================================================
   LOAD PENDING PRESCRIPTIONS
============================================================ */

async function loadPendingPrescriptions() {

    try {

        const response = await fetch(
            `${PHARMACY_API}/prescriptions`,
            {
                method: "GET",
                headers: {
                    "Accept": "application/json"
                }
            }
        );


        if (!response.ok) {

            throw new Error(
                `HTTP ${response.status}`
            );

        }


        const data =
            await response.json();


        if (!data.success) {

            throw new Error(
                data.message ||
                "Unable to load prescriptions."
            );

        }


        pendingPrescriptions =
            Array.isArray(
                data.prescriptions
            )
                ? data.prescriptions
                : [];


        renderPrescriptionTable();

        renderDashboardPrescriptions();

        updateDashboardStatistics();

        updatePendingCounters();


    } catch (error) {

        console.error(
            "Prescription loading error:",
            error
        );


        const body =
            document.getElementById(
                "prescriptionTableBody"
            );

        if (body) {

            body.innerHTML = `
                <tr>
                    <td
                        colspan="8"
                        class="empty-table"
                    >
                        Unable to load prescriptions.
                    </td>
                </tr>
            `;

        }

    }

}


/* ============================================================
   LOAD MEDICINES
============================================================ */

async function loadMedicines() {

    try {

        const response = await fetch(
            `${PHARMACY_API}/medicines`,
            {
                method: "GET",
                headers: {
                    "Accept": "application/json"
                }
            }
        );


        if (!response.ok) {

            throw new Error(
                `HTTP ${response.status}`
            );

        }


        const data =
            await response.json();


        if (!data.success) {

            throw new Error(
                data.message ||
                "Unable to load medicines."
            );

        }


        medicines =
            Array.isArray(
                data.medicines
            )
                ? data.medicines
                : [];


        renderMedicineTable();

        updateInventoryStatistics();


    } catch (error) {

        console.error(
            "Medicine loading error:",
            error
        );


        const body =
            document.getElementById(
                "medicineTableBody"
            );

        if (body) {

            body.innerHTML = `
                <tr>
                    <td
                        colspan="8"
                        class="empty-table"
                    >
                        Unable to load medicine inventory.
                    </td>
                </tr>
            `;

        }

    }

}


/* ============================================================
   DASHBOARD STATISTICS
============================================================ */

function updateDashboardStatistics() {

    const pending =
        pendingPrescriptions.filter(
            prescription =>
                prescription.status ===
                "PENDING_PHARMACY"
        ).length;


    const processing =
        pendingPrescriptions.filter(
            prescription =>
                prescription.status ===
                    "PROCESSING" ||
                prescription.status ===
                    "PHARMACY_PROCESSING"
        ).length;


    const pendingElement =
        document.getElementById(
            "pendingPrescriptionStat"
        );

    if (pendingElement) {

        pendingElement.textContent =
            pending;

    }


    const processingElement =
        document.getElementById(
            "processingPrescriptionStat"
        );

    if (processingElement) {

        processingElement.textContent =
            processing;

    }


    const medicineElement =
        document.getElementById(
            "medicineCountStat"
        );

    if (medicineElement) {

        medicineElement.textContent =
            medicines.length;

    }


    const dispensedTodayElement =
        document.getElementById(
            "dispensedTodayStat"
        );

    if (dispensedTodayElement) {

        dispensedTodayElement.textContent =
            "—";

    }

}


/* ============================================================
   COUNTERS
============================================================ */

function updatePendingCounters() {

    const count =
        pendingPrescriptions.filter(
            prescription =>
                prescription.status ===
                "PENDING_PHARMACY"
        ).length;


    const sidebar =
        document.getElementById(
            "sidebarPendingCount"
        );

    if (sidebar) {

        sidebar.textContent =
            count;

    }


    const notification =
        document.getElementById(
            "notificationCount"
        );

    if (notification) {

        notification.textContent =
            count;

    }

}


/* ============================================================
   DASHBOARD PRESCRIPTION TABLE
============================================================ */

function renderDashboardPrescriptions() {

    const body =
        document.getElementById(
            "dashboardPrescriptionTable"
        );

    if (!body) {
        return;
    }


    const records =
        pendingPrescriptions.slice(
            0,
            5
        );


    if (!records.length) {

        body.innerHTML = `
            <tr>
                <td
                    colspan="6"
                    class="empty-table"
                >
                    No pending prescriptions.
                </td>
            </tr>
        `;

        return;

    }


    body.innerHTML =
        records.map(
            prescription => {

                const treatment =
                    escapeHtml(
                        prescription.treatment_type ||
                        "—"
                    );


                const patient =
                    escapeHtml(
                        prescription.patient_name ||
                        prescription.patient ||
                        "Patient"
                    );


                const patientId =
                    escapeHtml(
                        prescription.patient_id ||
                        "—"
                    );


                return `
                    <tr>

                        <td>
                            <strong>
                                RX-${String(
                                    prescription.id
                                ).padStart(4, "0")}
                            </strong>
                        </td>

                        <td>
                            ${patient}
                        </td>

                        <td>
                            ${patientId}
                        </td>

                        <td>
                            ${treatment}
                        </td>

                        <td>
                            ${getStatusBadge(
                                prescription.status
                            )}
                        </td>

                        <td>

                            <button
                                class="action-btn"
                                onclick="openPrescription(
                                    ${Number(
                                        prescription.id
                                    )}
                                )"
                            >
                                View
                            </button>

                        </td>

                    </tr>
                `;

            }
        ).join("");

}


/* ============================================================
   PRESCRIPTION TABLE
============================================================ */

function renderPrescriptionTable() {

    const body =
        document.getElementById(
            "prescriptionTableBody"
        );

    if (!body) {
        return;
    }


    if (!pendingPrescriptions.length) {

        body.innerHTML = `
            <tr>
                <td
                    colspan="8"
                    class="empty-table"
                >
                    No prescriptions are currently waiting
                    for pharmacy processing.
                </td>
            </tr>
        `;

        return;

    }


    body.innerHTML =
        pendingPrescriptions.map(
            prescription => {

                const medicinesList =
                    parseMedicines(
                        prescription.medicines
                    );


                const medicineCount =
                    medicinesList.length;


                const doctor =
                    prescription.doctor_name ||
                    prescription.doctor ||
                    prescription.doctor_user_id ||
                    "—";


                return `
                    <tr
                        data-prescription-row="true"
                        data-search="
                            ${escapeHtml(
                                prescription.id
                            )}
                            ${escapeHtml(
                                prescription.patient_id || ""
                            )}
                            ${escapeHtml(
                                prescription.patient_name || ""
                            )}
                            ${escapeHtml(
                                doctor
                            )}
                        "
                        data-status="
                            ${escapeHtml(
                                prescription.status || ""
                            )}
                        "
                    >

                        <td>

                            <strong>
                                RX-${String(
                                    prescription.id
                                ).padStart(4, "0")}
                            </strong>

                            <small class="table-date">
                                ${formatDate(
                                    prescription.created_at
                                )}
                            </small>

                        </td>


                        <td>
                            ${escapeHtml(
                                prescription.patient_name ||
                                prescription.patient ||
                                "Patient"
                            )}
                        </td>


                        <td>
                            ${escapeHtml(
                                prescription.patient_id ||
                                "—"
                            )}
                        </td>


                        <td>
                            ${escapeHtml(
                                doctor
                            )}
                        </td>


                        <td>

                            <span class="treatment-pill">
                                ${escapeHtml(
                                    prescription.treatment_type ||
                                    "—"
                                )}
                            </span>

                        </td>


                        <td>
                            ${medicineCount}
                            medicine${medicineCount === 1 ? "" : "s"}
                        </td>


                        <td>
                            ${getStatusBadge(
                                prescription.status
                            )}
                        </td>


                        <td>

                            <button
                                class="action-btn"
                                onclick="openPrescription(
                                    ${Number(
                                        prescription.id
                                    )}
                                )"
                            >
                                View
                            </button>

                        </td>

                    </tr>
                `;

            }
        ).join("");

}


/* ============================================================
   OPEN PRESCRIPTION
============================================================ */

async function openPrescription(
    prescriptionId
) {

    try {

        const response =
            await fetch(
                `${PRESCRIPTION_API}/${prescriptionId}`,
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
                `HTTP ${response.status}`
            );

        }


        const data =
            await response.json();


        if (!data.success) {

            throw new Error(
                data.message ||
                "Unable to load prescription."
            );

        }


        selectedPrescription =
            data.prescription;


        renderPrescriptionDetails(
            selectedPrescription
        );


        const modal =
            document.getElementById(
                "prescriptionModal"
            );

        if (modal) {

            modal.classList.add("show");

        }


    } catch (error) {

        console.error(
            "Prescription details error:",
            error
        );

        showToast(
            "Unable to open prescription.",
            "error"
        );

    }

}


/* ============================================================
   RENDER PRESCRIPTION DETAILS
============================================================ */

function renderPrescriptionDetails(
    prescription
) {

    const container =
        document.getElementById(
            "prescriptionModalContent"
        );

    if (!container) {
        return;
    }


    const medicinesList =
        parseMedicines(
            prescription.medicines
        );


    const medicineHtml =
        medicinesList.length

            ? medicinesList.map(
                (medicine, index) => {

                    const name =
                        medicine.name ||
                        medicine.medicine_name ||
                        medicine.medicine ||
                        `Medicine ${index + 1}`;


                    const dosage =
                        medicine.dosage ||
                        medicine.dose ||
                        "—";


                    const frequency =
                        medicine.frequency ||
                        medicine.schedule ||
                        "—";


                    const duration =
                        medicine.duration ||
                        "—";


                    return `
                        <div class="medicine-item">

                            <div>

                                <strong>
                                    ${escapeHtml(
                                        name
                                    )}
                                </strong>

                                <span>
                                    Dosage:
                                    ${escapeHtml(
                                        dosage
                                    )}
                                </span>

                            </div>

                            <div>

                                <span>
                                    Frequency:
                                    ${escapeHtml(
                                        frequency
                                    )}
                                </span>

                                <span>
                                    Duration:
                                    ${escapeHtml(
                                        duration
                                    )}
                                </span>

                            </div>

                        </div>
                    `;

                }
            ).join("")

            : `
                <div class="detail-text">
                    No medicines recorded.
                </div>
            `;


    container.innerHTML = `

        <div class="detail-grid">

            <div class="detail-item">

                <span>
                    Prescription Number
                </span>

                <strong>
                    RX-${String(
                        prescription.id
                    ).padStart(4, "0")}
                </strong>

            </div>


            <div class="detail-item">

                <span>
                    Status
                </span>

                ${getStatusBadge(
                    prescription.status
                )}

            </div>


            <div class="detail-item">

                <span>
                    Patient ID
                </span>

                <strong>
                    ${escapeHtml(
                        prescription.patient_id ||
                        "—"
                    )}
                </strong>

            </div>


            <div class="detail-item">

                <span>
                    Doctor ID
                </span>

                <strong>
                    ${escapeHtml(
                        prescription.doctor_user_id ||
                        "—"
                    )}
                </strong>

            </div>


            <div class="detail-item">

                <span>
                    Treatment Type
                </span>

                <strong>
                    ${escapeHtml(
                        prescription.treatment_type ||
                        "—"
                    )}
                </strong>

            </div>


            <div class="detail-item">

                <span>
                    Created
                </span>

                <strong>
                    ${formatDate(
                        prescription.created_at
                    )}
                </strong>

            </div>

        </div>


        <div class="detail-section">

            <h3>
                Diagnosis
            </h3>

            <div class="detail-text">

                ${escapeHtml(
                    prescription.diagnosis ||
                    "No diagnosis provided."
                )}

            </div>

        </div>


        <div class="detail-section">

            <h3>
                Medicines
            </h3>

            <div class="medicine-list">

                ${medicineHtml}

            </div>

        </div>


        <div class="detail-section">

            <h3>
                Consultation Notes
            </h3>

            <div class="detail-text">

                ${escapeHtml(
                    prescription.consultation_notes ||
                    "No consultation notes."
                )}

            </div>

        </div>


        <div class="detail-section">

            <h3>
                Instructions
            </h3>

            <div class="detail-text">

                ${escapeHtml(
                    prescription.instructions ||
                    "No special instructions."
                )}

            </div>

        </div>

    `;


    const dispenseButton =
        document.getElementById(
            "dispensePrescriptionBtn"
        );


    if (dispenseButton) {

        const status =
            String(
                prescription.status ||
                ""
            ).toUpperCase();


        dispenseButton.style.display =
            status ===
                "PENDING_PHARMACY"
                ? "inline-block"
                : "none";

    }

}


/* ============================================================
   DISPENSE PRESCRIPTION
============================================================ */

async function dispenseSelectedPrescription() {

    if (!selectedPrescription) {

        showToast(
            "No prescription selected.",
            "error"
        );

        return;

    }


    const prescriptionId =
        selectedPrescription.id;


    const confirmed =
        window.confirm(
            "Are you sure you want to dispense this prescription?"
        );


    if (!confirmed) {
        return;
    }


    const button =
        document.getElementById(
            "dispensePrescriptionBtn"
        );


    try {

        if (button) {

            button.disabled = true;

            button.textContent =
                "Processing...";

        }


        const response =
            await fetch(
                `${PHARMACY_API}/prescription/${prescriptionId}/dispense`,
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


        if (!response.ok ||
            !data.success) {

            throw new Error(
                data.message ||
                "Unable to dispense prescription."
            );

        }


        selectedPrescription =
            data.prescription;


        closePrescriptionModal();


        showToast(
            "Prescription dispensed successfully.",
            "success"
        );


        await loadPendingPrescriptions();


    } catch (error) {

        console.error(
            "Dispense error:",
            error
        );


        showToast(
            error.message ||
            "Unable to dispense prescription.",
            "error"
        );


    } finally {

        if (button) {

            button.disabled = false;

            button.textContent =
                "✓ Dispense Prescription";

        }

    }

}


/* ============================================================
   MEDICINE TABLE
============================================================ */

function renderMedicineTable() {

    const body =
        document.getElementById(
            "medicineTableBody"
        );

    if (!body) {
        return;
    }


    if (!medicines.length) {

        body.innerHTML = `
            <tr>
                <td
                    colspan="8"
                    class="empty-table"
                >
                    No medicines available in inventory.
                </td>
            </tr>
        `;

        return;

    }


    body.innerHTML =
        medicines.map(
            medicine => {

                const quantity =
                    Number(
                        medicine.quantity || 0
                    );


                const stockClass =
                    quantity === 0
                        ? "stock-danger"
                        : quantity <= 10
                            ? "stock-warning"
                            : "stock-good";


                return `
                    <tr
                        data-medicine-row="true"
                        data-search="
                            ${escapeHtml(
                                medicine.medicine_code || ""
                            )}
                            ${escapeHtml(
                                medicine.medicine_name || ""
                            )}
                            ${escapeHtml(
                                medicine.category || ""
                            )}
                        "
                    >

                        <td>
                            <strong>
                                ${escapeHtml(
                                    medicine.medicine_code ||
                                    "—"
                                )}
                            </strong>
                        </td>

                        <td>
                            ${escapeHtml(
                                medicine.medicine_name ||
                                "—"
                            )}
                        </td>

                        <td>
                            ${escapeHtml(
                                medicine.category ||
                                "—"
                            )}
                        </td>

                        <td>
                            ${escapeHtml(
                                medicine.manufacturer ||
                                "—"
                            )}
                        </td>

                        <td>
                            ${escapeHtml(
                                medicine.batch_number ||
                                "—"
                            )}
                        </td>

                        <td>
                            ${formatDateOnly(
                                medicine.expiry_date
                            )}
                        </td>

                        <td>

                            <span
                                class="${stockClass}"
                            >
                                ${quantity}
                            </span>

                        </td>

                        <td>
                            ₹${Number(
                                medicine.unit_price || 0
                            ).toFixed(2)}
                        </td>

                    </tr>
                `;

            }
        ).join("");

}


/* ============================================================
   INVENTORY STATISTICS
============================================================ */

function updateInventoryStatistics() {

    const total =
        medicines.length;


    const lowStock =
        medicines.filter(
            medicine =>
                Number(
                    medicine.quantity || 0
                ) > 0 &&
                Number(
                    medicine.quantity || 0
                ) <= 10
        ).length;


    const outOfStock =
        medicines.filter(
            medicine =>
                Number(
                    medicine.quantity || 0
                ) === 0
        ).length;


    const totalElement =
        document.getElementById(
            "inventoryTotal"
        );

    if (totalElement) {

        totalElement.textContent =
            total;

    }


    const lowElement =
        document.getElementById(
            "lowStockCount"
        );

    if (lowElement) {

        lowElement.textContent =
            lowStock;

    }


    const outElement =
        document.getElementById(
            "outOfStockCount"
        );

    if (outElement) {

        outElement.textContent =
            outOfStock;

    }

}


/* ============================================================
   SEARCH PRESCRIPTIONS
============================================================ */

function filterPrescriptionTable() {

    const searchInput =
        document.getElementById(
            "prescriptionSearch"
        );


    const statusInput =
        document.getElementById(
            "prescriptionStatusFilter"
        );


    const search =
        (
            searchInput?.value ||
            ""
        )
            .toLowerCase()
            .trim();


    const status =
        statusInput?.value ||
        "ALL";


    const rows =
        document.querySelectorAll(
            '[data-prescription-row="true"]'
        );


    rows.forEach(
        row => {

            const rowSearch =
                (
                    row.dataset.search ||
                    ""
                ).toLowerCase();


            const rowStatus =
                row.dataset.status ||
                "";


            const searchMatch =
                !search ||
                rowSearch.includes(
                    search
                );


            const statusMatch =
                status === "ALL" ||
                rowStatus === status;


            row.style.display =
                searchMatch &&
                statusMatch
                    ? ""
                    : "none";

        }
    );

}


/* ============================================================
   SEARCH MEDICINES
============================================================ */

function filterMedicineTable() {

    const input =
        document.getElementById(
            "medicineSearch"
        );


    const search =
        (
            input?.value ||
            ""
        )
            .toLowerCase()
            .trim();


    const rows =
        document.querySelectorAll(
            '[data-medicine-row="true"]'
        );


    rows.forEach(
        row => {

            const text =
                (
                    row.dataset.search ||
                    ""
                ).toLowerCase();


            row.style.display =
                !search ||
                text.includes(search)
                    ? ""
                    : "none";

        }
    );

}


/* ============================================================
   SECTION NAVIGATION
============================================================ */

function showPharmacySection(
    sectionId,
    clickedButton = null
) {

    document
        .querySelectorAll(
            ".page-section"
        )
        .forEach(
            section => {

                section.classList.remove(
                    "active-section"
                );

            }
        );


    const section =
        document.getElementById(
            sectionId
        );


    if (section) {

        section.classList.add(
            "active-section"
        );

    }


    document
        .querySelectorAll(
            ".menu-item"
        )
        .forEach(
            button => {

                button.classList.remove(
                    "active"
                );

            }
        );


    if (clickedButton) {

        clickedButton.classList.add(
            "active"
        );

    } else {

        const matchingButton =
            document.querySelector(
                `.menu-item[onclick*="'${sectionId}'"]`
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


    if (sectionId === "prescriptionsSection") {

        loadPendingPrescriptions();

    }


    if (sectionId === "inventorySection") {

        loadMedicines();

    }


    if (window.innerWidth <= 800) {

        document
            .querySelector(".sidebar")
            ?.classList.remove(
                "mobile-open"
            );

    }

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


    const subtitle =
        document.getElementById(
            "pageSubtitle"
        );


    const titles = {

        dashboardSection: [
            "Pharmacy Dashboard",
            "Manage prescriptions, medicines and dispensing"
        ],

        prescriptionsSection: [
            "Prescription Queue",
            "Review and dispense doctor prescriptions"
        ],

        inventorySection: [
            "Medicine Inventory",
            "Manage pharmacy medicine stock"
        ],

        dispensedSection: [
            "Dispensed Prescriptions",
            "View completed pharmacy dispensing"
        ],

        profileSection: [
            "Pharmacy Profile",
            "Pharmacy department information"
        ]

    };


    const values =
        titles[sectionId] ||
        titles.dashboardSection;


    if (title) {

        title.textContent =
            values[0];

    }


    if (subtitle) {

        subtitle.textContent =
            values[1];

    }

}


/* ============================================================
   ADD MEDICINE MODAL
============================================================ */

function openAddMedicineModal() {

    const modal =
        document.getElementById(
            "medicineModal"
        );


    if (modal) {

        modal.classList.add(
            "show"
        );

    }

}


function closeMedicineModal(
    event = null
) {

    if (
        event &&
        event.target !== event.currentTarget
    ) {
        return;
    }


    const modal =
        document.getElementById(
            "medicineModal"
        );


    if (modal) {

        modal.classList.remove(
            "show"
        );

    }

}


/* ============================================================
   ADD MEDICINE
============================================================ */

async function addMedicine(
    event
) {

    event.preventDefault();


    const payload = {

        medicine_code:
            document.getElementById(
                "medicineCode"
            ).value.trim(),

        medicine_name:
            document.getElementById(
                "medicineName"
            ).value.trim(),

        category:
            document.getElementById(
                "medicineCategory"
            ).value.trim(),

        manufacturer:
            document.getElementById(
                "medicineManufacturer"
            ).value.trim(),

        batch_number:
            document.getElementById(
                "medicineBatch"
            ).value.trim(),

        quantity:
            Number(
                document.getElementById(
                    "medicineQuantity"
                ).value || 0
            ),

        unit_price:
            Number(
                document.getElementById(
                    "medicinePrice"
                ).value || 0
            )

    };


    try {

        const response =
            await fetch(
                `${PHARMACY_API}/medicine`,
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


        const data =
            await response.json();


        if (!response.ok ||
            !data.success) {

            throw new Error(
                data.message ||
                "Unable to add medicine."
            );

        }


        showToast(
            "Medicine added successfully.",
            "success"
        );


        document
            .getElementById(
                "medicineForm"
            )
            .reset();


        closeMedicineModal();

        await loadMedicines();


    } catch (error) {

        console.error(
            "Add medicine error:",
            error
        );


        showToast(
            error.message ||
            "Unable to add medicine.",
            "error"
        );

    }

}


/* ============================================================
   PRESCRIPTION MODAL
============================================================ */

function closePrescriptionModal(
    event = null
) {

    if (
        event &&
        event.target !== event.currentTarget
    ) {
        return;
    }


    const modal =
        document.getElementById(
            "prescriptionModal"
        );


    if (modal) {

        modal.classList.remove(
            "show"
        );

    }


    selectedPrescription =
        null;

}


/* ============================================================
   REFRESH
============================================================ */

async function refreshPharmacyDashboard() {

    const button =
        document.querySelector(
            ".refresh-btn"
        );


    if (button) {

        button.classList.add(
            "loading"
        );

    }


    try {

        await loadPharmacyDashboard();

        showToast(
            "Pharmacy data refreshed.",
            "success"
        );

    } finally {

        if (button) {

            button.classList.remove(
                "loading"
            );

        }

    }

}


/* ============================================================
   MOBILE SIDEBAR
============================================================ */

function toggleSidebar() {

    document
        .querySelector(".sidebar")
        ?.classList.toggle(
            "mobile-open"
        );

}


/* ============================================================
   LOGOUT
============================================================ */

function logoutPharmacy() {

    const confirmed =
        window.confirm(
            "Are you sure you want to logout?"
        );


    if (!confirmed) {
        return;
    }


    localStorage.removeItem(
        "currentUser"
    );

    localStorage.removeItem(
        "user"
    );

    localStorage.removeItem(
        "pharmacy"
    );


    window.location.href =
        "login.html";

}


/* ============================================================
   STATUS BADGE
============================================================ */

function getStatusBadge(
    status
) {

    const normalized =
        String(
            status ||
            "UNKNOWN"
        )
            .toUpperCase();


    let className =
        "status-pending";


    let label =
        normalized
            .replaceAll(
                "_",
                " "
            );


    if (
        normalized ===
            "PROCESSING" ||
        normalized ===
            "PHARMACY_PROCESSING"
    ) {

        className =
            "status-processing";

    }


    if (
        normalized ===
            "DISPENSED"
    ) {

        className =
            "status-dispensed";

    }


    if (
        normalized ===
            "COMPLETED"
    ) {

        className =
            "status-completed";

    }


    if (
        normalized ===
            "PARTIAL"
    ) {

        className =
            "status-partial";

    }


    return `
        <span
            class="status-badge ${className}"
        >
            ${escapeHtml(label)}
        </span>
    `;

}


/* ============================================================
   MEDICINE JSON PARSER
============================================================ */

function parseMedicines(
    medicines
) {

    if (
        Array.isArray(
            medicines
        )
    ) {

        return medicines;

    }


    if (
        !medicines
    ) {

        return [];

    }


    if (
        typeof medicines ===
        "object"
    ) {

        return [medicines];

    }


    try {

        const parsed =
            JSON.parse(
                medicines
            );


        if (
            Array.isArray(
                parsed
            )
        ) {

            return parsed;

        }


        if (
            parsed &&
            typeof parsed === "object"
        ) {

            return [parsed];

        }


        return [];

    } catch (error) {

        console.warn(
            "Unable to parse prescription medicines:",
            error
        );

        return [];

    }

}


/* ============================================================
   DATE FORMAT
============================================================ */

function formatDate(
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

        return "—";

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


function formatDateOnly(
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

        return "—";

    }


    return date.toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );

}


/* ============================================================
   HTML ESCAPE
============================================================ */

function escapeHtml(
    value
) {

    return String(
        value ??
        ""
    )
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );

}


/* ============================================================
   TOAST
============================================================ */

let toastTimer = null;


function showToast(
    message,
    type = "success"
) {

    const toast =
        document.getElementById(
            "toast"
        );


    const text =
        document.getElementById(
            "toastMessage"
        );


    const icon =
        document.getElementById(
            "toastIcon"
        );


    if (!toast || !text) {
        return;
    }


    text.textContent =
        message;


    toast.classList.remove(
        "success",
        "error",
        "show"
    );


    toast.classList.add(
        type
    );


    if (icon) {

        icon.textContent =
            type === "error"
                ? "!"
                : "✓";

    }


    void toast.offsetWidth;


    toast.classList.add(
        "show"
    );


    clearTimeout(
        toastTimer
    );


    toastTimer =
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
   GLOBAL EXPORTS
============================================================ */

window.showPharmacySection =
    showPharmacySection;

window.loadPharmacyDashboard =
    loadPharmacyDashboard;

window.loadPendingPrescriptions =
    loadPendingPrescriptions;

window.loadMedicines =
    loadMedicines;

window.openPrescription =
    openPrescription;

window.dispenseSelectedPrescription =
    dispenseSelectedPrescription;

window.filterPrescriptionTable =
    filterPrescriptionTable;

window.filterMedicineTable =
    filterMedicineTable;

window.openAddMedicineModal =
    openAddMedicineModal;

window.closeMedicineModal =
    closeMedicineModal;

window.addMedicine =
    addMedicine;

window.closePrescriptionModal =
    closePrescriptionModal;

window.refreshPharmacyDashboard =
    refreshPharmacyDashboard;

window.toggleSidebar =
    toggleSidebar;

window.logoutPharmacy =
    logoutPharmacy;