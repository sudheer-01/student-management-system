const yearSelect = document.getElementById("yearSelect");
const branchSelect = document.getElementById("branchSelect");
const loadBtn = document.getElementById("loadBtn");
const container = document.getElementById("tablesContainer");

/* ============================
   LOAD BRANCHES BASED ON YEAR
============================ */
yearSelect.addEventListener("change", async () => {
    branchSelect.innerHTML = `<option value="">Select Branch</option>`;

    if (!yearSelect.value) return;

    try {
        const res = await fetch(`/api/branches/${yearSelect.value}`);
        const data = await res.json();

        data.branches.forEach(branch => {
            const opt = document.createElement("option");
            opt.value = branch;
            opt.textContent = branch;
            branchSelect.appendChild(opt);
        });

    } catch (err) {
        console.error(err);
        alert("Failed to load branches");
    }
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

    try {
        const res = await fetch(
            `/admin/student-marks?year=${year}&branch=${branch}`,
            { method: "POST" }
        );

        const rows = await res.json();
        renderTable(rows);

    } catch (err) {
        console.error(err);
        alert("Failed to load student marks");
    }
});

/* ============================
   RENDER TABLE
============================ */
function renderTable(rows) {

    container.innerHTML = "";

    if (!rows || rows.length === 0) {
        container.innerHTML = "<p>No student data found.</p>";
        return;
    }

    // Static columns
    const fixedCols = ["htno", "name", "subject"];

    // Dynamic exam columns (derived from first row)
    const examCols = Object.keys(rows[0]).filter(
        col => !fixedCols.includes(col)
    );

    let html = `
        <table>
            <thead>
                <tr>
                    <th>HTNO</th>
                    <th>Name</th>
                    <th>Subject</th>
                    ${examCols.map(e => `<th>${e}</th>`).join("")}
                </tr>
            </thead>
            <tbody>
    `;

    rows.forEach(r => {
        html += `
            <tr>
                <td>${r.htno}</td>
                <td>${r.name}</td>
                <td>${r.subject}</td>
                ${examCols.map(e => `<td>${r[e] ?? ""}</td>`).join("")}
            </tr>
        `;
    });

    html += "</tbody></table>";
    container.innerHTML = html;
}

/* ============================
   EXPORT CSV
============================ */
function exportCSV() {
    const table = container.querySelector("table");
    if (!table) {
        alert("No data to export");
        return;
    }

    let csv = [];
    [...table.rows].forEach(row => {
        csv.push(
            [...row.cells].map(c => `"${c.innerText}"`).join(",")
        );
    });

    const blob = new Blob([csv.join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "student-marks.csv";
    a.click();
}

/* ============================
   PRINT
============================ */
function printTable() {
    window.print();
}
