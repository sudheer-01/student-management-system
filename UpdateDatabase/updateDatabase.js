const yearSelect = document.getElementById("year");
const branchSelect = document.getElementById("branch");
const actionSelect = document.getElementById("action");
const tableSelectGroup = document.getElementById("tableSelectGroup");
const tableSelect = document.getElementById("tableSelect");
const actionBtn = document.getElementById("actionBtn");
const message = document.getElementById("message");
const tableDataContainer = document.getElementById("tableDataContainer");

// Populate branches dynamically
yearSelect.addEventListener("change", () => {
    const year = yearSelect.value;
    branchSelect.innerHTML = '<option value="">--Select Branch--</option>';
    if (!year) return;

    fetch(`/api/branches/${year}`)
        .then(res => res.json())
        .then(data => {
            data.branches.forEach(branch => {
                const option = document.createElement("option");
                option.value = branch;
                option.textContent = branch;
                branchSelect.appendChild(option);
            });
        })
        .catch(err => console.error(err));
});

// Show table dropdown if action requires it
actionSelect.addEventListener("change", () => {
    const action = actionSelect.value;
    tableDataContainer.innerHTML = "";
    if (action === "update" || action === "export") {
        tableSelectGroup.style.display = "block";
        fetchTablesForAction();
    } else {
        tableSelectGroup.style.display = "none";
    }
});

function fetchTablesForAction() {
    const tables = ["branches", "examsofspecificyearandbranch", "faculty_requests", "pending_marks_updates", "studentmarks", "subjects"];
    tableSelect.innerHTML = '<option value="">--Select Table--</option>';
    tables.forEach(table => {
        const option = document.createElement("option");
        option.value = table;
        option.textContent = table;
        tableSelect.appendChild(option);
    });
}

// Main action button
actionBtn.addEventListener("click", async () => {
    const year = yearSelect.value;
    const branch = branchSelect.value;
    const action = actionSelect.value;
    const table = tableSelect.value;

    if (!year || !branch || !action) {
        message.textContent = "Please select year, branch, and action.";
        message.className = "error";
        return;
    }

    if (action === "delete") {
        if (!confirm(`Are you sure to delete all data for year ${year}, branch ${branch}?`)) return;

        fetch("/api/delete-semester-data", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ year, branch })
        })
        .then(res => res.json())
        .then(data => {
            message.textContent = data.message || data.error;
            message.className = data.error ? "error" : "success";
        })
        .catch(err => {
            message.textContent = err.message;
            message.className = "error";
        });
    } 
    else if (action === "update") {
        if (!table) {
            message.textContent = "Please select a table to update.";
            message.className = "error";
            return;
        }
        loadTableData(table, year, branch);
    } 
    else if (action === "export") {
        if (!table) {
            message.textContent = "Please select a table to export.";
            message.className = "error";
            return;
        }
        window.location.href = `/api/export-csv?year=${year}&branch=${branch}&table=${table}`;
    }
});

// Load and render table data
function loadTableData(table, year, branch) {
    fetch(`/api/get-table-data?year=${year}&branch=${branch}&table=${table}`)
        .then(res => res.json())
        .then(data => renderTableData(table, data))
        .catch(err => console.error(err));
}

function renderTableData(table, data) {
    tableDataContainer.innerHTML = "";
    if (!data.length) {
        tableDataContainer.textContent = "No data found.";
        return;
    }

    const tableEl = document.createElement("table");
    tableEl.border = "1";
    const header = document.createElement("tr");
    Object.keys(data[0]).forEach(key => {
        const th = document.createElement("th");
        th.textContent = key;
        header.appendChild(th);
    });
    header.appendChild(document.createElement("th")); // Actions
    tableEl.appendChild(header);

    data.forEach(row => {
        const tr = document.createElement("tr");
        Object.keys(row).forEach(key => {
            const td = document.createElement("td");
            td.textContent = row[key];
            tr.appendChild(td);
        });

        const actionTd = document.createElement("td");
        const updateBtn = document.createElement("button");
        updateBtn.textContent = "Update";
        updateBtn.onclick = () => updateRow(table, row);
        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "Delete";
        deleteBtn.onclick = () => deleteRow(table, row);
        actionTd.appendChild(updateBtn);
        actionTd.appendChild(deleteBtn);
        tr.appendChild(actionTd);

        tableEl.appendChild(tr);
    });

    tableDataContainer.appendChild(tableEl);
}

function updateRow(table, row) {
    alert("Implement update row functionality for " + table);
}

function deleteRow(table, row) {
    if (!confirm("Are you sure to delete this row?")) return;
    fetch(`/api/delete-row?table=${table}&id=${row.id}`, { method: "DELETE" })
        .then(res => res.json())
        .then(data => {
            alert(data.message);
            const year = yearSelect.value;
            const branch = branchSelect.value;
            loadTableData(table, year, branch); // Reload table
        });
}
