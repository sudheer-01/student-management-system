const yearSelect = document.getElementById("yearSelect");
const branchSelect = document.getElementById("branchSelect");
const loadBtn = document.getElementById("loadBtn");
const container = document.getElementById("tableContainer");

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

    const [marksRes, examsRes] = await Promise.all([
        fetch(`/admin/student-marks?year=${year}&branch=${branch}`),
        fetch(`/admin/exams?year=${year}&branch=${branch}`)
    ]);

    const marksData = await marksRes.json();
    const examsData = await examsRes.json();

    renderTable(marksData.students, examsData.exams);
});

/* Render table */
function renderTable(rows, exams) {
    if (!rows.length) {
        container.innerHTML = "<p>No data found</p>";
        return;
    }

    let html = `<table><thead><tr>
        <th>HTNO</th>
        <th>Name</th>
        <th>Subject</th>
        ${exams.map(e => `<th>${e.toUpperCase()}</th>`).join("")}
    </tr></thead><tbody>`;

    rows.forEach(r => {
        html += `<tr>
            <td>${r.htno}</td>
            <td>${r.name}</td>
            <td>${r.subject}</td>
            ${exams.map(e => `<td>${r[e] ?? ""}</td>`).join("")}
        </tr>`;
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
