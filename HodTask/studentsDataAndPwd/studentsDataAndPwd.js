const viewDataBtn = document.getElementById("viewDataBtn");
const resetPwdBtn = document.getElementById("resetPwdBtn");
const filters = document.getElementById("filters");
const yearSelect = document.getElementById("yearSelect");
const branchSelect = document.getElementById("branchSelect");
const table = document.getElementById("dataTable");
const role = localStorage.getItem("role");
const hodId = localStorage.getItem("hodId");
const sessionValue = localStorage.getItem("key");
const exportBtn = document.getElementById("exportCSVBtn"); 
const printBtn  = document.getElementById("printBtn");   
const tableActions = document.querySelector(".actions");
function showMessage(message, type = "info", autoHide = true) {
    const msgEl = document.getElementById("uiMessage");
    if (!msgEl) return;

    msgEl.textContent = message;
    msgEl.className = `ui-message ${type}`;
    msgEl.classList.remove("hidden");

    if (autoHide) {
        setTimeout(() => {
            msgEl.classList.add("hidden");
        }, 3000); 
    }
}
function setTableActionButtons(enabled) {
    if (exportBtn) exportBtn.disabled = !enabled;
    if (printBtn)  printBtn.disabled  = !enabled;
}
function toggleTableActions(show) {
    const actions = document.querySelector(".actions");
    if (!actions) return;

    actions.style.display = show ? "flex" : "none";
}


let currentMode = ""; // view | reset

const hodBranch = localStorage.getItem("hodBranch"); 
const hodYears = JSON.parse(localStorage.getItem("hodYears")); 
document.addEventListener("DOMContentLoaded", function () {
    fetchYears();
});

async function fetchYears() {
    try {
    const storedYears = localStorage.getItem("hodYears");
    if (!storedYears) {
        showMessage("No HOD years found.", "error");
        return;
    }

    let parsedYears;
    try {
        parsedYears = JSON.parse(storedYears);
    } catch (e) {
        parsedYears = storedYears.split(",");
    }

    // Convert to numbers
    const years = parsedYears.map(year => parseInt(year, 10));

    const yearSelect = document.getElementById("yearSelect");
    yearSelect.innerHTML = `<option value="">Select Year</option>`;

    years.forEach(year => {
        yearSelect.innerHTML += `<option value="${year}">${year} Year</option>`;
    });

    yearSelect.addEventListener("change", fetchBranches);
} catch (error) {
    showMessage("Error loading years.", "error");
}

}
viewDataBtn.onclick = async () => {
    currentMode = "view";
    filters.classList.remove("hidden");
    toggleTableActions(true);
    setTableActionButtons(true);

    const year = yearSelect.value;
    const branch = branchSelect.value;

    table.querySelector("thead").innerHTML = "";
    table.querySelector("tbody").innerHTML = "";

    if (!year || !branch) {
        showMessage("Please select Year and Section", "info");
        return;
    }

    const res = await fetch(
        `/hod/student-profiles/${role}/${hodId}?year=${year}&branch=${branch}`,
        { headers: { "x-session-key": sessionValue } }
    );

    const data = await res.json();
    renderStudentTable(data);
};


/* ===========================
   RESET PASSWORD VIEW
=========================== */
resetPwdBtn.onclick = async () => {
    currentMode = "reset";
    filters.classList.add("hidden");
    toggleTableActions(false);
    setTableActionButtons(false);
    const res = await fetch(`/hod/reset-password-students/${role}/${hodId}`,
        {
                 headers: {
                "x-session-key": sessionValue
            }
            }
    );
    const data = await res.json();

    renderResetTable(data);
};

