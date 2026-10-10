"use strict";

const API_BASE_URL = "http://127.0.0.1:5000";

let ipdRequests = [];
let availableBeds = [];
let selectedAdmission = null;
let currentReceipt = null;


/* =========================================================
   INITIALIZATION
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    console.log("MediMatrix Billing Dashboard JS loaded successfully");

    loadBillingProfile();

    loadAllBillingData();

    loadNotifications();

});


/* =========================================================
   NAVIGATION
========================================================= */

function showBillingSection(sectionId, button = null) {

    document.querySelectorAll(".content-section").forEach(section => {
        section.classList.remove("active-section");
    });

    const section = document.getElementById(sectionId);

    if (!section) {
        console.warn("Billing section not found:", sectionId);
        return;
    }

    section.classList.add("active-section");


    document.querySelectorAll(".nav-item").forEach(item => {
        item.classList.remove("active");
    });

    if (button) {
        button.classList.add("active");
    }


    if (sectionId === "ipdBillingSection") {
        loadIPDRequests();
    }

    if (sectionId === "bedsSection") {
        loadBeds();
    }

    if (sectionId === "notificationsSection") {
        loadNotifications();
    }

}


/* =========================================================
   GLOBAL LOAD
========================================================= */

async function loadAllBillingData() {

    await Promise.allSettled([
        loadIPDRequests(),
        loadBeds(),
        loadNotifications()
    ]);

}


/* =========================================================
   IPD REQUESTS
========================================================= */

async function loadIPDRequests() {

    const container =
        document.getElementById("ipdRequestsContainer");

    const recent =
        document.getElementById("recentRequests");

    try {

        const response = await fetch(
            `${API_BASE_URL}/api/ipd/requests`
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(
                data.message || "Unable to load IPD requests"
            );
        }

        ipdRequests =
            Array.isArray(data.requests)
                ? data.requests
                : [];


        updateDashboardStats();

        renderIPDRequests(container);

        renderRecentRequests(recent);

    } catch (error) {

        console.error("IPD request error:", error);

        if (container) {
            container.innerHTML = `
                <div class="empty-state">
                    Unable to load IPD requests.
                    <br>
                    <small>${escapeHtml(error.message)}</small>
                </div>
            `;
        }

        if (recent) {
            recent.innerHTML = `
                <div class="empty-state">
                    Unable to load requests.
                </div>
            `;
        }

    }

}


/* =========================================================
   RENDER IPD REQUESTS
========================================================= */

function renderIPDRequests(container) {

    if (!container) {
        return;
    }

    if (!ipdRequests.length) {

        container.innerHTML = `
            <div class="empty-state">
                <h3>No IPD Billing Requests</h3>
                <p>
                    New requests from doctors will appear here.
                </p>
            </div>
        `;

        return;
    }


    container.innerHTML =
        ipdRequests.map(admission => {

            const patient =
                admission.patient || {};

            const patientId =
                patient.patient_id ||
                admission.patient_id ||
                "-";

            const patientName =
                patient.full_name ||
                admission.patient_name ||
                "Patient";

            const ward =
                admission.ward_name ||
                admission.ward_type ||
                "-";

            const expectedDays =
                admission.expected_days || 0;

            const dailyRate =
                Number(admission.daily_rate || 0);

            const estimatedCharge =
                Number(
                    admission.estimated_ward_charge || 0
                );


            return `
                <article class="billing-card">

                    <div class="billing-card-header">

                        <div>

                            <h3>
                                ${escapeHtml(patientName)}
                            </h3>

                            <small>
                                Patient ID:
                                ${escapeHtml(patientId)}
                            </small>

                        </div>

                        <span class="status-pill ${statusClass(admission.status)}">
                            ${escapeHtml(
                                formatStatus(admission.status)
                            )}
                        </span>

                    </div>


                    <div class="billing-info-grid">

                        <div class="info-box">
                            <span>Admission</span>
                            <strong>
                                ${escapeHtml(
                                    admission.admission_number || "-"
                                )}
                            </strong>
                        </div>


                        <div class="info-box">
                            <span>Ward</span>
                            <strong>
                                ${escapeHtml(ward)}
                            </strong>
                        </div>


                        <div class="info-box">
                            <span>Expected Stay</span>
                            <strong>
                                ${expectedDays} day(s)
                            </strong>
                        </div>


                        <div class="info-box">
                            <span>Daily Rate</span>
                            <strong>
                                ${formatCurrency(dailyRate)}
                            </strong>
                        </div>


                        <div class="info-box">
                            <span>Ward Charge</span>
                            <strong>
                                ${formatCurrency(estimatedCharge)}
                            </strong>
                        </div>


                        <div class="info-box">
                            <span>Payment</span>
                            <strong>
                                ${escapeHtml(
                                    admission.payment_status || "PENDING"
                                )}
                            </strong>
                        </div>

                    </div>


                    <div class="billing-card-footer">

                        ${
                            admission.payment_status === "PAID"
                            ?
                            `
                            <button
                                type="button"
                                class="secondary-button"
                                onclick="viewReceiptForAdmission(${admission.id})"
                            >
                                🧾 View Receipt
                            </button>
                            `
                            :
                            `
                            <button
                                type="button"
                                class="primary-button"
                                onclick="openBilling(${admission.id})"
                            >
                                Process Billing
                            </button>
                            `
                        }

                    </div>

                </article>
            `;

        }).join("");

}


