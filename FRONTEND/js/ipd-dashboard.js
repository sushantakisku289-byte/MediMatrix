/* =========================================================
   MEDIMATRIX IPD COMMAND CENTER
========================================================= */

"use strict";


/* =========================================================
   CONFIGURATION
========================================================= */

const API_BASE_URL = "http://127.0.0.1:5000";

const IPD_API = `${API_BASE_URL}/api/ipd`;
const NOTIFICATION_API =
    `${API_BASE_URL}/api/notifications`;

/* =========================================================
   GLOBAL DATA
========================================================= */

let allBeds = [];
let allRequests = [];
let allAdmissions = [];

let currentPatientAdmission = null;


/* =========================================================
   PAGE LOAD
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    loadProfile();

    loadDashboard();

    setupEnterKey();

    startIPDNotificationPolling();

});


/* =========================================================
   DASHBOARD LOADING
========================================================= */

async function loadDashboard() {

    try {

        showDashboardLoading();

        const results = await Promise.allSettled([

            fetchJSON(`${IPD_API}/beds`),

            fetchJSON(`${IPD_API}/requests`),

            fetchJSON(`${IPD_API}/admissions`)

        ]);


        /* ---------------------------------------------
           BEDS
        --------------------------------------------- */

        if (
            results[0].status === "fulfilled" &&
            results[0].value
        ) {

            allBeds =
                Array.isArray(results[0].value.beds)
                    ? results[0].value.beds
                    : [];

        } else {

            allBeds = [];

            console.error(
                "IPD beds API failed:",
                results[0]
            );

        }


        /* ---------------------------------------------
           REQUESTS
        --------------------------------------------- */

        if (
            results[1].status === "fulfilled" &&
            results[1].value
        ) {

            allRequests =
                Array.isArray(results[1].value.requests)
                    ? results[1].value.requests
                    : [];

        } else {

            allRequests = [];

            console.error(
                "IPD requests API failed:",
                results[1]
            );

        }


        /* ---------------------------------------------
           ACTIVE ADMISSIONS
        --------------------------------------------- */

        if (
            results[2].status === "fulfilled" &&
            results[2].value
        ) {

            allAdmissions =
                Array.isArray(results[2].value.admissions)
                    ? results[2].value.admissions
                    : [];

        } else {

            allAdmissions = [];

            console.error(
                "IPD admissions API failed:",
                results[2]
            );

        }


        renderStats();

        renderWardOverview();

        renderBedCommandCenter();

    } catch (error) {

        console.error(
            "IPD dashboard loading error:",
            error
        );

        showToast(
            "Unable to load IPD dashboard",
            "error"
        );

    }

}


/* =========================================================
   GENERIC FETCH
========================================================= */

async function fetchJSON(url, options = {}) {

    const response = await fetch(
        url,
        {
            ...options,

            headers: {
                "Content-Type": "application/json",

                ...(options.headers || {})
            }
        }
    );


    let data = {};

    try {

        data = await response.json();

    } catch (error) {

        data = {};

    }


    if (!response.ok) {

        throw new Error(
            data.message ||
            `HTTP ${response.status}`
        );

    }


    return data;

}


/* =========================================================
   STATS
========================================================= */

function renderStats() {

    const total =
        allBeds.length;

    const available =
        allBeds.filter(
            bed =>
                normalizeStatus(bed.status) ===
                "AVAILABLE"
        ).length;

    const occupied =
        allBeds.filter(
            bed =>
                normalizeStatus(bed.status) ===
                "OCCUPIED"
        ).length;

    const occupancy =
        total > 0
            ? Math.round(
                (occupied / total) * 100
            )
            : 0;


    setText(
        "totalBeds",
        total
    );

    setText(
        "availableBeds",
        available
    );

    setText(
        "occupiedBeds",
        occupied
    );

    setText(
        "occupancyRate",
        `${occupancy}%`
    );

}


/* =========================================================
   WARD OVERVIEW
========================================================= */

function renderWardOverview() {

    const container =
        document.getElementById(
            "wardOverview"
        );


    if (!container) {
        return;
    }


    if (!allBeds.length) {

        container.innerHTML = `
            <div class="empty-result">
                <div class="empty-icon">▦</div>
                <h3>No bed data</h3>
                <p>Bed information is not available.</p>
            </div>
        `;

        return;

    }


    const wards = {};


    allBeds.forEach(bed => {

        const ward =
            getWardName(bed);


        if (!wards[ward]) {

            wards[ward] = {

                total: 0,

                available: 0,

                occupied: 0,

                pending: 0

            };

        }


        wards[ward].total++;


        const status =
            getVisualBedStatus(bed);


        if (status === "AVAILABLE") {

            wards[ward].available++;

        } else if (status === "OCCUPIED") {

            wards[ward].occupied++;

        } else {

            wards[ward].pending++;

        }

    });


    container.innerHTML =
        Object.entries(wards)
            .map(
                ([ward, data]) => {

                    const percentage =
                        data.total > 0
                            ? Math.round(
                                (data.occupied /
                                    data.total) *
                                100
                            )
                            : 0;


                    let level =
                        "low";


                    if (percentage >= 80) {

                        level = "high";

                    } else if (percentage >= 50) {

                        level = "medium";

                    }


                    return `
                        <div class="ward-card">

                            <div class="ward-card-top">

                                <div>

                                    <div class="ward-name">
                                        ${escapeHTML(ward)}
                                    </div>

                                    <div class="ward-capacity">
                                        ${data.total} total beds
                                    </div>

                                </div>

                                <div class="ward-percentage">
                                    ${percentage}%
                                </div>

                            </div>


                            <div class="ward-progress">

                                <div
                                    class="ward-progress-bar ${level}"
                                    style="width:${percentage}%"
                                ></div>

                            </div>


                            <div class="ward-card-bottom">

                                <span>
                                    ${data.available} available
                                </span>

                                <span>
                                    ${data.occupied} occupied
                                </span>

                            </div>

                        </div>
                    `;

                }
            )
            .join("");

}


