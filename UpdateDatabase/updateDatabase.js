const yearSelect = document.getElementById("year");
const branchSelect = document.getElementById("branch");
const actionButtons = document.getElementById("actionButtons");
const message = document.getElementById("message");
const dynamicContent = document.getElementById("dynamicContent");

// Load branches dynamically
yearSelect.addEventListener("change", async () => {
  const year = yearSelect.value;
  branchSelect.innerHTML = '<option value="">--Select Branch--</option>';
  actionButtons.style.display = "none";
  dynamicContent.innerHTML = "";

  if (!year) return;

  const res = await fetch(`/api/branches/${year}`);
  const data = await res.json();
  data.branches.forEach(branch => {
    const opt = document.createElement("option");
    opt.value = branch;
    opt.textContent = branch;
    branchSelect.appendChild(opt);
  });
});

branchSelect.addEventListener("change", () => {
  if (branchSelect.value && yearSelect.value) {
    actionButtons.style.display = "block";
    dynamicContent.innerHTML = "";
    message.textContent = "";
  }
});

// DELETE Semester Data
document.getElementById("deleteBtn").addEventListener("click", async () => {
  const year = yearSelect.value, branch = branchSelect.value;
  if (!confirm(`Are you sure you want to delete all data for ${year}-${branch}?`)) return;

  const res = await fetch("/api/delete-semester-data", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ year, branch })
  });
  const result = await res.json();
  message.textContent = result.message || result.error;
  message.className = result.error ? "error" : "success";
});

// UPDATE Faculty / HOD Details
document.getElementById("updateBtnAlways").addEventListener("click", async () => {
  dynamicContent.innerHTML = `
    <h3>Select Table to Update</h3>
    <button class="update-btn" onclick="loadTable('faculty')">Faculty Table</button>
    <button class="update-btn" onclick="loadTable('hod_details')">HOD Table</button>
    <div id="tableArea"></div>
  `;
});

async function loadTable(table) {
  const res = await fetch(`/api/get-table-data-simple?table=${table}`);
  const data = await res.json();
  renderEditableTable(table, data);
}

function renderEditableTable(table, data) {
  const container = document.getElementById("tableArea");
  container.innerHTML = "";

  if (!data.length) {
    container.innerHTML = "<p>No records found.</p>";
    return;
  }

  const tableEl = document.createElement("table");
  const header = document.createElement("tr");
  Object.keys(data[0]).forEach(k => {
    const th = document.createElement("th");
    th.textContent = k;
    header.appendChild(th);
  });
  header.appendChild(document.createElement("th")).textContent = "Actions";
  tableEl.appendChild(header);

  data.forEach(row => {
    const tr = document.createElement("tr");
    Object.entries(row).forEach(([k, v]) => {
      const td = document.createElement("td");
      td.textContent = v;
      if (k !== "facultyId" && k !== "hod_id") td.contentEditable = true;
      td.dataset.key = k;
      tr.appendChild(td);
    });

    const actionTd = document.createElement("td");
    const updateBtn = document.createElement("button");
    updateBtn.textContent = "Update";
    updateBtn.className = "action-pill update";
    updateBtn.onclick = () => saveRow(table, tr, row);
    const delBtn = document.createElement("button");
    delBtn.textContent = "Delete";
    delBtn.className = "action-pill delete";
    delBtn.onclick = () => deleteRow(table, row);
    actionTd.append(updateBtn, delBtn);
    tr.appendChild(actionTd);

    tableEl.appendChild(tr);
  });

  container.appendChild(tableEl);
}

function saveRow(table, tr, originalRow) {
  const updated = {};
  tr.querySelectorAll("td[contenteditable=true]").forEach(td => {
    updated[td.dataset.key] = td.textContent.trim();
  });

  const idKey = table === "faculty" ? "facultyId" : "hod_id";
  updated[idKey] = originalRow[idKey];

  fetch(`/api/update/${table}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ row: updated })
  })
    .then(r => r.json())
    .then(d => alert(d.message || "Updated successfully!"))
    .catch(e => alert(e.message));
}

function deleteRow(table, row) {
  const idKey = table === "faculty" ? "facultyId" : "hod_id";
  if (!confirm("Are you sure to delete this record?")) return;

  fetch(`/api/delete-row/${table}/${row[idKey]}`, { method: "DELETE" })
    .then(r => r.json())
    .then(d => alert(d.message || "Deleted successfully!"))
    .catch(e => alert(e.message));
}

// EXPORT CSV
// document.getElementById("exportBtn").addEventListener("click", () => {
//   const tables = ["branches","examsofspecificyearandbranch","faculty_requests","pending_marks_updates","studentmarks","subjects"];
//   dynamicContent.innerHTML = `
//     <h3>Select Tables to Export:</h3>
//     <div id="exportList" style="margin:10px 0;">
//       ${tables.map(t => `<label><input type="checkbox" value="${t}"> ${t}</label><br>`).join("")}
//     </div>
//     <button id="downloadBtn" class="export-btn">Download Selected CSVs</button>
//   `;
//   document.getElementById("downloadBtn").onclick = downloadSelectedCSVs;
// });

app.get("/api/export-csv", async (req, res) => {
    const { table, year, branch } = req.query;
    if (!table || !year || !branch)
        return res.status(400).send("Missing params");

    const sql =
        table === "subjects" || table === "branches"
            ? `SELECT * FROM ${table} WHERE year=? AND branch_name=?`
            : `SELECT * FROM ${table} WHERE year=? AND branch=?`;

    con.query(sql, [year, branch], (err, results) => {
        if (err) return res.status(500).send(err.message);
        if (!results.length) return res.status(404).send("No data found");

        // Convert each row properly (handle JSON fields)
        const processedResults = results.map(row => {
            const newRow = {};
            for (let key in row) {
                const val = row[key];
                // If it's an object (e.g. JSON column), stringify it
                if (typeof val === "object" && val !== null) {
                    newRow[key] = JSON.stringify(val).replace(/,/g, ";"); // Avoid breaking CSV commas
                } else {
                    newRow[key] = val;
                }
            }
            return newRow;
        });

        const header = Object.keys(processedResults[0]).join(",");
        const rows = processedResults.map(r => Object.values(r).join(",")).join("\n");
        const csv = header + "\n" + rows;

        res.setHeader("Content-disposition", `attachment; filename=${table}-${year}-${branch}.csv`);
        res.set("Content-Type", "text/csv");
        res.send(csv);
    });
});

function downloadSelectedCSVs() {
  const selected = Array.from(document.querySelectorAll("#exportList input:checked")).map(i => i.value);
  if (!selected.length) return alert("Select at least one table!");

  const year = yearSelect.value, branch = branchSelect.value;
  selected.forEach(t => {
    window.open(`/api/export-csv?table=${t}&year=${year}&branch=${branch}`, "_blank");
  });
}