/* =========================================================
   RECENT REQUESTS
========================================================= */

function renderRecentRequests(container) {

    if (!container) {
        return;
    }

    const recent =
        ipdRequests.slice(0, 5);


    if (!recent.length) {

        container.innerHTML = `
            <div class="empty-state">
                No recent IPD requests.
            </div>
        `;

        return;
    }


    container.innerHTML =
        recent.map(admission => {

            const patient =
                admission.patient || {};

            return `
                <div class="request-item">

                    <div>

                        <h4>
                            ${escapeHtml(
                                patient.full_name ||
                                "Patient"
                            )}
                        </h4>

                        <p>
                            ${escapeHtml(
                                patient.patient_id ||
                                "-"
                            )}
                            ·
                            ${escapeHtml(
                                admission.ward_name ||
                                admission.ward_type ||
                                "-"
                            )}
                        </p>

                    </div>

                    <span class="status-pill ${statusClass(admission.status)}">
                        ${escapeHtml(
                            formatStatus(admission.status)
                        )}
                    </span>

                </div>
            `;

        }).join("");

}


/* =========================================================
   DASHBOARD STATS
========================================================= */

function updateDashboardStats() {

    const pending =
        ipdRequests.filter(
            item =>
                item.status === "BILLING_PENDING" ||
                item.status === "REQUESTED"
        ).length;


    const paymentPending =
        ipdRequests.filter(
            item =>
                item.status === "PAYMENT_PENDING"
        ).length;


    const estimated =
        ipdRequests.reduce(
            (sum, item) =>
                sum +
                Number(
                    item.estimated_ward_charge || 0
                ),
            0
        );


    setText(
        "pendingRequestsCount",
        pending
    );

    setText(
        "paymentPendingCount",
        paymentPending
    );

    setText(
        "estimatedCharges",
        formatCurrency(estimated)
    );

}


/* =========================================================
   AVAILABLE BEDS
========================================================= */

async function loadBeds() {

    const container =
        document.getElementById("bedsContainer");

    try {

        const response = await fetch(
            `${API_BASE_URL}/api/ipd/beds`
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(
                data.message || "Unable to load beds"
            );
        }

        const beds =
            Array.isArray(data.beds)
                ? data.beds
                : [];

        availableBeds =
            beds.filter(
                bed =>
                    String(
                        bed.status || ""
                    ).toUpperCase() === "AVAILABLE"
            );


        setText(
            "availableBedsCount",
            availableBeds.length
        );


        if (!container) {
            return;
        }


        if (!beds.length) {

            container.innerHTML = `
                <div class="empty-state">
                    No beds found.
                </div>
            `;

            return;
        }


        container.innerHTML =
            beds.map(bed => {

                const status =
                    String(
                        bed.status || ""
                    ).toUpperCase();

                return `
                    <div class="bed-card ${
                        status === "AVAILABLE"
                            ? "available"
                            : "occupied"
                    }">

                        <h3>
                            🛏️
                            ${escapeHtml(
                                bed.bed_number || "-"
                            )}
                        </h3>

                        <p>
                            Ward:
                            <strong>
                                ${escapeHtml(
                                    bed.ward || "-"
                                )}
                            </strong>
                        </p>

                        <p>
                            Room:
                            ${escapeHtml(
                                bed.room_number || "-"
                            )}
                        </p>

                        <p>
                            Status:
                            <strong>
                                ${escapeHtml(status)}
                            </strong>
                        </p>

                    </div>
                `;

            }).join("");


    } catch (error) {

        console.error("Bed loading error:", error);

        if (container) {
            container.innerHTML = `
                <div class="empty-state">
                    Unable to load beds.
                    <br>
                    ${escapeHtml(error.message)}
                </div>
            `;
        }

    }

}