/* ===========================
   LOAD BRANCHES (HOD ONLY)
=========================== */
yearSelect.addEventListener("change", async () => {
    branchSelect.innerHTML = `<option value="">Select Branch</option>`;

    if (!yearSelect.value) return;

    const res = await fetch(
        `/hod/branches/${role}/${hodId}?year=${yearSelect.value}&hodBranch=${hodBranch}`,
        {
                 headers: {
                "x-session-key": sessionValue
            }
            }
    );
    const data = await res.json();

    data.branches.forEach(b => {
        branchSelect.innerHTML += `<option value="${b}">${b}</option>`;
    });
});



/* ===========================
   RENDER STUDENT PROFILE TABLE
=========================== */
function renderStudentTable(rows) {
    const thead = table.querySelector("thead");
    const tbody = table.querySelector("tbody");

    tbody.innerHTML = "";
    thead.innerHTML = "";

    if (!rows || rows.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="23" class="no-data">
                    No students available
                </td>
            </tr>
        `;
        tableActions.classList.add("hidden"); 
        return;
    }

    thead.innerHTML = `
        <tr>
            <th>Photo</th>
            <th>HTNO</th>
            <th>Full Name</th>
            <th>Year</th>
            <th>Branch</th>
            <th>Batch</th>
            <th>DOB</th>
            <th>Gender</th>
            <th>Admission Type</th>
            <th>Status</th>
            <th>Student Mobile</th>
            <th>Email</th>
            <th>Current Address</th>
            <th>Permanent Address</th>
            <th>Father Name</th>
            <th>Mother Name</th>
            <th>Parent Mobile</th>
            <th>Guardian Name</th>
            <th>Guardian Relation</th>
            <th>Guardian Mobile</th>
            <th>Blood Group</th>
            <th>Nationality</th>
            <th>Religion</th>
        </tr>
    `;

    rows.forEach(r => {
        tbody.innerHTML += `
            <tr>
                <td>
                    <img
                        src="/hod/studentProfile/photo/${r.htno}/${role}/${hodId}?sessionValue=${sessionValue}"
                        class="profile-img"
                        onerror="this.src='default.png'"
                    />
                </td>
                <td>${r.htno}</td>
                <td>${r.full_name}</td>
                <td>${r.year}</td>
                <td>${r.branch}</td>
                <td>${r.batch || ""}</td>
                <td>${r.dob ? r.dob.split("T")[0] : ""}</td>
                <td>${r.gender || ""}</td>
                <td>${r.admission_type || ""}</td>
                <td>${r.current_status || ""}</td>
                <td>${r.student_mobile || ""}</td>
                <td>${r.email || ""}</td>
                <td>${r.current_address || ""}</td>
                <td>${r.permanent_address || ""}</td>
                <td>${r.father_name || ""}</td>
                <td>${r.mother_name || ""}</td>
                <td>${r.parent_mobile || ""}</td>
                <td>${r.guardian_name || ""}</td>
                <td>${r.guardian_relation || ""}</td>
                <td>${r.guardian_mobile || ""}</td>
                <td>${r.blood_group || ""}</td>
                <td>${r.nationality || ""}</td>
                <td>${r.religion || ""}</td>
            </tr>
        `;
    });

    tableActions.classList.remove("hidden"); 
}

/* ===========================
   RENDER RESET PASSWORD TABLE
=========================== */
function renderResetTable(rows) {
    const thead = table.querySelector("thead");
    const tbody = table.querySelector("tbody");

    if (!rows || rows.length === 0) {
        thead.innerHTML = "";
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align:center;">
                    No students available for password reset
                </td>
            </tr>
        `;
        return;
    }

    thead.innerHTML = `
        <tr>
            <th>HTNO</th>
            <th>Full Name</th>
            <th>Year</th>
            <th>Branch</th>
            <th>Temporary Password</th>
            <th>Action</th>
        </tr>
    `;

    tbody.innerHTML = rows.map(r => `
        <tr>
            <td>${r.htno}</td>
            <td>${r.full_name}</td>
            <td>${r.year}</td>
            <td>${r.branch}</td>
            <td>
                <input type="password"
                       id="pwd_${r.htno}"
                       placeholder="Temp password">
            </td>
            <td>
                <button onclick="updateStudentPassword('${r.htno}')">
                    Update
                </button>
            </td>
        </tr>
    `).join("");
}

