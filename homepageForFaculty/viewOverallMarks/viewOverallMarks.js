// Store original backend data to restore later
let originalData = null;

// When fetching student data, also store the original data & headers
document.getElementById("getStudentMarks").addEventListener("click", () => {
    const selectedYear = localStorage.getItem("selectedYear");
    const selectedBranch = localStorage.getItem("selectedBranch");
    const selectedSubject = localStorage.getItem("selectedSubject");

    fetch(`/getOverallMarks?year=${selectedYear}&branch=${selectedBranch}&subject=${selectedSubject}`)
        .then(response => response.json())
        .then(data => {
            const table = document.getElementById("studentsInformationTable");
            const thead = table.querySelector("thead tr");
            const tbody = table.querySelector("tbody");

            tbody.innerHTML = "";
            thead.innerHTML = "<th>S.NO</th><th>HallTicket Number</th><th>Student Name</th>";

            if (data.length === 0) {
                tbody.innerHTML = "<tr><td colspan='99'>No data found</td></tr>";
                return;
            }

            // Save original data for reset
            originalData = JSON.parse(JSON.stringify(data));

            let examColumns = Object.keys(data[0]).filter(col => col !== "htno" && col !== "name");

            // Append headers
            examColumns.forEach(col => {
                const th = document.createElement("th");
                th.textContent = col.replace(/_/g, " ");
                thead.appendChild(th);
            });

            // Fill table
            data.forEach((student, index) => {
                const tr = document.createElement("tr");
                tr.innerHTML = `<td>${index + 1}</td><td>${student.htno}</td><td>${student.name}</td>`;
                examColumns.forEach(col => {
                    tr.innerHTML += `<td>${student[col] ?? "-"}</td>`;
                });
                tbody.appendChild(tr);
            });

            // Update checkboxes for column selection
            updateExamCheckboxes();

            document.getElementById("addColumnSection").style.display = "block";
        })
        .catch(error => console.error("Error fetching student marks:", error));
});

// ✅ Utility: Update exam selection checkboxes dynamically
function updateExamCheckboxes() {
    const thead = document.querySelector("#studentsInformationTable thead tr");
    const examCheckboxes = document.getElementById("examCheckboxes");
    examCheckboxes.innerHTML = "";

    // Skip first 3 static columns (S.NO, HallTicket, Name)
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

// ✅ Add Column (Sum / Average)
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

    // Prevent duplicate column names
    const existingHeaders = Array.from(thead.children).map(th => th.textContent.trim());
    if (existingHeaders.includes(newColumnName)) {
        alert("A column with this name already exists!");
        return;
    }

    // Insert new column header
    const newTh = document.createElement("th");
    newTh.textContent = newColumnName;
    thead.insertBefore(newTh, thead.children[columnPosition]);

    // Calculate and insert values
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

        const result =
            operationType === "average" && values.length > 0
                ? (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2)
                : values.reduce((a, b) => a + b, 0);

        const newTd = document.createElement("td");
        newTd.textContent = result;
        row.insertBefore(newTd, row.children[columnPosition]);
    });

    alert(`New column '${newColumnName}' (${operationType.toUpperCase()}) added successfully!`);

    updateExamCheckboxes(); // ✅ Refresh checkboxes to include new column
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

    updateExamCheckboxes(); // ✅ Refresh checkboxes again
});

// ♻️ Clear All Added Columns — restore original backend data
document.getElementById("clearColumns").addEventListener("click", () => {
    if (!originalData) {
        alert("No data to restore!");
        return;
    }

    const table = document.getElementById("studentsInformationTable");
    const thead = table.querySelector("thead tr");
    const tbody = table.querySelector("tbody");

    tbody.innerHTML = "";
    thead.innerHTML = "<th>S.NO</th><th>HallTicket Number</th><th>Student Name</th>";

    const examColumns = Object.keys(originalData[0]).filter(col => col !== "htno" && col !== "name");

    examColumns.forEach(col => {
        const th = document.createElement("th");
        th.textContent = col.replace(/_/g, " ");
        thead.appendChild(th);
    });

    originalData.forEach((student, index) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `<td>${index + 1}</td><td>${student.htno}</td><td>${student.name}</td>`;
        examColumns.forEach(col => {
            tr.innerHTML += `<td>${student[col] ?? "-"}</td>`;
        });
        tbody.appendChild(tr);
    });

    alert("✅ Table restored to original state!");
    updateExamCheckboxes();
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