/* =========================================================
   OPEN BILLING
========================================================= */

async function openBilling(admissionId) {

    selectedAdmission =
        ipdRequests.find(
            item =>
                Number(item.id) === Number(admissionId)
        );


    if (!selectedAdmission) {

        showToast(
            "IPD admission not found.",
            "error"
        );

        return;
    }


    const modal =
        document.getElementById("billingModal");

    const content =
        document.getElementById("billingModalContent");


    modal.hidden = false;


    const patient =
        selectedAdmission.patient || {};


    content.innerHTML = `

        <div class="billing-info-grid">

            <div class="info-box">
                <span>Patient</span>
                <strong>
                    ${escapeHtml(
                        patient.full_name || "-"
                    )}
                </strong>
            </div>

            <div class="info-box">
                <span>Patient ID</span>
                <strong>
                    ${escapeHtml(
                        patient.patient_id ||
                        selectedAdmission.patient_id ||
                        "-"
                    )}
                </strong>
            </div>

            <div class="info-box">
                <span>Ward</span>
                <strong>
                    ${escapeHtml(
                        selectedAdmission.ward_name ||
                        selectedAdmission.ward_type ||
                        "-"
                    )}
                </strong>
            </div>

            <div class="info-box">
                <span>Expected Stay</span>
                <strong>
                    ${selectedAdmission.expected_days || 0}
                    day(s)
                </strong>
            </div>

        </div>


        <br>


        <div class="form-grid">

            <div class="form-group full-width">

                <label>
                    Available Bed
                </label>

                <select id="billingBed">

                    <option value="">
                        Loading available beds...
                    </option>

                </select>

            </div>


            <div class="form-group">

                <label>
                    Ward Charge
                </label>

                <input
                    id="billingWardCharge"
                    value="${Number(
                        selectedAdmission
                            .estimated_ward_charge || 0
                    ).toFixed(2)}"
                    readonly
                >

            </div>


            <div class="form-group">

                <label>
                    Other Charges
                </label>

                <input
                    id="billingOtherCharge"
                    type="number"
                    min="0"
                    step="0.01"
                    value="0"
                    oninput="calculateBillingTotal()"
                >

            </div>


            <div class="form-group">

                <label>
                    Discount
                </label>

                <input
                    id="billingDiscount"
                    type="number"
                    min="0"
                    step="0.01"
                    value="0"
                    oninput="calculateBillingTotal()"
                >

            </div>


            <div class="form-group">

                <label>
                    Total Amount
                </label>

                <input
                    id="billingTotal"
                    readonly
                >

            </div>


            <div class="form-group">

                <label>
                    Payment Method
                </label>

                <select id="paymentMethod">

                    <option value="CASH">
                        Cash
                    </option>

                    <option value="UPI">
                        UPI
                    </option>

                    <option value="CARD">
                        Card
                    </option>

                    <option value="NET_BANKING">
                        Net Banking
                    </option>

                </select>

            </div>


            <div class="form-group">

                <label>
                    Transaction ID
                </label>

                <input
                    id="transactionId"
                    placeholder="Optional for cash"
                >

            </div>

        </div>

    `;


    calculateBillingTotal();

    await loadBedsForAdmission(
        selectedAdmission.ward_type
    );


    content.insertAdjacentHTML(
        "beforeend",
        `

        <div class="modal-actions">

            <button
                type="button"
                class="secondary-button"
                onclick="closeBillingModal()"
            >
                Cancel
            </button>

            <button
                type="button"
                class="primary-button"
                onclick="processBillingPayment()"
            >
                💳 Generate Bill & Pay
            </button>

        </div>

        `
    );

}


