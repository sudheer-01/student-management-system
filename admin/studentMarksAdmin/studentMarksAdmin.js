const yearSelect = document.getElementById("yearSelect");
const loadBtn = document.getElementById("loadStudentsBtn");
const tableBody = document.querySelector("#studentsTable tbody");
const branchBox = document.getElementById("branchCheckboxes");

/* =========================
   LOAD BRANCHES AS CHECKBOX
========================= */
yearSelect.addEventListener("change", async () => {
    const year = yearSelect.value;
    branchBox.innerHTML = "";

    if (!year) return;

    const res = await fetch(`/api/branches/${year}`);
    const data = await res.json();

    data.branches.forEach(branch => {
        const label = document.createElement("label");
        label.innerHTML = `
            <input type="checkbox" value="${branch}">
            ${branch}
        `;
        branchBox.appendChild(label);
    });
});

/* =========================
   LOAD STUDENT MARKS
========================= */
loadBtn.addEventListener("click", async () => {

    const year = yearSelect.value;
    const selectedBranches = Array
        .from(branchBox.querySelectorAll("input:checked"))
        .map(cb => cb.value);

    if (!year || selectedBranches.length === 0) {
        alert("Select year and at least one branch");
        return;
    }

    const res = await fetch("/admin/student-marks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year, branches: selectedBranches })
    });

    const data = await res.json();
    renderTable(data);
});

/* =========================
   DYNAMIC TABLE RENDERING
========================= */
function renderTable(rows) {

    tableBody.innerHTML = "";
    if (!rows.length) return;

    // Detect exam columns dynamically
    const staticCols = ["year", "branch", "htno", "name", "subject"];
    const examCols = Object.keys(rows[0]).filter(
        k => !staticCols.includes(k)
    );

    // Build table header
    const thead = document.querySelector("#studentsTable thead tr");
    thead.innerHTML = `
        <th>HTNO</th>
        <th>Name</th>
        <th>Branch</th>
        <th>Year</th>
        <th>Subject</th>
        ${examCols.map(e => `<th>${e.replace(/_/g," ")}</th>`).join("")}
        <th>Actions</th>
    `;

    rows.forEach(r => {
        let examCells = examCols.map(
            e => `<td contenteditable="true" data-exam="${e}">${r[e] ?? ""}</td>`
        ).join("");

        tableBody.innerHTML += `
            <tr data-htno="${r.htno}" data-subject="${r.subject}">
                <td>${r.htno}</td>
                <td>${r.name}</td>
                <td>${r.branch}</td>
                <td>${r.year}</td>
                <td>${r.subject}</td>
                ${examCells}
                <td>
                    <button class="btn secondary" onclick="saveMarks(this)">Save</button>
                </td>
            </tr>
        `;
    });
}

/* =========================
   UPDATE MARKS
========================= */
function saveMarks(btn) {
    const row = btn.closest("tr");
    const payload = {
        htno: row.dataset.htno,
        subject: row.dataset.subject,
        updates: {}
    };

    row.querySelectorAll("[data-exam]").forEach(td => {
        payload.updates[td.dataset.exam] = td.innerText.trim();
    });

    fetch("/admin/update-marks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    })
    .then(r => r.json())
    .then(d => alert("Marks updated successfully"));
}