/* =========================================================
   BED COMMAND CENTER
========================================================= */
function renderBedCommandCenter() {

    const container =
        document.getElementById("bedCommandCenter");

    if (!container) return;

    if (!allBeds.length) {

        container.innerHTML = `
            <div class="ward-bed-section">
                <div class="loading-state">
                    <div class="loading-spinner"></div>
                    No bed information available.
                </div>
            </div>
        `;

        return;
    }

    /*
     * Ward
     *   └── Room
     *       └── Beds
     */

    const wards = {};

    allBeds.forEach(bed => {

        const ward = getWardName(bed);
        const room = getRoomNumber(bed);

        if (!wards[ward]) {
            wards[ward] = {};
        }

        if (!wards[ward][room]) {
            wards[ward][room] = [];
        }

        wards[ward][room].push(bed);
    });


    container.innerHTML = Object.entries(wards)
        .map(([ward, rooms]) => {

            const totalBeds =
                Object.values(rooms)
                    .flat()
                    .length;

            const availableBeds =
                Object.values(rooms)
                    .flat()
                    .filter(
                        bed =>
                            getVisualBedStatus(bed) ===
                            "AVAILABLE"
                    )
                    .length;

            const occupiedBeds =
                Object.values(rooms)
                    .flat()
                    .filter(
                        bed =>
                            getVisualBedStatus(bed) ===
                            "OCCUPIED"
                    )
                    .length;


            return `
                <div class="ward-bed-section">

                    <div class="ward-bed-header">

                        <div class="ward-bed-title">

                            <div class="ward-bed-title-icon">
                                🏥
                            </div>

                            <div>

                                <h4>
                                    ${escapeHTML(ward)}
                                </h4>

                                <span>
                                    ${Object.keys(rooms).length}
                                    rooms ·
                                    ${totalBeds}
                                    beds
                                </span>

                            </div>

                        </div>


                        <div class="ward-bed-summary">

                            <span class="summary-badge green">
                                ${availableBeds} Available
                            </span>

                            <span class="summary-badge red">
                                ${occupiedBeds} Occupied
                            </span>

                        </div>

                    </div>


                    <div class="room-grid">

                        ${Object.entries(rooms)
                            .map(
                                ([room, beds]) =>
                                    createRoomCard(
                                        ward,
                                        room,
                                        beds
                                    )
                            )
                            .join("")}

                    </div>

                </div>
            `;

        })
        .join("");
}
function createRoomCard(
    ward,
    room,
    beds
) {

    const available =
        beds.filter(
            bed =>
                getVisualBedStatus(bed) ===
                "AVAILABLE"
        ).length;


    const occupied =
        beds.filter(
            bed =>
                getVisualBedStatus(bed) ===
                "OCCUPIED"
        ).length;


    const pending =
        beds.filter(
            bed =>
                getVisualBedStatus(bed) ===
                "PENDING"
        ).length;


    const total =
        beds.length;


    const occupancy =
        total > 0
            ? Math.round(
                (occupied / total) * 100
            )
            : 0;


    return `
        <div
            class="room-card"
            onclick="openRoom('${escapeAttribute(ward)}','${escapeAttribute(room)}')"
        >

            <div class="room-card-top">

                <div class="room-icon">
                    🚪
                </div>

                <div class="room-arrow">
                    →
                </div>

            </div>


            <div class="room-name">
                ${escapeHTML(room)}
            </div>


            <div class="room-ward">
                ${escapeHTML(ward)}
            </div>


            <div class="room-capacity">

                <strong>
                    ${total}
                </strong>

                <span>
                    beds
                </span>

            </div>


            <div class="room-progress">

                <div
                    class="room-progress-fill"
                    style="width:${occupancy}%"
                ></div>

            </div>


            <div class="room-status-row">

                <span class="room-available">
                    🟢 ${available}
                </span>

                <span class="room-occupied">
                    🔴 ${occupied}
                </span>

                ${
                    pending > 0
                        ? `
                            <span class="room-pending">
                                🟡 ${pending}
                            </span>
                        `
                        : ""
                }

            </div>


            <div class="room-view-text">
                View beds →
            </div>

        </div>
    `;
}
function openRoom(
    ward,
    room
) {

    const roomBeds =
        allBeds.filter(
            bed =>
                getWardName(bed) === ward &&
                getRoomNumber(bed) === room
        );


    if (!roomBeds.length) {

        showToast(
            "No beds found in this room",
            "error"
        );

        return;
    }


    showRoomBedModal(
        ward,
        room,
        roomBeds
    );
}
function showRoomBedModal(
    ward,
    room,
    beds
) {

    let modal =
        document.getElementById(
            "roomBedModal"
        );


    /*
     * Create modal automatically.
     * No HTML change required.
     */

    if (!modal) {

        modal =
            document.createElement("div");

        modal.id =
            "roomBedModal";

        modal.className =
            "modal-overlay";


        document.body.appendChild(
            modal
        );

    }


    const available =
        beds.filter(
            bed =>
                getVisualBedStatus(bed) ===
                "AVAILABLE"
        ).length;


    const occupied =
        beds.filter(
            bed =>
                getVisualBedStatus(bed) ===
                "OCCUPIED"
        ).length;


    const pending =
        beds.filter(
            bed =>
                getVisualBedStatus(bed) ===
                "PENDING"
        ).length;


    modal.innerHTML = `

        <div
            class="modal-card room-selection-modal"
            onclick="event.stopPropagation()"
        >

            <button
                class="modal-close"
                onclick="closeRoomBedModal()"
            >
                ×
            </button>


            <!-- ROOM HEADER -->

            <div class="room-selection-header">

                <div class="room-selection-icon">
                    🚪
                </div>

                <div>

                    <span class="section-kicker">
                        ROOM BED MAP
                    </span>

                    <h2>
                        ${escapeHTML(room)}
                    </h2>

                    <p>
                        ${escapeHTML(ward)}
                        ·
                        ${beds.length}
                        beds
                    </p>

                </div>

            </div>


            <!-- STATUS -->

            <div class="room-selection-stats">

                <div class="selection-stat available-stat">

                    <strong>
                        ${available}
                    </strong>

                    <span>
                        Available
                    </span>

                </div>


                <div class="selection-stat occupied-stat">

                    <strong>
                        ${occupied}
                    </strong>

                    <span>
                        Occupied
                    </span>

                </div>


                <div class="selection-stat pending-stat">

                    <strong>
                        ${pending}
                    </strong>

                    <span>
                        Pending
                    </span>

                </div>

            </div>


            <!-- TRAIN STYLE BED AREA -->

            <div class="train-seat-area">

                <div class="train-label">
                    ROOM ${escapeHTML(room)}
                </div>


                <div class="bed-seat-layout">

                    ${createTrainStyleBeds(
                        beds
                    )}

                </div>


                <div class="seat-legend">

                    <span>
                        <i class="seat-dot available"></i>
                        Available
                    </span>

                    <span>
                        <i class="seat-dot occupied"></i>
                        Occupied
                    </span>

                    <span>
                        <i class="seat-dot pending"></i>
                        Pending
                    </span>

                </div>

            </div>

        </div>
    `;


    modal.classList.add(
        "show"
    );


    modal.onclick = function(event) {

        if (
            event.target ===
            modal
        ) {

            closeRoomBedModal();

        }

    };

}
function createTrainStyleBeds(
    beds
) {

    /*
     * Sort beds naturally.
     */

    const sortedBeds =
        [...beds].sort(
            (a, b) =>
                naturalCompare(
                    getBedNumber(a),
                    getBedNumber(b)
                )
        );


    return sortedBeds
        .map(
            (bed, index) => {

                const status =
                    getVisualBedStatus(
                        bed
                    );


                const cssClass =
                    status === "AVAILABLE"
                        ? "seat-available"
                        : status === "OCCUPIED"
                            ? "seat-occupied"
                            : "seat-pending";


                const patient =
                    findPatientForBed(
                        bed
                    );


                return `

                    <button
                        type="button"
                        class="train-seat ${cssClass}"
                        onclick="selectRoomBed(${Number(
                            bed.id
                        )})"
                    >

                        <div class="seat-number">
                            ${escapeHTML(
                                getBedNumber(bed)
                            )}
                        </div>


                        <div class="seat-icon">
                            ${
                                status ===
                                "AVAILABLE"
                                    ? "🛏"
                                    : "🛌"
                            }
                        </div>


                        <div class="seat-status">

                            ${
                                status ===
                                "AVAILABLE"
                                    ? "AVAILABLE"
                                    : status ===
                                      "OCCUPIED"
                                        ? "OCCUPIED"
                                        : "PENDING"
                            }

                        </div>


                        ${
                            patient
                                ? `
                                    <div class="seat-patient">
                                        ${escapeHTML(
                                            patient.full_name ||
                                            patient.name ||
                                            "Patient"
                                        )}
                                    </div>
                                `
                                : ""
                        }

                    </button>

                `;
            }
        )
        .join("");
}
function selectRoomBed(
    bedId
) {

    const bed =
        allBeds.find(
            item =>
                Number(item.id) ===
                Number(bedId)
        );


    if (!bed) {

        showToast(
            "Bed not found",
            "error"
        );

        return;
    }


    /*
     * Close room selector first.
     */

    closeRoomBedModal();


    /*
     * Open existing bed details.
     */

    openBedDetails(
        bed.id
    );
}
function findPatientForBed(
    bed
) {

    if (!bed.patient_id) {
        return null;
    }


    const allRecords = [
        ...allRequests,
        ...allAdmissions
    ];


    for (const record of allRecords) {

        const patient =
            record?.patient;


        if (!patient) {
            continue;
        }


        if (
            String(patient.id) ===
            String(bed.patient_id)
        ) {

            return patient;

        }

    }


    return null;
}
function naturalCompare(
    a,
    b
) {

    return String(a)
        .localeCompare(
            String(b),
            undefined,
            {
                numeric: true,
                sensitivity: "base"
            }
        );
}


