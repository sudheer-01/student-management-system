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

    const marksRes = await fetch(
        `/admin/student-marks?year=${year}&branch=${branch}`
    );
    const marksData = await marksRes.json();

    const examsRes = await fetch(
        `/admin/exams?year=${year}&branch=${branch}`
    );
    const examsData = await examsRes.json();

    renderTable(marksData.students, examsData.exams);
});

/* Render table */
function renderTable(students, exams) {

    container.innerHTML = "";

    if (!students.length) {
        container.innerHTML = "<p>No records found</p>";
        return;
    }

    const examList = Object.keys(exams);

    let html = `
        <table>
            <thead>
                <tr>
                    <th>HTNO</th>
                    <th>Name</th>
                    <th>Subject</th>
                    ${examList.map(e => `<th>${e}</th>`).join("")}
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
                ${examList.map(e => `<td>${s[e] ?? ""}</td>`).join("")}
            </tr>
        `;
    });

    html += "</tbody></table>";
    container.innerHTML = html;
}



/* Export CSV */
function exportCSV() {
    const table = document.querySelector("table");
    if (!table) return alert("No data");

    let csv = [];
    [...table.rows].forEach(row => {
        csv.push([...row.cells].map(c => `"${c.innerText}"`).join(","));
    });

    const blob = new Blob([csv.join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "student-marks.csv";
    a.click();
}
