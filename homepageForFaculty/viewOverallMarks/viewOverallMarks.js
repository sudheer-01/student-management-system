document.getElementById("getStudentMarks").addEventListener("click", () => {
    fetch("/getOverallMarks")
        .then(response => response.json())
        .then(data => {
            const table = document.getElementById("studentsInformationTable");
            const thead = table.querySelector("thead tr");
            const tbody = table.querySelector("tbody");

            tbody.innerHTML = ""; // Clear previous data
            thead.innerHTML = "<th>S.NO</th><th>HallTicket Number</th><th>Student Name</th>";

            if (data.length === 0) {
                tbody.innerHTML = "<tr><td colspan='99'>No data found</td></tr>";
                return;
            }

            // Extract dynamic column names from first row (excluding htno, name)
            let examColumns = Object.keys(data[0]).filter(col => col !== "htno" && col !== "name");

            // Append dynamic exam headers
            examColumns.forEach(col => {
                const th = document.createElement("th");
                th.textContent = col.replace(/_/g, " "); // Format column name
                thead.appendChild(th);
            });

            // Append student data rows
            data.forEach((student, index) => {
                const tr = document.createElement("tr");
                tr.innerHTML = `<td>${index + 1}</td><td>${student.htno}</td><td>${student.name}</td>`;

                examColumns.forEach(col => {
                    tr.innerHTML += `<td>${student[col] ?? "-"}</td>`; // Show '-' if null
                });

                tbody.appendChild(tr);
            });

            // Populate exam selection checkboxes
            const examCheckboxes = document.getElementById("examCheckboxes");
            examCheckboxes.innerHTML = ""; // Clear previous checkboxes

            examColumns.forEach(col => {
                let label = document.createElement("label");
                let checkbox = document.createElement("input");
                checkbox.type = "checkbox";
                checkbox.value = col;
                label.appendChild(checkbox);
                label.appendChild(document.createTextNode(col.replace(/_/g, " ")));
                examCheckboxes.appendChild(label);
            });

            document.getElementById("addColumnSection").style.display = "block"; // Show add column section
        })
        .catch(error => console.error("Error fetching student marks:", error));
});

// Function to add a new column
document.getElementById("addColumn").addEventListener("click", () => {
    const selectedExams = Array.from(document.querySelectorAll("#examCheckboxes input:checked")).map(checkbox => checkbox.value);
    const newColumnName = document.getElementById("newColumnName").value.trim();
    const columnPosition = parseInt(document.getElementById("columnPosition").value, 10);

    if (selectedExams.length === 0 || newColumnName === "") {
        alert("Please select exams and enter a column name.");
        return;
    }

    const thead = document.getElementById("studentsInformationTable").querySelector("thead tr");
    const tbody = document.getElementById("studentsInformationTable").querySelector("tbody");

    // Insert the new column header at the specified position
    let newTh = document.createElement("th");
    newTh.textContent = newColumnName;
    thead.insertBefore(newTh, thead.children[columnPosition]);

    // Insert calculated sum for each student in the new column
    Array.from(tbody.children).forEach(row => {
        let studentData = row.children;
        let sum = 0;

        selectedExams.forEach(exam => {
            let examIndex = [...thead.children].findIndex(th => th.textContent === exam.replace(/_/g, " "));
            let marks = studentData[examIndex]?.textContent || "0";
            sum += parseInt(marks) || 0;
        });

        let newTd = document.createElement("td");
        newTd.textContent = sum;
        row.insertBefore(newTd, row.children[columnPosition]);
    });

    alert("New column added successfully!");
});

document.getElementById("printReport").addEventListener("click", function () {
    fetch("/getReportDetails")
        .then(response => response.json())
        .then(data => {
            const branch = data.branch;
            const year = data.year;
            const subject = data.subject;
            
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
        })
        .catch(error => console.error("Error fetching report details:", error));
});
