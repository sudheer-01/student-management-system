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
    const selectedBranches = Array
        .from(branchBox.querySelectorAll("input:checked"))
        .map(cb => cb.value);

    if (!year || selectedBranches.length === 0) {
        alert("Select year and at least one branch");
        return;
    }

    try {
        const res = await fetch("/admin/student-marks", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                year,
                branches: selectedBranches
            })
        });

        const data = await res.json();

        if (!data.branches || Object.keys(data.branches).length === 0) {
            tablesContainer.innerHTML = "<p>No data found</p>";
            return;
        }

        renderBranchTables(data);

    } catch (err) {
        console.error(err);
        alert("Failed to load student marks");
    }
});

/* =====================================================
   RENDER ONE TABLE PER BRANCH
===================================================== */
function renderBranchTables(data) {

    tablesContainer.innerHTML = "";

    Object.entries(data.branches).forEach(([branch, info]) => {

        const { exams, students } = info;

        let html = `
            <div class="branch-section">
                <h3>Branch: ${branch} (${data.year} Year)</h3>

                <div class="table-wrapper">
                <table class="branch-table">
                    <thead>
                        <tr>
                            <th>HTNO</th>
                            <th>Name</th>
                            <th>Subject</th>
                            ${exams.map(e => `<th>${e.replace(/_/g, " ").toUpperCase()}</th>`).join("")}
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        students.forEach(s => {
            html += `
                <tr data-htno="${s.htno}" data-subject="${s.subject}" data-branch="${branch}">
                    <td>${s.htno}</td>
                    <td>${s.name}</td>
                    <td>${s.subject}</td>

                    ${exams.map(e => `
                        <td contenteditable="true"
                            data-exam="${e}">
                            ${s.marks[e] ?? ""}
                        </td>
                    `).join("")}

                    <td>
                        <button class="btn secondary"
                            onclick="saveMarks(this)">
                            Save
                        </button>
                    </td>
                </tr>
            `;
        });

        html += `
                    </tbody>
                </table>
                </div>
            </div>
        `;

        tablesContainer.insertAdjacentHTML("beforeend", html);
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
