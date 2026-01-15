const yearSelect = document.getElementById("yearSelect");
const branchSelect = document.getElementById("branchSelect");
const loadBtn = document.getElementById("loadBtn");
const table = document.getElementById("profilesTable");
const thead = table.querySelector("thead");
const tbody = table.querySelector("tbody");

function showMessage(message, type = "info", autoHide = true) {
    const msgEl = document.getElementById("uiMessage");
    if (!msgEl) return;

    msgEl.textContent = message;
    msgEl.className = `ui-message ${type}`;
    msgEl.classList.remove("hidden");

    if (autoHide) {
        setTimeout(() => {
            msgEl.classList.add("hidden");
        }, 3000); 
    }
}

/* Load branches */
yearSelect.addEventListener("change", async () => {
    branchSelect.innerHTML = `<option value="">Select Branch</option>`;
    if (!yearSelect.value) return;
    const role = localStorage.getItem("role");
    const adminId = localStorage.getItem("adminId");
    const sessionValue = localStorage.getItem("key");
    const res = await fetch(`/api/branches/${role}/${adminId}/${yearSelect.value}`, 
         {
                 headers: {
                "x-session-key": sessionValue
            }
            }
    );
    const data = await res.json();

    data.branches.forEach(b => {
        branchSelect.innerHTML += `<option value="${b}">${b}</option>`;
    });
});

/* Load student profiles */
loadBtn.addEventListener("click", async () => {
    const year = yearSelect.value;
    const branch = branchSelect.value;
    const role = localStorage.getItem("role");
    const adminId = localStorage.getItem("adminId");
    const sessionValue = localStorage.getItem("key");
    if (!year || !branch) {
        showMessage("Select year and branch", "error");
        return;
    }

    const res = await fetch(
        `/admin/student-profiles/${role}/${adminId}?year=${year}&branch=${branch}`,
         {
                 headers: {
                "x-session-key": sessionValue
            }
            }
    );

    const rows = await res.json();
    renderTable(rows);
});

/* Render table */
function renderTable(rows) {
    thead.innerHTML = "";
    tbody.innerHTML = "";

    if (!rows || rows.length === 0) {
        tbody.innerHTML = `<tr><td colspan="50">No data found</td></tr>`;
        return;
    }

    const columns = Object.keys(rows[0]);
    const sessionValue = localStorage.getItem("key");
    const role = localStorage.getItem("role");
    const adminId = localStorage.getItem("adminId");
    /* ===== TABLE HEADER ===== */
    thead.innerHTML = `
        <tr>
            ${columns.map(c => `<th>${c.replace(/_/g, " ")}</th>`).join("")}
        </tr>
    `;

    /* ===== TABLE BODY ===== */
    rows.forEach(r => {
        let rowHtml = "<tr>";

        columns.forEach(col => {

            /*  PROFILE PHOTO */
            if (col === "profile_photo") {
                rowHtml += `
                    <td>
                        <img 
                            src="/admin/studentProfile/photo/${r.htno}/${role}/${adminId}?sessionValue=${sessionValue}" 
                            alt="Profile"
                            style="width:60px;height:60px;border-radius:50%;object-fit:cover"
                            onerror="this.src='default.png'"
                        >
                    </td>
                `;
            }

            /*  DATE FIELDS (DOB etc.) */
            else if (r[col] instanceof Date) {
                rowHtml += `<td>${r[col].toISOString().split("T")[0]}</td>`;
            }

            /*  NULL SAFE */
            else {
                rowHtml += `<td>${r[col] ?? ""}</td>`;
            }
        });

        rowHtml += "</tr>";
        tbody.innerHTML += rowHtml;
    });
}

/* Export CSV */
// function exportCSV() {
//     let csv = [];
//     for (let row of table.rows) {
//         csv.push([...row.cells].map(c => `"${c.innerText}"`).join(","));
//     }
//     const blob = new Blob([csv.join("\n")], { type: "text/csv" });
//     const a = document.createElement("a");
//     a.href = URL.createObjectURL(blob);
//     a.download = "student_profiles.csv";
//     a.click();
// }
function exportCSV() {

    if (!table || table.rows.length === 0) {
        showMessage("No data to export", "error");
        return;
    }

    const year = yearSelect.value;
    const branch = branchSelect.value;

    if (!year || !branch) {
        showMessage("Year and Branch not selected", "error");
        return;
    }

    let csv = [];

    for (let row of table.rows) {
        const cells = [...row.cells].map(cell =>
            `"${cell.innerText.replace(/"/g, '""')}"`
        );
        csv.push(cells.join(","));
    }

    const blob = new Blob([csv.join("\n")], {
        type: "text/csv;charset=utf-8;"
    });

    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);

    // ✅ Dynamic & meaningful filename
    a.download = `student_personal_data_year_${year}_branch_${branch}.csv`;

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}


/* Print only table */
// function printTable() {
//     const win = window.open("", "_blank");
//     win.document.write(`
//         <html>
//         <head>
//             <title>Student Profiles</title>
//             <style>
//                 table { width:100%; border-collapse:collapse; }
//                 th,td { border:1px solid #000; padding:6px; }
//                 th { background:#eee; }
//             </style>
//         </head>
//         <body>
//             <h2>Student Profiles</h2>
//             ${table.outerHTML}
//         </body>
//         </html>
//     `);
//     win.document.close();
//     win.print();
// }

function printTable() {

    if (!table || table.rows.length === 0) {
        showMessage("No data to print", "error");
        return;
    }

    const year = yearSelect.value;
    const branch = branchSelect.value;

    if (!year || !branch) {
        showMessage("Year and Branch not selected", "error");
        return;
    }

    const win = window.open("", "_blank");

    win.document.open();
    win.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Student Personal Data</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    margin: 20px;
                    text-align: center;
                }
                img {
                    width: 100%;
                    max-height: 160px;
                    object-fit: contain;
                    margin-bottom: 10px;
                }
                h2 {
                    margin: 10px 0;
                }
                .meta {
                    font-weight: bold;
                    margin-bottom: 20px;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                }
                th, td {
                    border: 1px solid #000;
                    padding: 6px;
                    text-align: center;
                }
                th {
                    background: #f0f0f0;
                }
                img.profile {
                    width: 60px;
                    height: 60px;
                    border-radius: 50%;
                    object-fit: cover;
                }
            </style>
        </head>

        <body onload="window.print(); window.close();">

            <!--  COLLEGE LOGO -->
            <img src="/balaji.png" alt="Balaji Institute Logo">

            <!--  TITLE -->
            <h2>Student Personal Data</h2>

            <!--  YEAR & BRANCH -->
            <div class="meta">
                Year: ${year} &nbsp; | &nbsp; Branch: ${branch}
            </div>

            ${table.outerHTML}

        </body>
        </html>
    `);

    win.document.close();
}

 const logoutBtn = document.getElementById("logoutBtn");
    // logout
    if (logoutBtn) {
    logoutBtn.addEventListener("click", async function () {

        const role = localStorage.getItem("role");
        const userId = localStorage.getItem("adminId");
         const sessionValue = localStorage.getItem("key");

        try {
            await fetch("/logout", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ role, userId, sessionValue })
            });
        } catch (err) {
            console.error("Logout API failed:", err);
        }
        localStorage.clear();

        window.location.href = "/";
    });
    }