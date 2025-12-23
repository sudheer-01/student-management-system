const yearSelect = document.getElementById("yearSelect");
const branchSelect = document.getElementById("branchSelect");
const loadBtn = document.getElementById("loadBtn");

const thead = document.querySelector("#marksTable thead");
const tbody = document.querySelector("#marksTable tbody");

/* ============================
   LOAD BRANCHES
============================ */
yearSelect.addEventListener("change", async () => {
    branchSelect.innerHTML = `<option value="">Select Branch</option>`;
    if (!yearSelect.value) return;

    const res = await fetch(`/api/branches/${yearSelect.value}`);
    const data = await res.json();

    data.branches.forEach(b => {
        branchSelect.innerHTML += `<option value="${b}">${b}</option>`;
    });
});

/* ============================
   LOAD STUDENT MARKS
============================ */
loadBtn.addEventListener("click", async () => {

    const year = yearSelect.value;
    const branch = branchSelect.value;

    if (!year || !branch) {
        alert("Select year and branch");
        return;
    }

    const marksRes = await fetch(`/admin/student-marks?year=${year}&branch=${branch}`);
    const marksData = await marksRes.json();

    const examsRes = await fetch(`/admin/exams?year=${year}&branch=${branch}`);
    const examsData = await examsRes.json();

    const exams = Array.isArray(examsData.exams) ? examsData.exams : [];
renderTable(marksData.students, exams);

});

/* ============================
   RENDER TABLE (NO DOM ISSUES)
============================ */
function renderTable(students, exams) {

    const container = document.getElementById("tablesContainer");
    container.innerHTML = "";

    if (!students || students.length === 0) {
        container.innerHTML = "<p>No student records found</p>";
        return;
    }

    // exams MUST be array of exact column names
    if (!Array.isArray(exams)) exams = [];

    let html = `
        <table class="marks-table">
            <thead>
                <tr>
                    <th>HTNO</th>
                    <th>Name</th>
                    <th>Subject</th>
                    ${exams.map(e => `<th>${e}</th>`).join("")}
                </tr>
            </thead>
            <tbody>
    `;

    students.forEach(s => {
        html += `
            <tr>
                <td>${s.htno}</td>
                <td>${s.name}</td>
                <td>${s.subject}</td>
                ${exams.map(e => `<td>${s[e] ?? ""}</td>`).join("")}
            </tr>
        `;
    });

    html += `
            </tbody>
        </table>
    `;

    container.innerHTML = html;
}

/* ============================
   EXPORT CSV
============================ */
function exportCSV() {
    const rows = [...document.querySelectorAll("#marksTable tr")];
    const csv = rows.map(r =>
        [...r.children].map(c => `"${c.innerText}"`).join(",")
    ).join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "student-marks.csv";
    a.click();
}