/* =========================================================
   LOAD WARD BEDS
========================================================= */

async function loadBedsForAdmission(ward) {

    const select =
        document.getElementById("billingBed");

    if (!select) {
        return;
    }


    try {

        const response = await fetch(
            `${API_BASE_URL}/api/ipd/beds/available?ward=${encodeURIComponent(
                ward || ""
            )}`
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(
                data.message ||
                "Unable to load available beds"
            );
        }


        const beds =
            Array.isArray(data.beds)
                ? data.beds
                : [];


        if (!beds.length) {

            select.innerHTML = `
                <option value="">
                    No available bed in selected ward
                </option>
            `;

            return;
        }


        select.innerHTML = `

            <option value="">
                Select Available Bed
            </option>

            ${
                beds.map(bed => `
                    <option value="${bed.id}">
                        ${escapeHtml(
                            bed.bed_number || "-"
                        )}
                        —
                        Room ${escapeHtml(
                            bed.room_number || "-"
                        )}
                    </option>
                `).join("")
            }

        `;


    } catch (error) {

        console.error(
            "Available bed error:",
            error
        );

        select.innerHTML = `
            <option value="">
                Unable to load beds
            </option>
        `;

    }

}


/* =========================================================
   CALCULATE BILL
========================================================= */

function calculateBillingTotal() {

    const ward =
        Number(
            document.getElementById(
                "billingWardCharge"
            )?.value || 0
        );

    const other =
        Number(
            document.getElementById(
                "billingOtherCharge"
            )?.value || 0
        );

    const discount =
        Number(
            document.getElementById(
                "billingDiscount"
            )?.value || 0
        );


    const total =
        Math.max(
            ward + other - discount,
            0
        );


    const totalElement =
        document.getElementById(
            "billingTotal"
        );

    if (totalElement) {
        totalElement.value =
            total.toFixed(2);
    }

}


/* =========================================================
   PROCESS BILL + PAYMENT
========================================================= */

