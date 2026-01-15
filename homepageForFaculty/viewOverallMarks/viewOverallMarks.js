let originalData = null;
let currentData = null; // store current filtered/modified data
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

// Fetch data and render
document.getElementById("getStudentMarks").addEventListener("click", () => {
    const selectedYear = localStorage.getItem("selectedYear");
    const selectedBranch = localStorage.getItem("selectedBranch");
    const selectedSubject = localStorage.getItem("selectedSubject");
    const role = localStorage.getItem("role");
    const facultyId = localStorage.getItem("facultyId");
    const sessionValue = localStorage.getItem("key");

    fetch(`/getOverallMarks/${role}/${facultyId}?year=${selectedYear}&branch=${selectedBranch}&subject=${selectedSubject}`,
           {
            headers: {
                "x-session-key": sessionValue
            } }
    )
        .then(response => response.json())
        .then(data => {
            renderTable(data);
            originalData = JSON.parse(JSON.stringify(data));
            currentData = JSON.parse(JSON.stringify(data));
            document.getElementById("addColumnSection").style.display = "block";
            document.getElementById("filterSection").style.display = "block";
        })
        .catch(error => console.error("Error fetching student marks:", error));
});

// Render Table Function
function renderTable(data) {
    const table = document.getElementById("studentsInformationTable");
    const thead = table.querySelector("thead tr");
    const tbody = table.querySelector("tbody");

    tbody.innerHTML = "";
    thead.innerHTML = "<th>S.NO</th><th>HallTicket Number</th><th>Student Name</th>";

    if (data.length === 0) {
        tbody.innerHTML = "<tr><td colspan='99'>No data found</td></tr>";
        return;
    }

    const examColumns = Object.keys(data[0]).filter(col => col !== "htno" && col !== "name");

    examColumns.forEach(col => {
        const th = document.createElement("th");
        th.textContent = col.replace(/_/g, " ");
        thead.appendChild(th);
    });

    data.forEach((student, index) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `<td>${index + 1}</td><td>${student.htno}</td><td>${student.name}</td>`;
        examColumns.forEach(col => {
            tr.innerHTML += `<td>${student[col] ?? "-"}</td>`;
        });
        tbody.appendChild(tr);
    });

    updateExamCheckboxes();
    updateFilterCheckboxes();
}

// Update exam selection checkboxes dynamically
function updateExamCheckboxes() {
    const thead = document.querySelector("#studentsInformationTable thead tr");
    const examCheckboxes = document.getElementById("examCheckboxes");
    examCheckboxes.innerHTML = "";

    Array.from(thead.children)
        .slice(3)
        .forEach(th => {
            const label = document.createElement("label");
            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.value = th.textContent;
            label.appendChild(checkbox);
            label.appendChild(document.createTextNode(th.textContent));
            examCheckboxes.appendChild(label);
        });
}

// Update filter column checkboxes dynamically
function updateFilterCheckboxes() {
    const thead = document.querySelector("#studentsInformationTable thead tr");
    const filterCheckboxes = document.getElementById("filterColumnCheckboxes");
    filterCheckboxes.innerHTML = "";

    Array.from(thead.children)
        .slice(3)
        .forEach(th => {
            const label = document.createElement("label");
            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.value = th.textContent;
            label.appendChild(checkbox);
            label.appendChild(document.createTextNode(th.textContent));
            filterCheckboxes.appendChild(label);
        });
}

// Add Column (Sum/Average)
document.getElementById("addColumn").addEventListener("click", () => {
    const selectedExams = Array.from(document.querySelectorAll("#examCheckboxes input:checked")).map(cb => cb.value);
    const newColumnName = document.getElementById("newColumnName").value.trim();
    const columnPosition = parseInt(document.getElementById("columnPosition").value, 10);
    const operationType = document.querySelector('input[name="operationType"]:checked').value;

    if (selectedExams.length === 0 || newColumnName === "") {
        showMessage("Please select exams and enter a column name.", "error");
        return;
    }

    const table = document.getElementById("studentsInformationTable");
    const thead = table.querySelector("thead tr");
    const tbody = table.querySelector("tbody");

    const existingHeaders = Array.from(thead.children).map(th => th.textContent.trim());
    if (existingHeaders.includes(newColumnName)) {
        showMessage("A column with this name already exists!", "error");
        return;
    }

    const newTh = document.createElement("th");
    newTh.textContent = newColumnName;
    thead.insertBefore(newTh, thead.children[columnPosition]);

    Array.from(tbody.children).forEach(row => {
        const studentCells = row.children;
        const values = [];

        selectedExams.forEach(exam => {
            const examIndex = [...thead.children].findIndex(th => th.textContent === exam);
            if (examIndex !== -1) {
                const val = parseFloat(studentCells[examIndex]?.textContent) || 0;
                values.push(val);
            }
        });

        let result = 0;
        if (operationType === "average" && values.length > 0) {
            result = Math.round(values.reduce((a, b) => a + b, 0) / values.length); // ✅ rounded to integer
        } else {
            result = values.reduce((a, b) => a + b, 0);
        }

        const newTd = document.createElement("td");
        newTd.textContent = result;
        row.insertBefore(newTd, row.children[columnPosition]);
    });
    showMessage(`New column '${newColumnName}' (${operationType.toUpperCase()}) added successfully!`, "success");
    updateExamCheckboxes();
    updateFilterCheckboxes();
});