function escapeAttribute(
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
        );

}


function closeRoomBedModal() {

    const modal =
        document.getElementById(
            "roomBedModal"
        );


    if (modal) {

        modal.classList.remove(
            "show"
        );

    }

}

/* =========================================================
   BED TILE
========================================================= */

function createBedTile(bed) {

    const status =
        getVisualBedStatus(bed);


    const cssClass =
        status === "AVAILABLE"
            ? "available"
            : status === "OCCUPIED"
                ? "occupied"
                : "pending";


    const bedNumber =
        getBedNumber(bed);


    const room =
        getRoomNumber(bed);


    return `
        <button
            class="bed-tile ${cssClass}"
            onclick="openBedDetails(${Number(
                bed.id
            )})"
            type="button"
        >

            <span class="bed-tile-status"></span>

            <div class="bed-tile-icon">
                ${status === "AVAILABLE"
                    ? "🛏"
                    : "🛌"}
            </div>

            <div class="bed-tile-number">
                ${escapeHTML(bedNumber)}
            </div>

            <div class="bed-tile-room">
                Room ${escapeHTML(room)}
            </div>

        </button>
    `;

}


/* =========================================================
   BED DETAILS
========================================================= */

function openBedDetails(bedId) {

    const bed =
        allBeds.find(
            item =>
                Number(item.id) ===
                Number(bedId)
        );


    if (!bed) {

        showToast(
            "Bed information not found",
            "error"
        );

        return;

    }


    const status =
        getVisualBedStatus(bed);


    setText(
        "modalBedNumber",
        getBedNumber(bed)
    );


    setText(
        "modalBedLocation",
        `${getWardName(bed)} • Room ${getRoomNumber(bed)}`
    );


    setText(
        "modalBedStatus",
        status
    );


    const icon =
        document.getElementById(
            "modalBedIcon"
        );


    if (icon) {

        icon.textContent =
            status === "AVAILABLE"
                ? "✓"
                : "●";

    }


    const content =
        document.getElementById(
            "modalBedContent"
        );


    if (!content) {
        return;
    }


    let patient = null;


    if (bed.patient_id) {

        patient =
            findPatientByInternalId(
                bed.patient_id
            );

    }


    if (
        status === "OCCUPIED" &&
        patient
    ) {

        content.innerHTML = `

            <div class="modal-info-grid">

                <div class="modal-info">

                    <span>
                        Patient
                    </span>

                    <strong>
                        ${escapeHTML(
                            patient.full_name ||
                            patient.name ||
                            "Patient"
                        )}
                    </strong>

                </div>


                <div class="modal-info">

                    <span>
                        Patient ID
                    </span>

                    <strong>
                        ${escapeHTML(
                            patient.patient_id ||
                            "—"
                        )}
                    </strong>

                </div>


                <div class="modal-info">

                    <span>
                        Ward
                    </span>

                    <strong>
                        ${escapeHTML(
                            getWardName(bed)
                        )}
                    </strong>

                </div>


                <div class="modal-info">

                    <span>
                        Bed
                    </span>

                    <strong>
                        ${escapeHTML(
                            getBedNumber(bed)
                        )}
                    </strong>

                </div>

            </div>

        `;

    } else if (status === "OCCUPIED") {

        content.innerHTML = `

            <div class="modal-info-grid">

                <div class="modal-info">

                    <span>
                        Status
                    </span>

                    <strong>
                        Occupied
                    </strong>

                </div>

                <div class="modal-info">

                    <span>
                        Patient Record
                    </span>

                    <strong>
                        Patient ID unavailable
                    </strong>

                </div>

                <div class="modal-info">

                    <span>
                        Ward
                    </span>

                    <strong>
                        ${escapeHTML(
                            getWardName(bed)
                        )}
                    </strong>

                </div>

                <div class="modal-info">

                    <span>
                        Room
                    </span>

                    <strong>
                        ${escapeHTML(
                            getRoomNumber(bed)
                        )}
                    </strong>

                </div>

            </div>

        `;

    } else if (status === "AVAILABLE") {

    content.innerHTML = `

        <div class="available-bed-panel">

            <div class="available-bed-icon">
                🛏
            </div>

            <h3>
                Bed Available
            </h3>

            <p>
                This bed is currently available
                for IPD admission.
            </p>

            <div class="modal-info-grid">

                <div class="modal-info">

                    <span>
                        Ward
                    </span>

                    <strong>
                        ${escapeHTML(
                            getWardName(bed)
                        )}
                    </strong>

                </div>


                <div class="modal-info">

                    <span>
                        Room
                    </span>

                    <strong>
                        ${escapeHTML(
                            getRoomNumber(bed)
                        )}
                    </strong>

                </div>


                <div class="modal-info">

                    <span>
                        Bed Number
                    </span>

                    <strong>
                        ${escapeHTML(
                            getBedNumber(bed)
                        )}
                    </strong>

                </div>


                <div class="modal-info">

                    <span>
                        Status
                    </span>

                    <strong>
                        AVAILABLE
                    </strong>

                </div>

            </div>

        </div>

    `;

} else {

    content.innerHTML = `
       
        <div class="modal-info-grid">

            <div class="modal-info">

                <span>
                    Status
                </span>

                <strong>
                    ${escapeHTML(status)}
                </strong>

            </div>

            <div class="modal-info">

                <span>
                    Ward
                </span>

                <strong>
                    ${escapeHTML(
                        getWardName(bed)
                    )}
                </strong>

            </div>

            <div class="modal-info">

                <span>
                    Room
                </span>

                <strong>
                    ${escapeHTML(
                        getRoomNumber(bed)
                    )}
                </strong>

            </div>

            <div class="modal-info">

                <span>
                    Bed Number
                </span>

                <strong>
                    ${escapeHTML(
                        getBedNumber(bed)
                    )}
                </strong>

            </div>

        </div>

    `;

}

}