async function processBillingPayment() {

    if (!selectedAdmission) {
        return;
    }


    const bedId =
        document.getElementById(
            "billingBed"
        )?.value;


    if (!bedId) {

        showToast(
            "Please select an available bed.",
            "error"
        );

        return;
    }


    const patient =
        selectedAdmission.patient || {};


    const patientId =
        patient.patient_id ||
        selectedAdmission.patient_id;


    if (!patientId) {

        showToast(
            "Patient ID is missing.",
            "error"
        );

        return;
    }


    const wardCharge =
        Number(
            document.getElementById(
                "billingWardCharge"
            )?.value || 0
        );


    const otherCharge =
        Number(
            document.getElementById(
                "billingOtherCharge"
            )?.value || 0
        );


    const discount =
        Number(
            document.getElementById(
                "billingDiscount"
            )?.value || 0
        );


    const paymentMethod =
        document.getElementById(
            "paymentMethod"
        )?.value;


    const transactionId =
        document.getElementById(
            "transactionId"
        )?.value.trim();


    const total =
        Math.max(
            wardCharge +
            otherCharge -
            discount,
            0
        );


    try {

        showToast(
            "Assigning bed...",
            "success"
        );


        /* --------------------------------------------------
           1. ASSIGN BED
        -------------------------------------------------- */

        const bedResponse =
            await fetch(
                `${API_BASE_URL}/api/ipd/request/${selectedAdmission.id}/bed`,
                {
                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        bed_id:
                            Number(bedId)
                    })
                }
            );


        const bedData =
            await bedResponse.json();


        if (!bedResponse.ok ||
            !bedData.success) {

            throw new Error(
                bedData.message ||
                "Unable to assign bed."
            );

        }


        /* --------------------------------------------------
           2. CREATE BILL
        -------------------------------------------------- */

        showToast(
            "Generating hospital bill...",
            "success"
        );


        const billResponse =
            await fetch(
                `${API_BASE_URL}/api/billing/create`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        patient_id:
                            patientId,

                        admission_charge:
                            wardCharge,

                        other_charge:
                            otherCharge,

                        discount:
                            discount,

                        consultation_charge:
                            0,

                        medicine_charge:
                            0

                    })
                }
            );


        const billData =
            await billResponse.json();


        if (!billResponse.ok ||
            !billData.success) {

            throw new Error(
                billData.message ||
                "Unable to create bill."
            );

        }


        const bill =
            billData.bill;


        /* --------------------------------------------------
           3. LINK BILL TO IPD ADMISSION
        -------------------------------------------------- */

        const linkResponse =
            await fetch(
                `${API_BASE_URL}/api/ipd/request/${selectedAdmission.id}/billing`,
                {
                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        bill_id:
                            bill.id,

                        payment_status:
                            "PENDING"

                    })
                }
            );


        const linkData =
            await linkResponse.json();


        if (!linkResponse.ok ||
            !linkData.success) {

            throw new Error(
                linkData.message ||
                "Unable to link billing information."
            );

        }


        /* --------------------------------------------------
           4. PAYMENT
        -------------------------------------------------- */

        showToast(
            "Processing payment...",
            "success"
        );


        const paymentResponse =
            await fetch(
                `${API_BASE_URL}/api/billing/${bill.id}/pay`,
                {
                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        payment_method:
                            paymentMethod,

                        transaction_id:
                            transactionId

                    })
                }
            );


        const paymentData =
            await paymentResponse.json();


        if (!paymentResponse.ok ||
            !paymentData.success) {

            throw new Error(
                paymentData.message ||
                "Payment failed."
            );

        }


        const paidBill =
            paymentData.bill;


        /* --------------------------------------------------
           5. MARK IPD PAYMENT PAID
           BACKEND WILL NOTIFY IPD
        -------------------------------------------------- */

        const ipdPaymentResponse =
            await fetch(
                `${API_BASE_URL}/api/ipd/request/${selectedAdmission.id}/billing`,
                {
                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        bill_id:
                            paidBill.id,

                        payment_status:
                            "PAID"

                    })
                }
            );


        const ipdPaymentData =
            await ipdPaymentResponse.json();


        if (!ipdPaymentResponse.ok ||
            !ipdPaymentData.success) {

            throw new Error(
                ipdPaymentData.message ||
                "Payment completed but IPD status update failed."
            );

        }


        /* --------------------------------------------------
           6. RECEIPT
        -------------------------------------------------- */

        currentReceipt = {

            bill:
                paidBill,

            admission:
                {
                    ...selectedAdmission,

                    ...ipdPaymentData.admission
                },

            patient:
                patient,

            bed:
                bedData.bed,

            paymentMethod:
                paymentMethod,

            transactionId:
                transactionId,

            total:
                total

        };


        closeBillingModal();

        showReceipt(currentReceipt);

        showToast(
            "Payment successful. IPD has been notified.",
            "success"
        );


        await loadAllBillingData();

    } catch (error) {

        console.error(
            "Billing/payment error:",
            error
        );

        showToast(
            error.message ||
            "Billing process failed.",
            "error"
        );

    }

}


/* =========================================================
   RECEIPT
========================================================= */