async function updateStudentPassword(htno) {
    const pwdInput = document.getElementById(`pwd_${htno}`);
    const tempPassword = pwdInput.value.trim();

    if (!tempPassword) {
        showMessage("Enter temporary password", "info");
        return;
    }


    const res = await fetch(`/hod/update-student-password/${role}/${hodId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-session-key": sessionValue },
        body: JSON.stringify({
            htno,
            tempPassword
        })
    });

    const data = await res.json();

    if (data.success) {
        showMessage("Temporary password set successfully", "success");
        pwdInput.value = "";
    } else {
        showMessage(data.message || "Failed to update password", "error");
    }
}

function exportStudentCSV() {
    const table = document.querySelector("table");
    if (!table) {
        showMessage("No table data to export", "info");
        return;
    }

    let csv = [];
    for (const row of table.rows) {
        let cols = [];
        for (const cell of row.cells) {
            if (cell.querySelector("img")) {
                cols.push(""); // skip photo in CSV
            } else {
                cols.push(`"${cell.innerText.replace(/"/g, '""')}"`);
            }
        }
        csv.push(cols.join(","));
    }

    const blob = new Blob([csv.join("\n")], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "student_personal_data.csv";
    link.click();
}

function printStudentTable() {

    const wrapper = document.querySelector(".table-wrapper");
    if (!wrapper || !wrapper.innerHTML.trim()) {
        showMessage("No data to print", "error");
        return;
    }

    const win = window.open("", "_blank");

    win.document.open();
    win.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Student Personal Data</title>
            <style>

                /* FORCE LANDSCAPE MODE */
                @page {
                    size: A4 landscape;
                    margin: 10mm;
                }

                body {
                    font-family: Arial, sans-serif;
                    text-align: center;
                    margin: 0;
                }

                /* ✅ BALAJI LOGO – FULL WIDTH */
                .logo {
                    display: block;
                    width: 100%;
                    max-width: 100%;
                    height: auto;
                    max-height: 140px;   /* adjust if needed */
                    object-fit: contain;
                    margin: 0 auto 8px;
                }

                h2 {
                    margin: 6px 0 12px;
                    font-size: 18px;
                }

                table {
                    width: 100%;
                    border-collapse: collapse;
                    table-layout: fixed;
                }

                th, td {
                    border: 1px solid #000;
                    padding: 4px;
                    font-size: 9px;
                    word-wrap: break-word;
                }

                th {
                    background: #f0f0f0;
                    font-weight: 700;
                }

                /* PREVENT ROW BREAKS */
                tr {
                    page-break-inside: avoid;
                }

                /* ✅ PROFILE PHOTOS ONLY (NOT LOGO) */
                table img {
                    width: 35px;
                    height: 35px;
                    border-radius: 50%;
                    object-fit: cover;
                }

            </style>
        </head>

        <body onload="window.print(); window.close();">

            <!-- BALAJI LOGO -->
            <img src="/balaji.png" alt="Balaji Institute Logo" class="logo">

            <h2>Student Personal Data</h2>

            ${wrapper.innerHTML}

        </body>
        </html>
    `);

    win.document.close();
}

const logoutBtn = document.getElementById("logoutBtn");
    // logout
    if (logoutBtn) {
    logoutBtn.addEventListener("click", async function () {

        const role = localStorage.getItem("role");
        const userId = localStorage.getItem("hodId");
        const sessionValue = localStorage.getItem("key");
        try {
            await fetch("/logout", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ role, userId, sessionValue })
            });
        } catch (err) {
            console.error("Logout API failed:", err);
        }
        localStorage.clear();

        window.location.href = "/";
    });
    }