/* =========================================================
   PATIENT SEARCH
========================================================= */

async function searchPatient() {

    const input =
        document.getElementById(
            "patientSearchInput"
        );


    const patientId =
        input?.value
            ?.trim()
            .toUpperCase();


    if (!patientId) {

        setSearchMessage(
            "Please enter a Patient ID.",
            "error"
        );

        return;

    }


    await performPatientSearch(
        patientId
    );

}


async function searchPatientFromSection() {

    const input =
        document.getElementById(
            "patientSearchInput2"
        );


    const patientId =
        input?.value
            ?.trim()
            .toUpperCase();


    if (!patientId) {

        showToast(
            "Please enter a Patient ID",
            "error"
        );

        return;

    }


    await performPatientSearch(
        patientId
    );

}


async function performPatientSearch(
    patientId
) {

    setSearchMessage(
        "Searching admission...",
        ""
    );


    try {

        /*
         * First search current IPD requests.
         */

        let found =
            findAdmissionByPatientId(
                allRequests,
                patientId
            );


        /*
         * If not found, search active admissions.
         */

        if (!found) {

            found =
                findAdmissionByPatientId(
                    allAdmissions,
                    patientId
                );

        }


        /*
         * Refresh request/admission data if necessary.
         */

        if (!found) {

            const results =
                await Promise.allSettled([

                    fetchJSON(
                        `${IPD_API}/requests`
                    ),

                    fetchJSON(
                        `${IPD_API}/admissions`
                    )

                ]);


            if (
                results[0].status ===
                "fulfilled"
            ) {

                allRequests =
                    Array.isArray(
                        results[0].value.requests
                    )
                        ? results[0].value.requests
                        : [];

            }


            if (
                results[1].status ===
                "fulfilled"
            ) {

                allAdmissions =
                    Array.isArray(
                        results[1].value.admissions
                    )
                        ? results[1].value.admissions
                        : [];

            }


            found =
                findAdmissionByPatientId(
                    allRequests,
                    patientId
                );


            if (!found) {

                found =
                    findAdmissionByPatientId(
                        allAdmissions,
                        patientId
                    );

            }

        }


        if (!found) {

            setSearchMessage(
                `No IPD admission found for ${patientId}.`,
                "error"
            );


            renderPatientNotFound(
                patientId
            );


            showToast(
                "Patient admission not found",
                "error"
            );

            return;

        }


        currentPatientAdmission =
            found;


        setSearchMessage(
            "Patient admission found.",
            "success"
        );


        renderPatientResult(
            found
        );


        showSection(
            "patientsSection"
        );


        showToast(
            "Patient admission found",
            "success"
        );

    } catch (error) {

        console.error(
            "Patient search error:",
            error
        );


        setSearchMessage(
            error.message ||
            "Patient search failed.",
            "error"
        );


        showToast(
            "Search failed",
            "error"
        );

    }

}


/* =========================================================
   FIND ADMISSION
========================================================= */

function findAdmissionByPatientId(
    list,
    patientId
) {

    if (!Array.isArray(list)) {
        return null;
    }


    const target =
        String(patientId)
            .trim()
            .toUpperCase();


    return (
        list.find(item => {

            const nestedPatientId =
                item?.patient?.patient_id;


            const directPatientId =
                item?.patient_id;


            return (
                String(
                    nestedPatientId || ""
                )
                    .trim()
                    .toUpperCase() ===
                target
            ) || (
                String(
                    directPatientId || ""
                )
                    .trim()
                    .toUpperCase() ===
                target
            );

        }) || null
    );

}


/* =========================================================
   PATIENT RESULT
========================================================= */