// Remove Column
document.getElementById("removeColumn").addEventListener("click", () => {
    const columnName = prompt("Enter the exact column name you want to remove:");
    if (!columnName) return;

    const table = document.getElementById("studentsInformationTable");
    const thead = table.querySelector("thead tr");
    const tbody = table.querySelector("tbody");

    const colIndex = [...thead.children].findIndex(th => th.textContent.trim() === columnName.trim());
    if (colIndex === -1) {
        showMessage("Column not found!", "error");
        return;
    }

    thead.removeChild(thead.children[colIndex]);
    Array.from(tbody.children).forEach(row => row.removeChild(row.children[colIndex]));
    showMessage(`Column '${columnName}' removed successfully.`, "success");
    updateExamCheckboxes();
    updateFilterCheckboxes();
});

//Clear All Added Columns
document.getElementById("clearColumns").addEventListener("click", () => {
    if (!originalData) {
        showMessage("No data to restore!", "error");
        return;
    }
    renderTable(originalData);
    currentData = JSON.parse(JSON.stringify(originalData));
    showMessage("Table restored to original state!", "success");
});


document.getElementById("applyFilter").addEventListener("click", () => {
    const criteria = document.getElementById("filterCriteria").value;
    const filterValue = parseFloat(document.getElementById("filterValue").value);

    const selectedColumns = Array.from(
        document.querySelectorAll("#filterColumnCheckboxes input:checked")
    ).map(cb => cb.value);

    if (selectedColumns.length === 0 || isNaN(filterValue)) {
        showMessage("Please select exams and enter valid marks!", "error");
        return;
    }

    const table = document.getElementById("studentsInformationTable");
    const thead = table.querySelector("thead tr");
    const tbody = table.querySelector("tbody");

    const colIndexes = selectedColumns.map(col =>
        [...thead.children].findIndex(th => th.textContent === col)
    );

    /* FILTER ROWS */
    Array.from(tbody.children).forEach(row => {
        const cells = row.children;

        const matches = colIndexes.every(i => {
            const val = parseFloat(cells[i]?.textContent) || 0;

            if (criteria === "below") return val < filterValue;
            if (criteria === "above") return val > filterValue;
            if (criteria === "equal") return val === filterValue;
        });

        row.style.display = matches ? "" : "none";
    });

    /* RECALCULATE SERIAL NUMBERS (ONCE) */
    let serial = 1;
    Array.from(tbody.children).forEach(row => {
        if (row.style.display !== "none") {
            row.children[0].textContent = serial++;
        }
    });
    showMessage(`Filter applied: ${criteria.toUpperCase()} ${filterValue} in ${selectedColumns.join(", ")}`, "success");
});


// Clear Filter
document.getElementById("clearFilter").addEventListener("click", () => {
    Array.from(document.querySelectorAll("#studentsInformationTable tbody tr")).forEach(row => {
        row.style.display = "";
    });
    document.getElementById("filterValue").value = "";
    document.querySelectorAll("#filterColumnCheckboxes input").forEach(cb => (cb.checked = false));

    //Restore serial numbers
    Array.from(document.querySelectorAll("#studentsInformationTable tbody tr"))
        .forEach((row, index) => {
            row.children[0].textContent = index + 1;
        });
    showMessage("Filters cleared.", "success");
});

const logoutBtn = document.getElementById("logoutBtn");
    // logout
    if (logoutBtn) {
    logoutBtn.addEventListener("click", async function () {

        const role = localStorage.getItem("role");
        const userId = localStorage.getItem("facultyId");
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
document.getElementById("printReport").addEventListener("click", function () {
    const year = localStorage.getItem("selectedYear");
    const branch = localStorage.getItem("selectedBranch");
    const subject = localStorage.getItem("selectedSubject");

    const tableHTML = document.getElementById("studentsInformationTable").outerHTML;
    const win = window.open("", "_blank");
    
    win.document.open();
    win.document.write(`
        <html>
        <head>
            <title>Overall Marks Report</title>
            <style>
                body { font-family: Arial; text-align: center; }
                img {
                    width: 100%;
                    height: auto;
                    max-height: 180px;
                    object-fit: contain;
                    margin-bottom: 20px;
                }
                h2 { margin: 10px 0; }
                .meta { font-weight: bold; margin-bottom: 20px; }
                table { width: 100%; border-collapse: collapse; }
                th, td { border: 1px solid #000; padding: 8px; }
                .signatures {
                    margin-top: 50px;
                    display: flex;
                    justify-content: space-between;
                }
            </style>
        </head>
        <body>

            <img src="balaji.png" alt="College Logo"/>

            <h2>Overall Marks Report</h2>

            <div class="meta">
                Branch: ${branch} &nbsp; | &nbsp;
                Year: ${year} &nbsp; | &nbsp;
                Subject: ${subject}
            </div>

            ${tableHTML}

            <div class="signatures">
                <div>Faculty</div>
                <div>HOD</div>
                <div>Dean</div>
                <div>Principal</div>
            </div>

        </body>
        </html>
    `);

     win.document.close();

    
});

// EXPORT TABLE 
document.getElementById("exportCSV").addEventListener("click", function () {
    const table = document.getElementById("studentsInformationTable");
    if (!table) return showMessage("No table data found!", "error");

    let csvContent = "";
    const rows = table.querySelectorAll("tr");

    rows.forEach(row => {
        if (row.style.display === "none") return;

        const cols = row.querySelectorAll("th, td");
        const rowData = Array.from(cols)
            .map(col => {
                let text = col.innerText.trim();
                // Remove commas and escape quotes
                text = text.replace(/,/g, "");
                if (text.includes('"')) text = text.replace(/"/g, '""');
                return `"${text}"`;
            })
            .join(",");
        csvContent += rowData + "\n";
    });

    // Trigger download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "Filtered_Student_Marks.csv";
    link.click();
    URL.revokeObjectURL(url);
});

