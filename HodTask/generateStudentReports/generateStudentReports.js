document.addEventListener("DOMContentLoaded", function () {
    const yearSelect = document.getElementById("year");
    const branchSelect = document.getElementById("branch");
    const subjectSelect = document.getElementById("subject");
    const examSelect = document.getElementById("exam");
    const fetchReportsBtn = document.getElementById("fetchReports");
    const studentTable = document.getElementById("studentTable");
    const studentBody = document.getElementById("studentBody");
    const filterInput = document.getElementById("filterMarks");
    const applyFilterBtn = document.getElementById("applyFilter");
    const printReportBtn = document.getElementById("printReport");

    let studentData = []; // To store all students for filtering
    // Fetch available years
    fetch("/getYears")
        .then(response => response.json())
        .then(data => {
            data.forEach(item => {
                let option = document.createElement("option");
                option.value = item.year;
                option.textContent = item.year;
                yearSelect.appendChild(option);
            });
        });
    // Fetch branches based on year selection
    yearSelect.addEventListener("change", function () {
        branchSelect.innerHTML = `<option value="">--Select Branch--</option>`;
        subjectSelect.innerHTML = `<option value="">--Select Subject--</option>`;
        examSelect.innerHTML = `<option value="">--Select Exam--</option>`;
        subjectSelect.disabled = true;
        examSelect.disabled = true;
        fetchReportsBtn.disabled = true;

        if (yearSelect.value) {
            branchSelect.disabled = false;
            fetch(`/getBranches/${yearSelect.value}`)
                .then(response => response.json())
                .then(data => {
                    data.forEach(branch => {
                        let option = document.createElement("option");
                        option.value = branch.branch_name;
                        option.textContent = branch.branch_name;
                        branchSelect.appendChild(option);
                    });
                });
        } else {
            branchSelect.disabled = true;
        }
    });

    // Fetch subjects based on year & branch
    branchSelect.addEventListener("change", function () {
        subjectSelect.innerHTML = `<option value="">--Select Subject--</option>`;
        examSelect.innerHTML = `<option value="">--Select Exam--</option>`;
        subjectSelect.disabled = true;
        examSelect.disabled = true;
        fetchReportsBtn.disabled = true;

        if (branchSelect.value) {
            subjectSelect.disabled = false;
            fetch(`/getSubjects/${yearSelect.value}/${branchSelect.value}`)
                .then(response => response.json())
                .then(data => {
                    data.forEach(subject => {
                        let option = document.createElement("option");
                        option.value = subject.subject_name;
                        option.textContent = subject.subject_name;
                        subjectSelect.appendChild(option);
                    });
                });
        }
    });

    // Fetch exams dynamically based on year & branch
    branchSelect.addEventListener("change", function () {
        examSelect.innerHTML = `<option value="">--Select Exam--</option>`;
        examSelect.disabled = true;

        if (yearSelect.value && branchSelect.value) {
            fetch(`/getExamsForHod/${yearSelect.value}/${branchSelect.value}`)
                .then(response => response.json())
                .then(data => {
                    if (data.length > 0) {
                        examSelect.disabled = false;
                        data.forEach(exam => {
                            let option = document.createElement("option");
                            option.value = exam;
                            option.textContent = exam;
                            examSelect.appendChild(option);
                        });
                    }
                })
                .catch(error => console.error("Error fetching exams:", error));
        }
    });

    // Enable Fetch Reports button
    examSelect.addEventListener("change", function () {
        fetchReportsBtn.disabled = !examSelect.value;
    });

    // Fetch student reports
    fetchReportsBtn.addEventListener("click", function () {
        fetch(`/getStudentReports/${yearSelect.value}/${branchSelect.value}/${subjectSelect.value}/${examSelect.value}`)
            .then(response => response.json())
            .then(data => {
                studentData = data; // Store the full student data
                displayStudents(studentData); // Show all students initially
            });
    });

    // Function to display students in the table
    function displayStudents(data) {
        studentBody.innerHTML = "";
        studentTable.style.display = data.length > 0 ? "table" : "none";

        data.forEach(student => {
            let row = document.createElement("tr");
            row.innerHTML = `
                <td>${student.htno}</td>
                <td>${student.name}</td>
                <td>${student.marks || "N/A"}</td>
            `;
            studentBody.appendChild(row);
        });
    }

    // Apply filter for students based on marks
    applyFilterBtn.addEventListener("click", function () {
        const filterValue = parseInt(filterInput.value);
        if (!isNaN(filterValue)) {
            const filteredData = studentData.filter(student => student.marks !== "N/A" && student.marks < filterValue);
            displayStudents(filteredData);
        } else {
            displayStudents(studentData); // Reset if no valid input
        }
    });
    

    // Show Print button only when table is displayed
    function displayStudents(data) {
        studentBody.innerHTML = "";
        studentTable.style.display = data.length > 0 ? "table" : "none";
        printReportBtn.style.display = data.length > 0 ? "block" : "none"; // Show print button

        data.forEach(student => {
            let row = document.createElement("tr");
            row.innerHTML = `
                <td>${student.htno}</td>
                <td>${student.name}</td>
                <td>${student.marks || "N/A"}</td>
            `;
            studentBody.appendChild(row);
        });
    }

    // Print the student report
    printReportBtn.addEventListener("click", function () {
        printTable();
    });

    function printTable() {
        const selectedYear = document.getElementById("year").value;
        const selectedBranch = document.getElementById("branch").value;
        const selectedSubject = document.getElementById("subject").value;
        const selectedExam = document.getElementById("exam").value;

        const tableContent = `
            <html>
            <head>
                <title>Student Report</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        margin: 20px;
                    }
                    h2, h3 {
                        text-align: center;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-top: 20px;
                    }
                    th, td {
                        border: 1px solid black;
                        padding: 8px;
                        text-align: left;
                    }
                    th {
                        background-color: #f2f2f2;
                    }
                    .details {
                        text-align: center;
                        font-size: 16px;
                        margin-bottom: 10px;
                    }
                </style>
            </head>
            <body>
                <h2>Student Report</h2>
                <div class="details">
                    <p><strong>Year:</strong> ${selectedYear}</p>
                    <p><strong>Branch:</strong> ${selectedBranch}</p>
                    <p><strong>Subject:</strong> ${selectedSubject}</p>
                    <p><strong>Exam:</strong> ${selectedExam}</p>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>HTNO</th>
                            <th>Name</th>
                            <th>Marks</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${studentBody.innerHTML}
                    </tbody>
                </table>
                <script>
                    window.onload = function() { window.print(); }
                </script>
            </body>
            </html>
        `;

        const printWindow = window.open("", "_blank");
        printWindow.document.write(tableContent);
        printWindow.document.close();
    }

});




