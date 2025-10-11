const yearSelect = document.getElementById("year");
const branchSelect = document.getElementById("branch");
const actionSelect = document.getElementById("action");
const tableSelectGroup = document.getElementById("tableSelectGroup");
const tableSelect = document.getElementById("tableSelect");
const actionBtn = document.getElementById("actionBtn");
const message = document.getElementById("message");
const tableDataContainer = document.getElementById("tableDataContainer");

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
    const tables = ["branches", "examsofspecificyearandbranch", "faculty", "faculty_requests", "hod_details", "pending_marks_updates", "studentmarks", "subjects"];
    tableSelect.innerHTML = '<option value="">--Select Table--</option>';
    tables.forEach(table => {
        const option = document.createElement("option");
        option.value = table;
        option.textContent = table;
        tableSelect.appendChild(option);
    });
}

// main action button
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

        const res = await fetch(`/api/get-table-data?year=${year}&branch=${branch}&table=${table}`);
        const data = await res.json();
        renderEditableTable(table, data);
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

function renderEditableTable(table, data) {
    tableDataContainer.innerHTML = "";
    if (!data.length) {
        tableDataContainer.textContent = "No data found.";
        return;
    }

    const tableEl = document.createElement("table");
    tableEl.border = "1";

    // headers
    const header = document.createElement("tr");
    Object.keys(data[0]).forEach(key => {
        const th = document.createElement("th");
        th.textContent = key;
        header.appendChild(th);
    });
    tableEl.appendChild(header);

    // rows
    data.forEach((row, rIdx) => {
        const tr = document.createElement("tr");
        tr.dataset.index = rIdx;
        Object.entries(row).forEach(([key, val]) => {
            const td = document.createElement("td");
            td.contentEditable = key !== "id" && key !== "facultyId" && key !== "hod_id" && key !== "year" && key !== "branch";
            td.textContent = val;
            td.dataset.key = key;
            td.addEventListener("input", () => tr.classList.add("edited"));
            tr.appendChild(td);
        });
        tableEl.appendChild(tr);
    });

    const saveBtn = document.createElement("button");
    saveBtn.textContent = "Update Table";
    saveBtn.className = "update-btn";
    saveBtn.style.marginTop = "10px";
    saveBtn.onclick = () => saveTableChanges(table, tableEl, data);

    tableDataContainer.appendChild(tableEl);
    tableDataContainer.appendChild(saveBtn);
}

function saveTableChanges(table, tableEl, originalData) {
    const editedRows = [];
    tableEl.querySelectorAll("tr.edited").forEach(tr => {
        const idx = tr.dataset.index;
        const updatedRow = { ...originalData[idx] };
        tr.querySelectorAll("td").forEach(td => {
            const key = td.dataset.key;
            if (key) updatedRow[key] = td.textContent.trim();
        });
        editedRows.push(updatedRow);
    });

    if (!editedRows.length) {
        alert("No changes detected!");
        return;
    }

    fetch(`/api/update/${table}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: editedRows })
    })
        .then(res => res.json())
        .then(resp => {
            if (resp.success) {
                alert("Table updated successfully!");
                actionBtn.click();
            } else {
                alert("Error updating table: " + resp.error);
            }
        })
        .catch(err => alert("Error: " + err.message));
}
