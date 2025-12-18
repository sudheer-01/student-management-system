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
    
// Fetch available years from localStorage instead of API
const storedYears = localStorage.getItem("hodYears");
const hodBranch = localStorage.getItem("hodBranch"); // HOD branch filter

if (storedYears) {
    let parsedYears;
    try {
        parsedYears = JSON.parse(storedYears); // ["2","3","4"]
    } catch (e) {
        parsedYears = storedYears.split(","); // "2,3,4"
    }

    parsedYears.forEach(year => {
        let option = document.createElement("option");
        option.value = year.trim();
        option.textContent = `${year.trim()} Year`;
        yearSelect.appendChild(option);
    });
}

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

        // Call updated API with year + hodBranch
        fetch(`/getbranches/${yearSelect.value}/${hodBranch}`)
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
        .then(async data => {
            studentData = data;

            // 🔹 Fetch max marks for selected exam
            const maxMarksResponse = await fetch(
                `/getExamMaxMarks/${yearSelect.value}/${branchSelect.value}/${examSelect.value}`
            );
            const maxMarksData = await maxMarksResponse.json();

            updateMarksHeader(maxMarksData.maxMarks);
            displayStudents(studentData);
        });

    });
    
    function updateMarksHeader(maxMarks) {
        const marksHeader = document.querySelector("#studentTable thead th:last-child");

        if (maxMarks !== null) {
            marksHeader.textContent = `Marks (Max: ${maxMarks})`;
        } else {
            marksHeader.textContent = "Marks";
        }
    }


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
        const criteria = document.getElementById("filterType").value;
        const marksValue = parseInt(filterInput.value);

        if (!criteria || isNaN(marksValue)) {
            alert("Please select filter criteria and enter marks");
            return;
        }

        let filteredData = [];

        switch (criteria) {
            case "less":
                filteredData = studentData.filter(
                    s => s.marks !== "N/A" && s.marks < marksValue
                );
                break;

            case "greater":
                filteredData = studentData.filter(
                    s => s.marks !== "N/A" && s.marks > marksValue
                );
                break;

            case "equal":
                filteredData = studentData.filter(
                    s => s.marks !== "N/A" && s.marks === marksValue
                );
                break;
        }

        displayStudents(filteredData);
    });
    

    // Show Print button only when table is displayed
   function displayStudents(data) {
        studentBody.innerHTML = "";

        const noDataMessage = document.getElementById("noDataMessage");

        if (!data || data.length === 0) {
            studentTable.style.display = "none";
            printReportBtn.style.display = "none";
            noDataMessage.style.display = "block";
            return;
        }

        // If data exists
        noDataMessage.style.display = "none";
        studentTable.style.display = "table";
        printReportBtn.style.display = "block";

        data.forEach(student => {
            let row = document.createElement("tr");
            row.innerHTML = `
                <td>${student.htno}</td>
                <td>${student.name}</td>
                <td>${student.marks ?? "N/A"}</td>
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

        const marksHeader =
            currentMaxMarks !== null
                ? `Marks (Max: ${currentMaxMarks})`
                : "Marks";

        const tableRows = studentBody.innerHTML;

        const printContent = `
            <html>
            <head>
                <title>Students Report</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        margin: 20px;
                        text-align: center;
                    }
                    img {
                        max-width: 120px;
                        margin-bottom: 10px;
                    }
                    h2 {
                        margin: 10px 0;
                    }
                    .info-row {
                        margin: 15px 0;
                        font-size: 15px;
                        font-weight: bold;
                        display: flex;
                        justify-content: space-around;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-top: 15px;
                    }
                    th, td {
                        border: 1px solid black;
                        padding: 8px;
                        text-align: center;
                    }
                    th {
                        background-color: #f2f2f2;
                    }
                </style>
            </head>
            <body>
                <!-- College Logo -->
                <img src="balaji.png" alt="College Logo">

                <!-- Report Title -->
                <h2>STUDENTS REPORT</h2>

                <!-- Single Row Info -->
                <div class="info-row">
                    <span>Year: ${selectedYear}</span>
                    <span>Section: ${selectedBranch}</span>
                    <span>Subject: ${selectedSubject}</span>
                    <span>Exam: ${selectedExam}</span>
                </div>

                <!-- Student Table -->
                <table>
                    <thead>
                        <tr>
                            <th>HTNO</th>
                            <th>Name</th>
                            <th>${marksHeader}</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tableRows}
                    </tbody>
                </table>

                <script>
                    window.onload = function () {
                        window.print();
                    };
                </script>
            </body>
            </html>
        `;

        const printWindow = window.open("", "_blank");
        printWindow.document.write(printContent);
        printWindow.document.close();
    }
    
});


const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
        logoutBtn.addEventListener("click", function () {
            if (!confirm("Log out?")) return;
            fetch("/logout", { method: "POST" })
                .then(() => { window.location.href = "/"; })
                .catch(() => { window.location.href = "/"; });
        });
    }

