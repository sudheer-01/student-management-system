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
        console.log(rows);
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

    const table = document.getElementById("marksTable");
    const thead = table.querySelector("thead");
    const tbody = table.querySelector("tbody");

    // Clear previous table content
    thead.innerHTML = "";
    tbody.innerHTML = "";

    if (!rows || rows.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="10">No student data found.</td>
            </tr>
        `;
        return;
    }

    // Fixed columns
    const fixedCols = ["htno", "name", "subject"];

    // Exam columns (from backend-selected columns)
    const examCols = Object.keys(rows[0]).filter(
        col => !fixedCols.includes(col)
    );

    /* ===== TABLE HEADER ===== */
    thead.innerHTML = `
        <tr>
            <th>HTNO</th>
            <th>Name</th>
            <th>Subject</th>
            ${examCols.map(e => `<th>${e}</th>`).join("")}
        </tr>
    `;

    /* ===== TABLE BODY ===== */
    rows.forEach(r => {
        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${r.htno}</td>
            <td>${r.name}</td>
            <td>${r.subject}</td>
            ${examCols.map(e => `<td>${r[e] ?? ""}</td>`).join("")}
        `;

        tbody.appendChild(tr);
    });
}

/* ============================
   EXPORT CSV
============================ */
function exportCSV() {

    const table = document.getElementById("marksTable");
    if (!table) {
        alert("No data to export");
        return;
    }

    let csv = [];

    for (let row of table.rows) {
        const cells = Array.from(row.cells).map(cell =>
            `"${cell.innerText.replace(/"/g, '""')}"`
        );
        csv.push(cells.join(","));
    }

    if (csv.length === 0) {
        alert("No data to export");
        return;
    }

    const blob = new Blob([csv.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "student_marks.csv";
    document.body.appendChild(a);
    a.click();

    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}


/* ============================
   PRINT
============================ */
function printTable() {

    const table = document.getElementById("marksTable");
    if (!table || table.rows.length === 0) {
        alert("No data to print");
        return;
    }

    const win = window.open("", "_blank");

    win.document.write(`
        <html>
        <head>
            <title>Student Marks</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    margin: 20px;
                }
                h2 {
                    text-align: center;
                    margin-bottom: 20px;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                }
                th, td {
                    border: 1px solid #000;
                    padding: 8px;
                    text-align: center;
                }
                th {
                    background-color: #f0f0f0;
                }
            </style>
        </head>
        <body>

            <h2>Student Marks</h2>
            ${table.outerHTML}

        </body>
        </html>
    `);

    win.document.close();
    win.focus();
    win.print();
}