function showReceipt(receipt) {

    const modal =
        document.getElementById(
            "receiptModal"
        );

    const container =
        document.getElementById(
            "receiptContent"
        );


    const bill =
        receipt.bill || {};

    const admission =
        receipt.admission || {};

    const patient =
        receipt.patient || {};

    const bed =
        receipt.bed || {};


    const billNumber =
        bill.bill_number ||
        `MED-B-${bill.id || ""}`;


    const amount =
        Number(
            bill.total_amount ??
            receipt.total ??
            0
        );


    container.innerHTML = `

        <div class="receipt-header">

            <h1>
                MEDIMATRIX
            </h1>

            <p>
                Healthcare System
            </p>

            <p>
                HOSPITAL BILLING RECEIPT
            </p>

            <span class="paid-stamp">
                PAID
            </span>

        </div>


        <div class="receipt-meta">

            <div>
                <strong>Bill No:</strong>
                ${escapeHtml(billNumber)}
            </div>

            <div>
                <strong>Date:</strong>
                ${formatDate(
                    bill.paid_at ||
                    new Date()
                )}
            </div>

            <div>
                <strong>Patient ID:</strong>
                ${escapeHtml(
                    patient.patient_id ||
                    "-"
                )}
            </div>

            <div>
                <strong>Patient:</strong>
                ${escapeHtml(
                    patient.full_name ||
                    "-"
                )}
            </div>

            <div>
                <strong>Admission:</strong>
                ${escapeHtml(
                    admission.admission_number ||
                    "-"
                )}
            </div>

            <div>
                <strong>Ward:</strong>
                ${escapeHtml(
                    admission.ward_name ||
                    admission.ward_type ||
                    "-"
                )}
            </div>

            <div>
                <strong>Room:</strong>
                ${escapeHtml(
                    bed.room_number ||
                    admission.room_number ||
                    "-"
                )}
            </div>

            <div>
                <strong>Bed:</strong>
                ${escapeHtml(
                    bed.bed_number ||
                    admission.bed_number ||
                    "-"
                )}
            </div>

        </div>


        <div>

            <div class="receipt-row">

                <span>
                    Ward / Admission Charge
                </span>

                <strong>
                    ${formatCurrency(
                        bill.admission_charge || 0
                    )}
                </strong>

            </div>


            <div class="receipt-row">

                <span>
                    Other Charges
                </span>

                <strong>
                    ${formatCurrency(
                        bill.other_charge || 0
                    )}
                </strong>

            </div>


            <div class="receipt-row">

                <span>
                    Discount
                </span>

                <strong>
                    - ${formatCurrency(
                        bill.discount || 0
                    )}
                </strong>

            </div>


            <div class="receipt-row receipt-total">

                <span>
                    TOTAL PAID
                </span>

                <strong>
                    ${formatCurrency(amount)}
                </strong>

            </div>

        </div>


        <br>


        <div class="receipt-meta">

            <div>
                <strong>Payment Method:</strong>
                ${escapeHtml(
                    receipt.paymentMethod ||
                    bill.payment_method ||
                    "-"
                )}
            </div>

            <div>
                <strong>Transaction ID:</strong>
                ${escapeHtml(
                    receipt.transactionId ||
                    bill.transaction_id ||
                    "-"
                )}
            </div>

        </div>


        <div style="text-align:center;margin-top:25px;">

            <strong>
                Payment Successful
            </strong>

            <p style="color:#64748b;">
                This receipt is generated electronically by MediMatrix.
            </p>

        </div>

    `;


    modal.hidden = false;

}


