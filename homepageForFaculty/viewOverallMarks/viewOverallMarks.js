let originalData = null;
let currentData = null; // store current filtered/modified data

// Fetch data and render
document.getElementById("getStudentMarks").addEventListener("click", () => {
    const selectedYear = localStorage.getItem("selectedYear");
    const selectedBranch = localStorage.getItem("selectedBranch");
    const selectedSubject = localStorage.getItem("selectedSubject");

    fetch(`/getOverallMarks?year=${selectedYear}&branch=${selectedBranch}&subject=${selectedSubject}`)
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

// 🔁 Render Table Function
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

// ✅ Update exam selection checkboxes dynamically
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

// ✅ Update filter column checkboxes dynamically
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

// ➕ Add Column (Sum/Average)
document.getElementById("addColumn").addEventListener("click", () => {
    const selectedExams = Array.from(document.querySelectorAll("#examCheckboxes input:checked")).map(cb => cb.value);
    const newColumnName = document.getElementById("newColumnName").value.trim();
    const columnPosition = parseInt(document.getElementById("columnPosition").value, 10);
    const operationType = document.querySelector('input[name="operationType"]:checked').value;

    if (selectedExams.length === 0 || newColumnName === "") {
        alert("Please select exams and enter a column name.");
        return;
    }

    const table = document.getElementById("studentsInformationTable");
    const thead = table.querySelector("thead tr");
    const tbody = table.querySelector("tbody");

    const existingHeaders = Array.from(thead.children).map(th => th.textContent.trim());
    if (existingHeaders.includes(newColumnName)) {
        alert("A column with this name already exists!");
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

    alert(`New column '${newColumnName}' (${operationType.toUpperCase()}) added successfully!`);

    updateExamCheckboxes();
    updateFilterCheckboxes();
});

// 🗑️ Remove Column
document.getElementById("removeColumn").addEventListener("click", () => {
    const columnName = prompt("Enter the exact column name you want to remove:");
    if (!columnName) return;

    const table = document.getElementById("studentsInformationTable");
    const thead = table.querySelector("thead tr");
    const tbody = table.querySelector("tbody");

    const colIndex = [...thead.children].findIndex(th => th.textContent.trim() === columnName.trim());
    if (colIndex === -1) {
        alert("Column not found!");
        return;
    }

    thead.removeChild(thead.children[colIndex]);
    Array.from(tbody.children).forEach(row => row.removeChild(row.children[colIndex]));

    alert(`Column '${columnName}' removed successfully.`);
    updateExamCheckboxes();
    updateFilterCheckboxes();
});

// ♻️ Clear All Added Columns
document.getElementById("clearColumns").addEventListener("click", () => {
    if (!originalData) {
        alert("No data to restore!");
        return;
    }
    renderTable(originalData);
    currentData = JSON.parse(JSON.stringify(originalData));
    alert("✅ Table restored to original state!");
});

// 🔍 Apply Filter
document.getElementById("applyFilter").addEventListener("click", () => {
    const filterValue = parseFloat(document.getElementById("filterValue").value);
    const selectedColumns = Array.from(document.querySelectorAll("#filterColumnCheckboxes input:checked")).map(cb => cb.value);

    if (selectedColumns.length === 0 || isNaN(filterValue)) {
        alert("Please select at least one column and enter a valid number!");
        return;
    }

    const table = document.getElementById("studentsInformationTable");
    const thead = table.querySelector("thead tr");
    const tbody = table.querySelector("tbody");

    const colIndexes = selectedColumns.map(col =>
        [...thead.children].findIndex(th => th.textContent === col)
    );

    const rows = Array.from(tbody.children);
    rows.forEach(row => {
        const cells = row.children;
        const meetsCondition = colIndexes.every(i => {
            const val = parseFloat(cells[i]?.textContent) || 0;
            return val <= filterValue;
        });
        row.style.display = meetsCondition ? "" : "none";
    });

    alert(`✅ Filter applied: showing students with <= ${filterValue} in ${selectedColumns.join(", ")}.`);
});

// ❌ Clear Filter
document.getElementById("clearFilter").addEventListener("click", () => {
    Array.from(document.querySelectorAll("#studentsInformationTable tbody tr")).forEach(row => {
        row.style.display = "";
    });
    document.getElementById("filterValue").value = "";
    document.querySelectorAll("#filterColumnCheckboxes input").forEach(cb => (cb.checked = false));
    alert("✅ All filters cleared!");
});


const logoutBtn = document.getElementById("logoutBtn");
    // logout
    if (logoutBtn) {
        logoutBtn.addEventListener("click", function () {
            if (!confirm("Log out of the faculty panel?")) return;
            // Clear session-related storage
            localStorage.removeItem("selectedYear");
            localStorage.removeItem("selectedBranch");
            localStorage.removeItem("selectedSubject");
            localStorage.removeItem("facultyId");

            fetch("/logout", { method: "POST" })
                .then(() => { window.location.href = "/"; })
                .catch(() => { window.location.href = "/"; });
        });
    }
document.getElementById("printReport").addEventListener("click", function () {

            const year = localStorage.getItem("selectedYear");
            const branch = localStorage.getItem("selectedBranch");
            const subject = localStorage.getItem("selectedSubject");
            
            const printContent = document.getElementById("studentsInformationTable").outerHTML;
            const newWindow = window.open("", "_blank");

            newWindow.document.write(`
                <html>
                <head>
                    <title>Student Overall Marks Report</title>
                    <style>
                        body { font-family: Arial, sans-serif; text-align: center; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th, td { border: 1px solid black; padding: 8px; text-align: center; }
                        th { background-color: #f2f2f2; }
                        .report-details { margin-top: 20px; font-size: 18px; font-weight: bold; }
                    </style>
                </head>
                <body>
                    <h2>Overall Marks Report</h2>
                    <div class="report-details">
                        <span>Branch: ${branch} | </span>
                        <span>Year: ${year} | </span>
                        <span>Subject: ${subject}</span>
                    </div>
                    ${printContent}
                </body>
                </html>
            `);

            newWindow.document.close();
            newWindow.print();
        
});