function renderPatientResult(
    admission
) {

    const container =
        document.getElementById(
            "patientResult"
        );


    if (!container) {
        return;
    }


    const patient =
        admission.patient || {};


    const patientName =
        patient.full_name ||
        patient.name ||
        "Patient";


    const patientId =
        patient.patient_id ||
        admission.patient_id ||
        "—";


    const admissionNumber =
        admission.admission_number ||
        admission.id ||
        "—";


    const ward =
        admission.ward_name ||
        admission.ward_type ||
        "—";


    const room =
        admission.room_number ||
        "Not assigned";


    const bed =
        admission.bed_number ||
        "Not assigned";


    const expectedDays =
        admission.expected_days ??
        "—";


    const dailyRate =
        admission.daily_rate;


    const estimatedCharge =
        admission.estimated_ward_charge;


    const paymentStatus =
        admission.payment_status ||
        "—";


    const billingStatus =
        admission.billing_status ||
        "—";


    const verificationStatus =
        admission.verification_status ||
        "—";


    const status =
        admission.status ||
        "—";


    const isVerified =
        verificationStatus ===
        "VERIFIED";


    const isPaid =
        String(
            paymentStatus
        ).toUpperCase() === "PAID";


    const canVerify =
        status === "IPD_VERIFICATION" &&
        isPaid;


    const canConfirm =
        isVerified &&
        isPaid &&
        Boolean(
            admission.bed_id
        );


    container.innerHTML = `

        <div class="patient-card">

            <div class="patient-card-header">

                <div class="patient-heading">

                    <div class="patient-mini-avatar">
                        ${escapeHTML(
                            getInitials(patientName)
                        )}
                    </div>

                    <div>

                        <h3>
                            ${escapeHTML(
                                patientName
                            )}
                        </h3>

                        <p>
                            ${escapeHTML(
                                patientId
                            )}
                            ·
                            Admission
                            ${escapeHTML(
                                String(
                                    admissionNumber
                                )
                            )}
                        </p>

                    </div>

                </div>


                <span class="admission-status">
                    ${escapeHTML(status)}
                </span>

            </div>


            <div class="patient-card-body">

                <div class="info-grid">

                    ${infoItem(
                        "Patient ID",
                        patientId
                    )}

                    ${infoItem(
                        "Ward",
                        ward
                    )}

                    ${infoItem(
                        "Room Number",
                        room
                    )}

                    ${infoItem(
                        "Bed Number",
                        bed
                    )}

                    ${infoItem(
                        "Expected Stay",
                        `${expectedDays} day(s)`
                    )}

                    ${infoItem(
                        "Daily Rate",
                        formatCurrency(dailyRate)
                    )}

                    ${infoItem(
                        "Estimated Ward Charge",
                        formatCurrency(
                            estimatedCharge
                        )
                    )}

                    ${infoItem(
                        "Payment",
                        paymentStatus
                    )}

                    ${infoItem(
                        "Billing",
                        billingStatus
                    )}

                    ${infoItem(
                        "Verification",
                        verificationStatus
                    )}

                </div>


                <div class="admission-flow">

                    <h4>
                        Admission Workflow
                    </h4>


                    <div class="flow-steps">

                        ${flowStep(
                            1,
                            "Doctor",
                            "IPD request",
                            true
                        )}

                        ${flowStep(
                            2,
                            "Billing",
                            isPaid
                                ? "Payment completed"
                                : "Payment pending",
                            isPaid
                        )}

                        ${flowStep(
                            3,
                            "IPD Verification",
                            isVerified
                                ? "Verified"
                                : "Awaiting verification",
                            isVerified,
                            !isVerified
                        )}

                        ${flowStep(
                            4,
                            "Admission",
                            status === "ADMITTED"
                                ? "Admitted"
                                : "Confirm admission",
                            status === "ADMITTED"
                        )}

                    </div>


                    <div class="action-row">

                        <button
                            class="action-button verify-button"
                            onclick="verifyAdmission(${Number(
                                admission.id
                            )})"
                            ${canVerify
                                ? ""
                                : "disabled"}
                        >
                            ✓ Verify Admission
                        </button>


                        <button
                            class="action-button confirm-button"
                            onclick="confirmAdmission(${Number(
                                admission.id
                            )})"
                            ${canConfirm
                                ? ""
                                : "disabled"}
                        >
                            ✓ Confirm Admission
                        </button>

                    </div>

                </div>

            </div>

        </div>

    `;


    /*
     * Also show modal for quick verification
     * when patient was found.
     */

    openPatientModal(
        admission
    );

}


/* =========================================================
   PATIENT MODAL
========================================================= */

function openPatientModal(
    admission
) {

    const patient =
        admission.patient || {};


    const name =
        patient.full_name ||
        patient.name ||
        "Patient";


    setText(
        "modalPatientName",
        name
    );


    setText(
        "modalPatientId",
        patient.patient_id ||
        admission.patient_id ||
        "—"
    );


    const content =
        document.getElementById(
            "patientModalContent"
        );


    if (!content) {
        return;
    }


    const payment =
        admission.payment_status ||
        "—";


    const verification =
        admission.verification_status ||
        "—";


    const status =
        admission.status ||
        "—";


    content.innerHTML = `

        <div class="modal-info-grid">

            <div class="modal-info">

                <span>
                    Ward
                </span>

                <strong>
                    ${escapeHTML(
                        admission.ward_name ||
                        admission.ward_type ||
                        "—"
                    )}
                </strong>

            </div>


            <div class="modal-info">

                <span>
                    Room
                </span>

                <strong>
                    ${escapeHTML(
                        admission.room_number ||
                        "Not assigned"
                    )}
                </strong>

            </div>


            <div class="modal-info">

                <span>
                    Bed
                </span>

                <strong>
                    ${escapeHTML(
                        admission.bed_number ||
                        "Not assigned"
                    )}
                </strong>

            </div>


            <div class="modal-info">

                <span>
                    Payment
                </span>

                <strong>
                    ${escapeHTML(payment)}
                </strong>

            </div>


            <div class="modal-info">

                <span>
                    Verification
                </span>

                <strong>
                    ${escapeHTML(
                        verification
                    )}
                </strong>

            </div>


            <div class="modal-info">

                <span>
                    Admission Status
                </span>

                <strong>
                    ${escapeHTML(status)}
                </strong>

            </div>

        </div>

    `;


    document
        .getElementById("patientModal")
        ?.classList.add("show");

}


/* =========================================================
   VERIFY ADMISSION
========================================================= */

async function verifyAdmission(
    admissionId
) {

    if (!admissionId) {

        showToast(
            "Invalid admission ID",
            "error"
        );

        return;

    }
    const admission =
    [...allRequests, ...allAdmissions]
        .find(item =>
            Number(item.id) === Number(admissionId)
        );

if (!admission) {
    showToast(
        "Admission record not found",
        "error"
    );
    return;
}

const paymentStatus =
    String(
        admission.payment_status || ""
    ).toUpperCase();

const bedId =
    admission.bed_id;

if (paymentStatus !== "PAID") {
    showToast(
        "Payment must be completed before verification.",
        "error"
    );
    return;
}

if (!bedId) {
    showToast(
        "No bed has been assigned to this admission.",
        "error"
    );
    return;
}
    
    const userId =
        localStorage.getItem(
            "user_id"
        ) ||
        localStorage.getItem(
            "username"
        ) ||
        "IPD_STAFF";


    try {

        showToast(
            "Verifying admission...",
            "info"
        );


        const result =
            await fetchJSON(
                `${IPD_API}/request/${admissionId}/verify`,
                {
                    method: "PUT",

                    body: JSON.stringify({
                        verified_by: userId
                    })
                }
            );


        showToast(
            result.message ||
            "Admission verified successfully",
            "success"
        );


        await loadDashboard();


        /*
         * Search the same patient again
         * so UI updates immediately.
         */

        if (
            currentPatientAdmission?.patient
                ?.patient_id
        ) {

            await performPatientSearch(
                currentPatientAdmission
                    .patient
                    .patient_id
            );

        }

    } catch (error) {

        console.error(
            "Verify admission error:",
            error
        );


        showToast(
            error.message ||
            "Unable to verify admission",
            "error"
        );

    }

}


