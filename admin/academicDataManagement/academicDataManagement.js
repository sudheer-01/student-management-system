const yearSelect = document.getElementById("year");
const branchSelect = document.getElementById("branch");
const actionButtons = document.getElementById("actionButtons");
const message = document.getElementById("message");
const dynamicContent = document.getElementById("dynamicContent");

function showMessage(message, type = "info", autoHide = true) {
    const msgEl = document.getElementById("uiMessage");
    if (!msgEl) return;

    msgEl.textContent = message;
    msgEl.className = `ui-message ${type}`;
    msgEl.classList.remove("hidden");

    if (autoHide) {
        setTimeout(() => {
            msgEl.classList.add("hidden");
        }, 4000); // hide after 4 seconds
    }
}


/* ===============================
   LOAD BRANCHES BASED ON YEAR
================================ */
yearSelect.addEventListener("change", async () => {
  const year = yearSelect.value;

  branchSelect.innerHTML = '<option value="">--Select Branch--</option>';
  actionButtons.style.display = "none";
  dynamicContent.innerHTML = "";
  message.textContent = "";

  if (!year) return;

  try {
    const res = await fetch(`/api/branches/${year}`);
    const data = await res.json();

    data.branches.forEach(branch => {
      const opt = document.createElement("option");
      opt.value = branch;
      opt.textContent = branch;
      branchSelect.appendChild(opt);
    });
  } catch (err) {
    showMessage("Failed to load branches", "error");
  }
});

/* ===============================
   SHOW ACTION BUTTONS
================================ */
branchSelect.addEventListener("change", () => {
  if (yearSelect.value && branchSelect.value) {
    actionButtons.style.display = "block";
    message.textContent = "";
    dynamicContent.innerHTML = "";
  } else {
    actionButtons.style.display = "none";
  }
});

/* ===============================
   DELETE SEMESTER DATA
================================ */
document.getElementById("deleteBtn").addEventListener("click", async () => {
  const year = yearSelect.value;
  const branch = branchSelect.value;

  if (!year || !branch) {
    showMessage("Select year and branch first", "error");
    return;
  }

  if (!confirm(`Are you sure you want to delete all semester data for ${year} - ${branch}?`)) {
    return;
  }

  try {
    const res = await fetch("/api/delete-semester-data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ year, branch })
    });

    const result = await res.json();
    message.textContent = result.message || result.error;
    message.className = result.error ? "error" : "success";
  } catch (err) {
    message.textContent = "Failed to delete semester data";
    message.className = "error";
  }
});

/* ===============================
   EXPORT CSV
================================ */
document.getElementById("exportBtn").addEventListener("click", () => {

  const tableMap = {
    branches: "Branches Master Data",
    examsofspecificyearandbranch: "Exams Configuration",
    faculty_requests: "Faculty Account Requests",
    pending_marks_updates: "Pending Marks Update Requests",
    studentmarks: "Student Marks Records",
    subjects: "Subjects Master Data",
    student_profiles: "Student Profile Information"
  };

  dynamicContent.innerHTML = `
    <h3>Select Academic Data to Export</h3>
    <p style="color:#64748b; margin-bottom:10px;">
      Export CSV files for the selected academic year and branch
    </p>

    <div id="exportList" style="margin:10px 0;">
      ${
        Object.entries(tableMap)
          .map(([table, label]) => `
            <label style="display:block; margin-bottom:6px;">
              <input type="checkbox" value="${table}">
              ${label}
            </label>
          `)
          .join("")
      }
    </div>

    <button id="downloadBtn" class="export-btn">
      Download Selected CSV Files
    </button>
  `;

  document.getElementById("downloadBtn").onclick = downloadSelectedCSVs;
});

/* ===============================
   DOWNLOAD SELECTED CSV FILES
================================ */
function downloadSelectedCSVs() {
  const selectedTables = Array.from(
    document.querySelectorAll("#exportList input:checked")
  ).map(cb => cb.value);

  const year = yearSelect.value;
  const branch = branchSelect.value;

  if (!selectedTables.length) {
    showMessage("Select at least one table to export", "error");
    return;
  }

  if (!year || !branch) {
    showMessage("Select year and branch first", "error");
    return;
  }

  const url = `/api/export-csv?tables=${selectedTables.join(",")}&year=${year}&branch=${branch}`;
  window.open(url, "_blank");
}
    const logoutBtn = document.getElementById("logoutBtn");
    // logout
    if (logoutBtn) {
    logoutBtn.addEventListener("click", async function () {

        const role = localStorage.getItem("role");
        const userId = localStorage.getItem("adminId");

        try {
            await fetch("/logout", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ role, userId })
            });
        } catch (err) {
            console.error("Logout API failed:", err);
        }
        localStorage.clear();

        window.location.href = "/";
    });
    }