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
    if (!rows.length) return;

    const thead = table.querySelector("thead");
    const tbody = table.querySelector("tbody");

    thead.innerHTML = `
        <tr>
            <th>HTNO</th>
            <th>Full Name</th>
            <th>Year</th>
            <th>Branch</th>
            <th>Email</th>
            <th>Mobile</th>
        </tr>
    `;

    tbody.innerHTML = rows.map(r => `
        <tr>
            <td>${r.htno}</td>
            <td>${r.full_name}</td>
            <td>${r.year}</td>
            <td>${r.branch}</td>
            <td>${r.email || ""}</td>
            <td>${r.student_mobile || ""}</td>
        </tr>
    `).join("");
}

/* ===========================
   RENDER RESET PASSWORD TABLE
=========================== */
function renderResetTable(rows) {
    const thead = table.querySelector("thead");
    const tbody = table.querySelector("tbody");

    if (!rows.length) {
        tbody.innerHTML = "<tr><td>No requests</td></tr>";
        return;
    }

    thead.innerHTML = `
        <tr>
            <th>HTNO</th>
            <th>Full Name</th>
            <th>Year</th>
            <th>Branch</th>
        </tr>
    `;

    tbody.innerHTML = rows.map(r => `
        <tr>
            <td>${r.htno}</td>
            <td>${r.full_name}</td>
            <td>${r.year}</td>
            <td>${r.branch}</td>
        </tr>
    `).join("");
}