/* =========================================================
   CONFIRM ADMISSION
========================================================= */
async function confirmAdmission(admissionId) {

    if (!admissionId) {
        showToast(
            "Invalid admission ID",
            "error"
        );
        return;
    }

    /*
     * Find the current admission from loaded data.
     */
    const admission =
        [...allRequests, ...allAdmissions]
            .find(item =>
                Number(item.id) === Number(admissionId)
            );

    if (!admission) {
        showToast(
            "Admission record not found",
            "error"
        );
        return;
    }

    /*
     * Safety checks before confirmation.
     */
    const paymentStatus =
        String(
            admission.payment_status || ""
        ).toUpperCase();

    const verificationStatus =
        String(
            admission.verification_status || ""
        ).toUpperCase();

    const bedId =
        admission.bed_id;

    if (paymentStatus !== "PAID") {
        showToast(
            "Admission cannot be confirmed. Payment is not completed.",
            "error"
        );
        return;
    }

    if (verificationStatus !== "VERIFIED") {
        showToast(
            "Please verify the admission before confirmation.",
            "error"
        );
        return;
    }

    if (!bedId) {
        showToast(
            "No bed has been assigned to this admission.",
            "error"
        );
        return;
    }

    /*
     * Find assigned bed.
     */
    const assignedBed =
        allBeds.find(
            bed =>
                Number(bed.id) === Number(bedId)
        );

    if (!assignedBed) {
        showToast(
            "Assigned bed could not be found.",
            "error"
        );
        return;
    }

    /*
     * Final frontend availability check.
     * Backend also performs the final check.
     */
    const bedStatus =
        getVisualBedStatus(
            assignedBed
        );

    if (bedStatus !== "AVAILABLE") {
        showToast(
            `Bed ${getBedNumber(assignedBed)} is no longer available.`,
            "error"
        );

        await loadDashboard();

        return;
    }

    /*
     * Confirm with IPD staff.
     */
    const confirmed =
        window.confirm(
            `Confirm IPD admission?\n\n` +
            `Patient: ${
                admission.patient?.full_name ||
                "Patient"
            }\n` +
            `Patient ID: ${
                admission.patient?.patient_id ||
                admission.patient_id ||
                "—"
            }\n` +
            `Ward: ${
                admission.ward_name ||
                admission.ward_type ||
                "—"
            }\n` +
            `Room: ${
                admission.room_number ||
                "—"
            }\n` +
            `Bed: ${
                admission.bed_number ||
                getBedNumber(assignedBed)
            }\n\n` +
            `The bed will become OCCUPIED.`
        );

    if (!confirmed) {
        return;
    }

    const userId =
        localStorage.getItem("user_id") ||
        localStorage.getItem("username") ||
        "IPD_STAFF";

    try {

        showToast(
            "Confirming IPD admission...",
            "info"
        );

        const result =
            await fetchJSON(
                `${IPD_API}/request/${admissionId}/confirm`,
                {
                    method: "PUT",

                    body: JSON.stringify({
                        admitted_by: userId
                    })
                }
            );

        showToast(
            result.message ||
            "IPD admission confirmed successfully",
            "success"
        );

        /*
         * Close patient modal.
         */
        document
            .getElementById("patientModal")
            ?.classList.remove("show");

        /*
         * Clear current search result.
         */
        currentPatientAdmission = null;

        /*
         * Reload everything.
         *
         * This is important because:
         * AVAILABLE → OCCUPIED
         */
        await loadDashboard();

    } catch (error) {

        console.error(
            "Confirm admission error:",
            error
        );

        showToast(
            error.message ||
            "Unable to confirm IPD admission",
            "error"
        );
    }
}


/* =========================================================
   FLOW STEP
========================================================= */

function flowStep(
    number,
    title,
    subtitle,
    done,
    current = false
) {

    const className =
        done
            ? "done"
            : current
                ? "current"
                : "";


    return `
        <div class="flow-step ${className}">

            <div class="flow-step-number">
                ${done ? "✓" : number}
            </div>

            <strong>
                ${escapeHTML(title)}
            </strong>

            <span>
                ${escapeHTML(subtitle)}
            </span>

        </div>
    `;

}


/* =========================================================
   INFO ITEM
========================================================= */

function infoItem(
    label,
    value
) {

    return `
        <div class="info-item">

            <span>
                ${escapeHTML(label)}
            </span>

            <strong>
                ${escapeHTML(
                    String(value ?? "—")
                )}
            </strong>

        </div>
    `;

}


/* =========================================================
   PROFILE
========================================================= */

function loadProfile() {

    const userId =
        localStorage.getItem(
            "user_id"
        ) ||
        localStorage.getItem(
            "employee_id"
        ) ||
        localStorage.getItem(
            "username"
        ) ||
        "IPD001";


    const username =
        localStorage.getItem(
            "username"
        ) ||
        "IPD Staff";


    const role =
        localStorage.getItem(
            "role"
        ) ||
        "IPD STAFF";


    const email =
        localStorage.getItem(
            "email"
        ) ||
        "—";


    const phone =
        localStorage.getItem(
            "phone"
        ) ||
        "—";


    const displayName =
        localStorage.getItem(
            "full_name"
        ) ||
        localStorage.getItem(
            "name"
        ) ||
        username;


    setText(
        "topUserName",
        displayName
    );


    setText(
        "topUserRole",
        role
    );


    setText(
        "profileName",
        displayName
    );


    setText(
        "profileRole",
        role
    );


    setText(
        "profileUserId",
        userId
    );


    setText(
        "profileUsername",
        username
    );


    setText(
        "profileEmail",
        email
    );


    setText(
        "profilePhone",
        phone
    );


    const initials =
        getInitials(displayName);


    setText(
        "topAvatar",
        initials
    );


    setText(
        "profileAvatar",
        initials
    );

}


/* =========================================================
   NAVIGATION
========================================================= */

