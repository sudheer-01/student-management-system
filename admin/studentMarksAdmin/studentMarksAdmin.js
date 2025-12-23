const yearSelect = document.getElementById("yearSelect");
const branchSelect = document.getElementById("branchSelect");
const loadBtn = document.getElementById("loadBtn");
const container = document.getElementById("tablesContainer");

/* Load branches */
yearSelect.addEventListener("change", async () => {
    branchSelect.innerHTML = `<option value="">Select Branch</option>`;
    if (!yearSelect.value) return;

    const res = await fetch(`/api/branches/${yearSelect.value}`);
    const data = await res.json();

    data.branches.forEach(b => {
        branchSelect.innerHTML += `<option value="${b}">${b}</option>`;
    });
});

/* Load student marks */
loadBtn.addEventListener("click", async () => {
    const year = yearSelect.value;
    const branch = branchSelect.value;

    if (!year || !branch) {
        alert("Select year and branch");
        return;
    }

    // 1️⃣ Get exams first
    const examsRes = await fetch(
        `/admin/exams?year=${year}&branch=${branch}`
    );
    const examsData = await examsRes.json();

    // 2️⃣ Get marks using exams
    const marksRes = await fetch("/admin/student-marks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            year,
            branch,
            exams: examsData.exams
        })
    });

    const marksData = await marksRes.json();

    renderTable(marksData.students, examsData.exams);
});

/* Render table */
function renderTable(students, exams) {

    container.innerHTML = "";

    if (!students.length) {
        container.innerHTML = "<p>No records found</p>";
        return;
    }

    let html = `
        <table>
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

    html += "</tbody></table>";
    container.innerHTML = html;
}
