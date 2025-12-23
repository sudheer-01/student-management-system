const yearSelect = document.getElementById("yearSelect");
const loadBtn = document.getElementById("loadStudentsBtn");
const branchBox = document.getElementById("branchCheckboxes");
const tablesContainer = document.getElementById("tablesContainer");

/* =====================================================
   LOAD BRANCHES AS CHECKBOXES (BASED ON YEAR)
===================================================== */
yearSelect.addEventListener("change", async () => {
    const year = yearSelect.value;
    branchBox.innerHTML = "";

    if (!year) return;

    try {
        const res = await fetch(`/api/branches/${year}`);
        const data = await res.json();

        if (!data.branches || data.branches.length === 0) {
            branchBox.innerHTML = "<p>No branches found</p>";
            return;
        }

        data.branches.forEach(branch => {
            const label = document.createElement("label");
            label.className = "branch-checkbox";
            label.innerHTML = `
                <input type="checkbox" value="${branch}">
                ${branch}
            `;
            branchBox.appendChild(label);
        });

    } catch (err) {
        console.error(err);
        alert("Failed to load branches");
    }
});

/* =====================================================
   LOAD STUDENT MARKS (MULTI-BRANCH)
===================================================== */
loadBtn.addEventListener("click", async () => {

    const year = yearSelect.value;
    const branches = Array
        .from(branchBox.querySelectorAll("input:checked"))
        .map(cb => cb.value);

    if (!year || branches.length === 0) {
        alert("Select year and at least one branch");
        return;
    }

    const [marksRes, examsRes] = await Promise.all([
        fetch("/admin/student-marks", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ year, branches })
        }),
        fetch(`/admin/exams/${year}`)
    ]);

    const marksData = await marksRes.json();
    const examsByBranch = await examsRes.json();

    renderBranchTables(marksData.students, examsByBranch);
});


/* =====================================================
   RENDER ONE TABLE PER BRANCH
===================================================== */
function renderBranchTables(students, examsByBranch) {

    const container = document.getElementById("tablesContainer");
    container.innerHTML = "";

    const grouped = {};

    students.forEach(s => {
        if (!grouped[s.branch]) grouped[s.branch] = [];
        grouped[s.branch].push(s);
    });

    Object.entries(grouped).forEach(([branch, rows]) => {

        const exams = examsByBranch[branch] || [];

        let html = `
            <h3>Branch: ${branch}</h3>
            <table class="branch-table">
                <thead>
                    <tr>
                        <th>HTNO</th>
                        <th>Name</th>
                        <th>Subject</th>
                        ${exams.map(e => `<th>${e.replace(/_/g," ")}</th>`).join("")}
                    </tr>
                </thead>
                <tbody>
        `;

        rows.forEach(r => {
            html += `
                <tr data-htno="${r.htno}" data-subject="${r.subject}">
                    <td>${r.htno}</td>
                    <td>${r.name}</td>
                    <td>${r.subject}</td>
                    ${exams.map(e => `
                        <td contenteditable="true">${r[e] ?? ""}</td>
                    `).join("")}
                </tr>
            `;
        });

        html += `</tbody></table>`;
        container.innerHTML += html;
    });
}


/* =====================================================
   SAVE MARKS (PER ROW)
===================================================== */
function saveMarks(btn) {

    const row = btn.closest("tr");

    const payload = {
        year: yearSelect.value,
        branch: row.dataset.branch,
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
    .then(res => res.json())
    .then(result => {
        alert(result.message || "Marks updated successfully");
    })
    .catch(err => {
        console.error(err);
        alert("Failed to update marks");
    });
}