function showSection(
    sectionId,
    button = null
) {

    document
        .querySelectorAll(
            ".page-section"
        )
        .forEach(section => {

            section.classList.remove(
                "active-section"
            );

        });


    const target =
        document.getElementById(
            sectionId
        );


    if (target) {

        target.classList.add(
            "active-section"
        );

    }


    document
        .querySelectorAll(
            ".nav-item"
        )
        .forEach(item => {

            item.classList.remove(
                "active"
            );

        });


    if (button) {

        button.classList.add(
            "active"
        );

    } else {

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


    document
        .querySelector(
            ".sidebar"
        )
        ?.classList.remove(
            "open"
        );


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


/* =========================================================
   PAGE TITLE
========================================================= */

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


    if (!title || !subtitle) {
        return;
    }


    if (
        sectionId ===
        "patientsSection"
    ) {

        title.textContent =
            "Patient Admission Search";

        subtitle.textContent =
            "Locate and verify inpatient admissions";

    } else if (
        sectionId ===
        "profileSection"
    ) {

        title.textContent =
            "My Profile";

        subtitle.textContent =
            "IPD staff account information";

    } else {

        title.textContent =
            "IPD Command Center";

        subtitle.textContent =
            "Real-time inpatient bed and admission management";

    }

}


/* =========================================================
   MOBILE SIDEBAR
========================================================= */

function toggleSidebar() {

    document
        .querySelector(
            ".sidebar"
        )
        ?.classList.toggle(
            "open"
        );

}


/* =========================================================
   LOGOUT
========================================================= */

function logoutUser() {

    const confirmed =
        window.confirm(
            "Are you sure you want to logout?"
        );


    if (!confirmed) {
        return;
    }


    /*
     * Keep this generic.
     * Remove only login-session values.
     */

    localStorage.removeItem("user_id");
    localStorage.removeItem("username");
    localStorage.removeItem("role");
    localStorage.removeItem("email");
    localStorage.removeItem("phone");
    localStorage.removeItem("full_name");
    localStorage.removeItem("name");


    window.location.href =
        "login.html";

}


/* =========================================================
   BED STATUS
========================================================= */

function normalizeStatus(
    status
) {

    return String(
        status || ""
    )
        .trim()
        .toUpperCase()
        .replace(/[\s-]+/g, "_");

}


function getVisualBedStatus(
    bed
) {

    const status =
        normalizeStatus(
            bed.status
        );


    if (status === "AVAILABLE") {
        return "AVAILABLE";
    }


    if (
        status === "OCCUPIED" ||
        status === "BOOKED"
    ) {
        return "OCCUPIED";
    }


    if (
        status === "RESERVED" ||
        status === "PENDING"
    ) {
        return "PENDING";
    }


    /*
     * If backend sends an unknown status,
     * don't falsely mark the bed as available.
     */

    return "PENDING";

}


/* =========================================================
   DATA HELPERS
========================================================= */

function getWardName(
    bed
) {

    return (
        bed.ward ||
        bed.ward_name ||
        bed.ward_type ||
        "Unassigned Ward"
    );

}


function getRoomNumber(
    bed
) {

    return (
        bed.room_number ||
        bed.room ||
        "—"
    );

}


function getBedNumber(
    bed
) {

    return (
        bed.bed_number ||
        bed.bed_no ||
        bed.number ||
        `BED-${bed.id || "—"}`
    );

}


/* =========================================================
   INTERNAL PATIENT LOOKUP
========================================================= */

function findPatientByInternalId(
    internalId
) {

    const all =
        [
            ...allRequests,
            ...allAdmissions
        ];


    for (const item of all) {

        const patient =
            item?.patient;


        if (
            patient &&
            String(patient.id) ===
            String(internalId)
        ) {

            return patient;

        }

    }


    return null;

}


/* =========================================================
   SEARCH MESSAGE
========================================================= */

function setSearchMessage(
    message,
    type
) {

    const element =
        document.getElementById(
            "searchMessage"
        );


    if (!element) {
        return;
    }


    element.textContent =
        message || "";


    element.className =
        "search-message";


    if (type) {

        element.classList.add(
            type
        );

    }

}


/* =========================================================
   PATIENT NOT FOUND
========================================================= */

function renderPatientNotFound(
    patientId
) {

    const container =
        document.getElementById(
            "patientResult"
        );


    if (!container) {
        return;
    }


    container.innerHTML = `

        <div class="empty-result">

            <div class="empty-icon">
                !
            </div>

            <h3>
                Admission Not Found
            </h3>

            <p>
                No current IPD admission was found
                for
                <strong>
                    ${escapeHTML(patientId)}
                </strong>.
            </p>

        </div>

    `;

}


/* =========================================================
   KEYBOARD SEARCH
========================================================= */

function handlePatientSearchKey(
    event
) {

    if (
        event.key ===
        "Enter"
    ) {

        searchPatient();

    }

}


function handlePatientSearchKey2(
    event
) {

    if (
        event.key ===
        "Enter"
    ) {

        searchPatientFromSection();

    }

}


function setupEnterKey() {

    const input =
        document.getElementById(
            "patientSearchInput"
        );


    if (input) {

        input.addEventListener(
            "keydown",
            event => {

                if (
                    event.key ===
                    "Enter"
                ) {

                    searchPatient();

                }

            }
        );

    }

}


/* =========================================================
   MODAL CLOSE
========================================================= */

function closeBedModal(
    event
) {

    if (
        event &&
        event.target !==
        event.currentTarget
    ) {

        return;

    }


    document
        .getElementById(
            "bedModal"
        )
        ?.classList.remove(
            "show"
        );

}


function closePatientModal(
    event
) {

    if (
        event &&
        event.target !==
        event.currentTarget
    ) {

        return;

    }


    document
        .getElementById(
            "patientModal"
        )
        ?.classList.remove(
            "show"
        );

}


/* =========================================================
   TOAST
========================================================= */

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


    if (icon) {

        icon.textContent =
            type === "error"
                ? "!"
                : type === "info"
                    ? "i"
                    : "✓";

    }


    toast.classList.add(
        "show"
    );


    clearTimeout(
        toastTimer
    );


    toastTimer =
        setTimeout(
            () => {

                toast.classList.remove(
                    "show"
                );

            },
            3000
        );

}


/* =========================================================
   DASHBOARD LOADING STATE
========================================================= */

function showDashboardLoading() {

    const container =
        document.getElementById(
            "bedCommandCenter"
        );


    if (
        container &&
        !allBeds.length
    ) {

        container.innerHTML = `

            <div class="ward-bed-section">

                <div class="loading-state">

                    <div class="loading-spinner"></div>

                    Loading live bed command center...

                </div>

            </div>

        `;

    }

}


/* =========================================================
   FORMATTERS
========================================================= */

function formatCurrency(
    value
) {

    const number =
        Number(value);


    if (
        Number.isNaN(number)
    ) {

        return "₹ —";

    }


    return new Intl.NumberFormat(
        "en-IN",
        {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0
        }
    ).format(number);

}


function getInitials(
    name
) {

    const words =
        String(name || "")
            .trim()
            .split(/\s+/)
            .filter(Boolean);


    if (!words.length) {
        return "IP";
    }


    if (words.length === 1) {

        return words[0]
            .substring(0, 2)
            .toUpperCase();

    }


    return (
        words[0][0] +
        words[words.length - 1][0]
    ).toUpperCase();

}


