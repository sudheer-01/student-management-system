const viewDataBtn = document.getElementById("viewDataBtn");
const resetPwdBtn = document.getElementById("resetPwdBtn");
const filters = document.getElementById("filters");
const yearSelect = document.getElementById("yearSelect");
const branchSelect = document.getElementById("branchSelect");
const table = document.getElementById("dataTable");

let currentMode = ""; // view | reset

// HOD info from localStorage
const hodBranch = localStorage.getItem("hodBranch"); // e.g., CSM
const hodYears = JSON.parse(localStorage.getItem("hodYears")); // ["3","4"]

/* ===========================
   VIEW STUDENT DATA
=========================== */
viewDataBtn.onclick = () => {
    currentMode = "view";
    filters.classList.remove("hidden");
    table.querySelector("thead").innerHTML = "";
    table.querySelector("tbody").innerHTML = "";
};

/* ===========================
   RESET PASSWORD VIEW
=========================== */
resetPwdBtn.onclick = async () => {
    currentMode = "reset";
    filters.classList.add("hidden");

    const res = await fetch("/hod/reset-password-students");
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
        `/hod/branches?year=${yearSelect.value}&hodBranch=${hodBranch}`
    );
    const data = await res.json();

    data.branches.forEach(b => {
        branchSelect.innerHTML += `<option value="${b}">${b}</option>`;
    });
});

/* ===========================
   LOAD STUDENT DATA
=========================== */
branchSelect.addEventListener("change", async () => {
    if (!yearSelect.value || !branchSelect.value) return;

    const res = await fetch(
        `/hod/student-profiles?year=${yearSelect.value}&branch=${branchSelect.value}`
    );
    const data = await res.json();

    renderStudentTable(data);
});

/* ===========================
   RENDER STUDENT PROFILE TABLE
=========================== */
function renderStudentTable(rows) {
    const thead = table.querySelector("thead");
    const tbody = table.querySelector("tbody");

    if (!rows || rows.length === 0) {
        thead.innerHTML = "";
        tbody.innerHTML = `
            <tr>
                <td colspan="20" style="text-align:center;">
                    No students available
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

    tbody.innerHTML = rows.map(r => `
        <tr>
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
    `).join("");
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
        alert("Enter temporary password");
        return;
    }

    const confirmUpdate = confirm(
        "Are you sure you want to set this temporary password?"
    );
    if (!confirmUpdate) return;

    const res = await fetch("/hod/update-student-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            htno,
            tempPassword
        })
    });

    const data = await res.json();

    if (data.success) {
        alert("Temporary password set successfully");
        pwdInput.value = "";
    } else {
        alert(data.message || "Failed to update password");
    }
}


const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
        logoutBtn.addEventListener("click", function () {
            if (!confirm("Log out?")) return;
            fetch("/logout", { method: "POST" })
                .then(() => { window.location.href = "/"; })
                .catch(() => { window.location.href = "/"; });
        });
    }