function printReceipt() {

    const receipt =
        document.getElementById(
            "receiptContent"
        );

    if (!receipt) {
        return;
    }


    const printWindow =
        window.open(
            "",
            "_blank",
            "width=850,height=900"
        );


    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>MediMatrix Payment Receipt</title>

            <style>

                body {
                    font-family:
                        Arial,
                        sans-serif;
                    margin: 40px;
                    color: #172554;
                }

                .receipt-header {
                    text-align:center;
                    border-bottom:2px solid #172554;
                    padding-bottom:20px;
                    margin-bottom:25px;
                }

                .receipt-header h1 {
                    margin:0;
                    font-size:30px;
                }

                .receipt-header p {
                    margin:6px;
                    color:#64748b;
                }

                .receipt-meta {
                    display:grid;
                    grid-template-columns:1fr 1fr;
                    gap:12px 30px;
                    margin-bottom:25px;
                }

                .receipt-row {
                    display:flex;
                    justify-content:space-between;
                    padding:12px 0;
                    border-bottom:1px solid #ddd;
                }

                .receipt-total {
                    border-top:2px solid #111;
                    font-size:20px;
                    font-weight:bold;
                }

                .paid-stamp {
                    display:inline-block;
                    color:#15803d;
                    border:3px solid #15803d;
                    padding:7px 14px;
                    font-weight:bold;
                    margin-top:15px;
                }

            </style>

        </head>

        <body>

            ${receipt.innerHTML}

        </body>

        </html>
    `);


    printWindow.document.close();

    printWindow.focus();

    setTimeout(() => {

        printWindow.print();

        printWindow.close();

    }, 300);

}


function closeReceipt() {

    document.getElementById(
        "receiptModal"
    ).hidden = true;

}


/* =========================================================
   RECEIPT FOR EXISTING ADMISSION
========================================================= */

async function viewReceiptForAdmission(admissionId) {

    try {

        const admission =
            ipdRequests.find(
                item =>
                    Number(item.id) ===
                    Number(admissionId)
            );


        if (!admission) {
            throw new Error(
                "Admission not found."
            );
        }


        if (!admission.bill_id) {
            throw new Error(
                "Receipt is not available."
            );
        }


        const response =
            await fetch(
                `${API_BASE_URL}/api/billing/${admission.bill_id}`
            );


        const data =
            await response.json();


        if (!response.ok ||
            !data.success) {

            throw new Error(
                data.message ||
                "Unable to load receipt."
            );

        }


        currentReceipt = {

            bill:
                data.bill,

            admission:
                admission,

            patient:
                admission.patient || {},

            bed: {

                bed_number:
                    admission.bed_number,

                room_number:
                    admission.room_number

            },

            paymentMethod:
                data.bill.payment_method,

            transactionId:
                data.bill.transaction_id

        };


        showReceipt(
            currentReceipt
        );

    } catch (error) {

        showToast(
            error.message,
            "error"
        );

    }

}


/* =========================================================
   PROFILE
========================================================= */

function loadBillingProfile() {

    const saved =
        JSON.parse(
            localStorage.getItem(
                "medimatrix_billing_profile"
            ) || "{}"
        );


    const name =
        saved.name ||
        localStorage.getItem(
            "billing_name"
        ) ||
        "Billing Staff";


    const employeeId =
        saved.employeeId ||
        localStorage.getItem(
            "billing_id"
        ) ||
        "BIL001";


    setText(
        "headerStaffName",
        name
    );

    setText(
        "profileName",
        name
    );

    setText(
        "profileInitial",
        getInitial(name)
    );

    setText(
        "largeProfileInitial",
        getInitial(name)
    );


    const employee =
        document.getElementById(
            "profileEmployeeId"
        );

    if (employee) {
        employee.value = employeeId;
    }


    const email =
        document.getElementById(
            "profileEmail"
        );

    if (email) {
        email.value =
            saved.email || "";
    }


    const phone =
        document.getElementById(
            "profilePhone"
        );

    if (phone) {
        phone.value =
            saved.phone || "";
    }


    const address =
        document.getElementById(
            "profileAddress"
        );

    if (address) {
        address.value =
            saved.address || "";
    }


    const fullName =
        document.getElementById(
            "profileFullName"
        );

    if (fullName) {
        fullName.value = name;
    }

}


function openProfile() {

    loadBillingProfile();

    document.getElementById(
        "profileModal"
    ).hidden = false;

}


function closeProfile() {

    document.getElementById(
        "profileModal"
    ).hidden = true;

}


function saveBillingProfile() {

    const profile = {

        employeeId:
            document.getElementById(
                "profileEmployeeId"
            )?.value.trim(),

        name:
            document.getElementById(
                "profileFullName"
            )?.value.trim(),

        email:
            document.getElementById(
                "profileEmail"
            )?.value.trim(),

        phone:
            document.getElementById(
                "profilePhone"
            )?.value.trim(),

        address:
            document.getElementById(
                "profileAddress"
            )?.value.trim()

    };


    localStorage.setItem(
        "medimatrix_billing_profile",
        JSON.stringify(profile)
    );


    loadBillingProfile();

    closeProfile();

    showToast(
        "Profile updated successfully.",
        "success"
    );

}


/* =========================================================
   NOTIFICATIONS
========================================================= */

async function loadNotifications() {

    const container =
        document.getElementById(
            "notificationsContainer"
        );


    try {

        const billingId =
            localStorage.getItem(
                "billing_id"
            ) ||
            "BIL001";


        const response =
            await fetch(
                `${API_BASE_URL}/api/notifications/billing?user_id=${encodeURIComponent(
                    billingId
                )}`
            );


        const data =
            await response.json();


        if (!response.ok ||
            !data.success) {

            throw new Error(
                data.message ||
                "Unable to load notifications."
            );

        }


        const notifications =
            Array.isArray(
                data.notifications
            )
                ? data.notifications
                : [];


        const unread =
            Number(
                data.unread_count ||
                notifications.filter(
                    n => !n.is_read
                ).length
            );


        updateNotificationBadges(
            unread
        );


        if (!container) {
            return;
        }


        if (!notifications.length) {

            container.innerHTML = `
                <div class="empty-state">
                    No notifications.
                </div>
            `;

            return;
        }


        container.innerHTML =
            notifications.map(
                notification => `

                <div class="notification-card ${
                    notification.is_read
                        ? ""
                        : "unread"
                }">

                    <h3>
                        ${escapeHtml(
                            notification.title ||
                            "Notification"
                        )}
                    </h3>

                    <p>
                        ${escapeHtml(
                            notification.message ||
                            ""
                        )}
                    </p>

                </div>

            `
            ).join("");


    } catch (error) {

        console.warn(
            "Billing notifications:",
            error.message
        );


        if (container) {

            container.innerHTML = `
                <div class="empty-state">
                    Notifications are currently unavailable.
                </div>
            `;

        }

    }

}


function updateNotificationBadges(count) {

    const badge =
        document.getElementById(
            "notificationBadge"
        );

    const headerBadge =
        document.getElementById(
            "headerNotificationBadge"
        );


    [badge, headerBadge].forEach(
        element => {

            if (!element) {
                return;
            }

            element.textContent =
                count;

            element.hidden =
                count <= 0;

        }
    );

}


/* =========================================================
   LOGOUT
========================================================= */

function logoutBilling() {

    const confirmed =
        window.confirm(
            "Are you sure you want to logout?"
        );


    if (!confirmed) {
        return;
    }


    localStorage.removeItem(
        "billing_id"
    );

    localStorage.removeItem(
        "billing_name"
    );

    localStorage.removeItem(
        "medimatrix_billing_profile"
    );


    window.location.href =
        "./login.html";

}


/* =========================================================
   MODALS
========================================================= */

function closeBillingModal() {

    document.getElementById(
        "billingModal"
    ).hidden = true;

    selectedAdmission = null;

}


/* =========================================================
   TOAST
========================================================= */

function showToast(
    message,
    type = ""
) {

    const toast =
        document.getElementById(
            "toast"
        );


    toast.textContent =
        message;

    toast.className =
        `toast ${type}`;

    toast.hidden = false;


    clearTimeout(
        window.__billingToastTimer
    );


    window.__billingToastTimer =
        setTimeout(() => {

            toast.hidden = true;

        }, 3500);

}


/* =========================================================
   HELPERS
========================================================= */

function setText(id, value) {

    const element =
        document.getElementById(id);

    if (element) {
        element.textContent =
            value ?? "";
    }

}


function formatCurrency(value) {

    return new Intl.NumberFormat(
        "en-IN",
        {
            style: "currency",
            currency: "INR",
            minimumFractionDigits: 2
        }
    ).format(
        Number(value || 0)
    );

}


function formatDate(value) {

    const date =
        new Date(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return "-";
    }


    return date.toLocaleString(
        "en-IN"
    );

}


function formatStatus(status) {

    return String(
        status || "PENDING"
    )
        .replaceAll("_", " ")
        .toLowerCase()
        .replace(/\b\w/g, c => c.toUpperCase());

}


function statusClass(status) {

    const value =
        String(
            status || ""
        ).toUpperCase();


    if (value === "PAID" ||
        value === "ADMITTED") {

        return "paid";
    }


    if (
        value === "IPD_VERIFICATION"
    ) {

        return "verify";
    }


    return "pending";

}


function getInitial(name) {

    return String(
        name || "B"
    )
        .trim()
        .charAt(0)
        .toUpperCase();

}


function escapeHtml(value) {

    return String(
        value ?? ""
    )
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


/* =========================================================
   GLOBAL EXPORTS
========================================================= */

window.showBillingSection =
    showBillingSection;

window.loadAllBillingData =
    loadAllBillingData;

window.loadIPDRequests =
    loadIPDRequests;

window.loadBeds =
    loadBeds;

window.openBilling =
    openBilling;

window.closeBillingModal =
    closeBillingModal;

window.calculateBillingTotal =
    calculateBillingTotal;

window.processBillingPayment =
    processBillingPayment;

window.showReceipt =
    showReceipt;

window.printReceipt =
    printReceipt;

window.closeReceipt =
    closeReceipt;

window.viewReceiptForAdmission =
    viewReceiptForAdmission;

window.openProfile =
    openProfile;

window.closeProfile =
    closeProfile;

window.saveBillingProfile =
    saveBillingProfile;

window.loadNotifications =
    loadNotifications;

window.logoutBilling =
    logoutBilling;

console.log(
    "MediMatrix Billing Dashboard ready."
);