/* =========================================================
   SAFE HTML
========================================================= */

function escapeHTML(
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


/* =========================================================
   SET TEXT
========================================================= */

function setText(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );


    if (element) {

        element.textContent =
            value ?? "";

    }

}


/* =========================================================
   GLOBAL ESCAPE KEY
========================================================= */

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key !==
            "Escape"
        ) {

            return;

        }


        closeBedModal();

        closePatientModal();

    }
);


/* ============================================================
   IPD NOTIFICATION SYSTEM
   ============================================================ */

let ipdNotificationTimer = null;
let ipdNotificationsLoaded = false;


/* ------------------------------------------------------------
   GET CURRENT IPD USER
   ------------------------------------------------------------ */
function getIPDUserId() {
    return (
        localStorage.getItem("user_id") ||
        localStorage.getItem("userId") ||
        localStorage.getItem("username") ||
        ""
    );
}


/* ------------------------------------------------------------
   START NOTIFICATION POLLING
   ------------------------------------------------------------ */
function startIPDNotificationPolling() {

    // Prevent duplicate timers
    if (ipdNotificationTimer) {
        clearInterval(ipdNotificationTimer);
    }

    // Load immediately
    loadIPDNotifications();

    // Check every 30 seconds
    ipdNotificationTimer = setInterval(() => {
        loadIPDNotifications();
    }, 30000);
}


/* ------------------------------------------------------------
   LOAD IPD NOTIFICATIONS
   ------------------------------------------------------------ */
async function loadIPDNotifications() {

    const userId = getIPDUserId();

    if (!userId) {
        console.warn("IPD notification: user ID not found.");
        return;
    }

    try {

        const response = await fetch(
            `${API_BASE_URL}/api/notifications/ipd?user_id=${encodeURIComponent(userId)}`
        );

        if (!response.ok) {
            console.warn(
                "IPD notification API returned:",
                response.status
            );
            return;
        }

        const data = await response.json();

        if (!data.success) {
            console.warn(
                "IPD notification request failed:",
                data.message
            );
            return;
        }

        renderIPDNotifications(data.notifications || []);

    } catch (error) {

        console.warn(
            "IPD notification loading failed:",
            error
        );
    }
}


/* ------------------------------------------------------------
   RENDER NOTIFICATIONS
   ------------------------------------------------------------ */
function renderIPDNotifications(notifications) {

    const list = document.getElementById("ipdNotificationList");
    const badge = document.getElementById("ipdNotificationCount");

    if (!list) {
        return;
    }

    const unreadCount = notifications.filter(
        notification => !notification.is_read
    ).length;

    if (badge) {
        badge.textContent = unreadCount > 99 ? "99+" : unreadCount;

        badge.style.display =
            unreadCount > 0 ? "flex" : "none";
    }

    if (!notifications.length) {

        list.innerHTML = `
            <div class="notification-empty">
                <div class="notification-empty-icon">🔔</div>
                <strong>No notifications</strong>
                <span>You're all caught up.</span>
            </div>
        `;

        return;
    }

    list.innerHTML = notifications.map(notification => {

        const title =
            notification.title ||
            "IPD Notification";

        const message =
            notification.message ||
            "New IPD update received.";

        const time =
            notification.created_at ||
            "";

        const unreadClass =
            notification.is_read
                ? ""
                : " unread";

        return `
            <div
                class="ipd-notification-item${unreadClass}"
                data-notification-id="${notification.id || ""}"
            >

                <div class="notification-item-icon">
                    🏥
                </div>

                <div class="notification-item-content">

                    <div class="notification-item-title">
                        ${escapeIPDNotificationText(title)}
                    </div>

                    <div class="notification-item-message">
                        ${escapeIPDNotificationText(message)}
                    </div>

                    ${
                        time
                            ? `
                                <div class="notification-item-time">
                                    ${escapeIPDNotificationText(time)}
                                </div>
                              `
                            : ""
                    }

                </div>

            </div>
        `;

    }).join("");
}


/* ------------------------------------------------------------
   TOGGLE NOTIFICATION PANEL
   ------------------------------------------------------------ */
function toggleIPDNotifications() {

    const panel =
        document.getElementById("ipdNotificationPanel");

    if (!panel) {
        console.warn(
            "IPD notification panel not found."
        );
        return;
    }

    const isOpen =
        panel.classList.contains("show");

    if (isOpen) {
        panel.classList.remove("show");
    } else {
        panel.classList.add("show");

        // Refresh when opened
        loadIPDNotifications();
    }
}


/* ------------------------------------------------------------
   CLOSE NOTIFICATION PANEL WHEN CLICKING OUTSIDE
   ------------------------------------------------------------ */
document.addEventListener("click", function(event) {

    const wrapper =
        document.querySelector(".ipd-notification-wrapper");

    const panel =
        document.getElementById("ipdNotificationPanel");

    if (!wrapper || !panel) {
        return;
    }

    if (!wrapper.contains(event.target)) {
        panel.classList.remove("show");
    }

});


/* ------------------------------------------------------------
   SAFE TEXT ESCAPE
   ------------------------------------------------------------ */
function escapeIPDNotificationText(value) {

    const div = document.createElement("div");

    div.textContent = value ?? "";

    return div.innerHTML;
}
/* ============================================================
   MARK ALL IPD NOTIFICATIONS AS READ
   ============================================================ */

async function markAllIPDNotificationsRead() {

    const userId = getIPDUserId();

    if (!userId) {
        console.warn(
            "IPD notification: user ID not found."
        );
        return;
    }

    try {

        const response = await fetch(
            `${API_BASE_URL}/api/notifications/ipd/read-all?user_id=${encodeURIComponent(userId)}`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                }
            }
        );

        const data = await response.json();

        console.log(
            "IPD mark-all-read response:",
            data
        );

        if (!response.ok || !data.success) {

            throw new Error(
                data.message ||
                "Unable to mark notifications as read."
            );
        }

        /*
         * Reload notifications so the badge
         * immediately becomes hidden.
         */
        await loadIPDNotifications();

        /*
         * Close notification panel.
         */
        const panel =
            document.getElementById(
                "ipdNotificationPanel"
            );

        if (panel) {
            panel.classList.remove("show");
        }

        /*
         * Optional success message.
         */
        showToast(
            "All notifications marked as read.",
            "success"
        );

    } catch (error) {

        console.error(
            "Mark all IPD notifications error:",
            error
        );

        showToast(
            error.message ||
            "Unable to mark notifications as read.",
            "error"
        );
    }
}


/* ============================================================
   EXPOSE FUNCTION FOR HTML onclick=""
   ============================================================ */

window.markAllIPDNotificationsRead =
    markAllIPDNotificationsRead;