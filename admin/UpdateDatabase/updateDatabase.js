document.addEventListener("DOMContentLoaded", () => {

  const updateBtn = document.getElementById("updateBtnAlways");
  const dynamicContent = document.getElementById("dynamicContent");

  /* ============================
     LOAD TABLE SELECTION
  ============================ */

  updateBtn.addEventListener("click", () => {
    dynamicContent.innerHTML = `
      <h3 style="margin-bottom:12px;">Select Data to Manage</h3>

      <div style="display:flex; gap:12px; margin-bottom:20px;">
        <button class="update-btn" id="loadFaculty">Faculty Details</button>
        <button class="update-btn" id="loadHod">HOD Details</button>
      </div>

      <div id="tableArea"></div>
    `;

    document.getElementById("loadFaculty").onclick = () => loadTable("faculty");
    document.getElementById("loadHod").onclick = () => loadTable("hod_details");
  });

  /* ============================
     FETCH TABLE DATA
  ============================ */

  async function loadTable(table) {
    const res = await fetch(`/api/get-table-data-simple?table=${table}`);
    const data = await res.json();
    renderEditableTable(table, data);
  }

  /* ============================
     RENDER EDITABLE TABLE
  ============================ */

  function renderEditableTable(table, data) {
    const container = document.getElementById("tableArea");
    container.innerHTML = "";

    if (!data.length) {
      container.innerHTML = "<p>No records found.</p>";
      return;
    }

    const tableEl = document.createElement("table");

    // Header
    const header = document.createElement("tr");
    Object.keys(data[0]).forEach(key => {
      const th = document.createElement("th");
      th.textContent = formatHeader(key);
      header.appendChild(th);
    });
    const actionTh = document.createElement("th");
    actionTh.textContent = "Actions";
    header.appendChild(actionTh);
    tableEl.appendChild(header);

    // Rows
    data.forEach(row => {
      const tr = document.createElement("tr");

      Object.entries(row).forEach(([key, value]) => {
        const td = document.createElement("td");
        td.textContent = value;

        // ID fields NOT editable
        if (key !== "facultyId" && key !== "hod_id") {
          td.contentEditable = true;
        }

        td.dataset.key = key;
        tr.appendChild(td);
      });

      // Actions
      const actionTd = document.createElement("td");

      const updateBtn = document.createElement("button");
      updateBtn.textContent = "Update";
      updateBtn.className = "action-pill update";
      updateBtn.onclick = () => saveRow(table, tr, row);

      const deleteBtn = document.createElement("button");
      deleteBtn.textContent = "Delete";
      deleteBtn.className = "action-pill delete";
      deleteBtn.onclick = () => deleteRow(table, row);

      actionTd.append(updateBtn, deleteBtn);
      tr.appendChild(actionTd);

      tableEl.appendChild(tr);
    });

    container.appendChild(tableEl);
  }

  /* ============================
     UPDATE ROW
  ============================ */

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
    .then(res => res.json())
    .then(() => alert("Updated successfully"))
    .catch(err => alert(err.message));
  }

  /* ============================
     DELETE ROW
  ============================ */

  function deleteRow(table, row) {
    const idKey = table === "faculty" ? "facultyId" : "hod_id";
    if (!confirm("Are you sure you want to delete this record?")) return;

    fetch(`/api/delete-row/${table}/${row[idKey]}`, {
      method: "DELETE"
    })
    .then(res => res.json())
    .then(() => alert("Deleted successfully"))
    .catch(err => alert(err.message));
  }

  /* ============================
     HELPER
  ============================ */

  function formatHeader(key) {
    return key
      .replace(/_/g, " ")
      .replace(/([A-Z])/g, " $1")
      .toUpperCase();
  }

});
 const logoutBtn = document.getElementById("logoutBtn");
    // logout
    if (logoutBtn) {
        logoutBtn.addEventListener("click", function () {
            if (!confirm("Log out of the admin panel?")) return;
            fetch("/logout", { method: "POST" })
                .then(() => { window.location.href = "/"; })
                .catch(() => { window.location.href = "/"; });
        });
    }