document.addEventListener("DOMContentLoaded", function () {
    fetchYears();
});

async function fetchYears() {
    try {
    const storedYears = localStorage.getItem("hodYears");
    if (!storedYears) {
        console.warn("No HOD years found in localStorage");
        return;
    }

    let parsedYears;
    try {
        // Try parsing JSON (["2","3","4"])
        parsedYears = JSON.parse(storedYears);
    } catch (e) {
        // Fallback to comma-split ("2,3,4")
        parsedYears = storedYears.split(",");
    }

    // Convert to numbers (int)
    const years = parsedYears.map(year => parseInt(year, 10));

    const yearSelect = document.getElementById("yearSelect");
    yearSelect.innerHTML = `<option value="">Select Year</option>`;

    years.forEach(year => {
        yearSelect.innerHTML += `<option value="${year}">${year} Year</option>`;
    });

    yearSelect.addEventListener("change", fetchBranches);
} catch (error) {
    console.error("Error loading years from localStorage:", error);
}

}

async function fetchBranches() {
    const year = document.getElementById("yearSelect").value;
    const branch = localStorage.getItem("hodBranch"); // example: "CSE" or "ECE"
    
    if (!year || !branch) return;

    try {
        const response = await fetch(`/getbranches/${year}/${branch}`);
        const branches = await response.json();
        const branchSelect = document.getElementById("branchSelect");

        branchSelect.innerHTML = `<option value="">Select Branch</option>`;
        branches.forEach(({ branch_name }) => {
            branchSelect.innerHTML += `<option value="${branch_name}">${branch_name}</option>`;
        });
    } catch (error) {
        console.error("Error fetching branches:", error);
    }
}

let table = document.getElementById('studentsInformationTable');
let tbody = table.tBodies[0];
let sno = 1;

document.getElementById('addRow').addEventListener("click", addRow);
function addRow() {
    let nextRow = document.createElement("tr");
    nextRow.innerHTML = `
        <td>${sno}</td>
        <td><input type="text" placeholder="Enter Hall Ticket Number" id="htno${sno}" required/></td>
        <td><input type="text" placeholder="Enter Name" id="name${sno}" required/></td>
    `;
    tbody.appendChild(nextRow);
    sno++;
    showTableControls();
}

function rowsBasedOnNumber() {
    let rows = parseInt(document.getElementById("noOfRows").value);
    tbody.innerHTML = "";
    sno = 1;
    for (let i = 0; i < rows; i++) {
        addRow();
    }
    showTableControls();
}

document.getElementById("studentsForm").addEventListener("submit", function (event) {
    event.preventDefault();

    let year = document.getElementById("yearSelect").value;
    let branch = document.getElementById("branchSelect").value;

    if (!year || !branch) {
        alert("Please select Year and Branch.");
        return;
    }

    let students = [];
    let rows = document.querySelectorAll("#studentsInformationTable tbody tr");

    rows.forEach(row => {
        let htno = row.querySelector("td:nth-child(2) input").value;
        let name = row.querySelector("td:nth-child(3) input").value;
        students.push({ htno, name, year, branch });
    });

    fetch("/saveData", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ students })
    })
    .then(response => response.text())
    .then(data => alert(data))
    .catch(error => console.error("Error:", error));
});

document.getElementById("getStudentsInfo").addEventListener("click", function() {
    fetchStudentData();
    showTableControls();
});

function fetchStudentData() {
    let year = document.getElementById("yearSelect").value;
    let branch = document.getElementById("branchSelect").value;

    const noDataMsg = document.getElementById("noDataMsg");

    if (!year || !branch) {
        alert("Please select both Year and Section.");
        return;
    }

    fetch(`/getData?branch=${branch}&year=${year}`)
        .then(response => {
            if (!response.ok) {
                throw new Error("Failed to fetch student data");
            }
            return response.json();
        })
        .then(data => {
            // Clear previous table data
            tbody.innerHTML = "";

            // CASE 1: No data available
            if (!data || data.length === 0) {
                table.style.display = "none";
                document.getElementById("addRow").style.display = "none";
                document.getElementById("save").style.display = "none";

                if (noDataMsg) {
                    noDataMsg.style.display = "block";
                }
                return;
            }

            // CASE 2: Data exists
            if (noDataMsg) {
                noDataMsg.style.display = "none";
            }

            table.style.display = "table";
            document.getElementById("addRow").style.display = "inline-block";
            document.getElementById("save").style.display = "inline-block";

            data.forEach((student, index) => {
                let row = document.createElement("tr");
                row.innerHTML = `
                    <td>${index + 1}</td>
                    <td>${student.htno}</td>
                    <td>${student.full_name}</td>
                `;
                tbody.appendChild(row);
            });
        })
        .catch(error => {
            console.error("Error fetching student data:", error);
            alert("Error while fetching student details.");
        });
}

function showTableControls() {
    table.style.display = "table";
    document.getElementById('addRow').style.display = "inline-block";
    document.getElementById('save').style.display = "inline-block";
}

document.getElementById("importExcel").addEventListener("click", () => {
    const fileInput = document.getElementById("excelFile");
    const file = fileInput.files[0];

    if (!file) {
        alert("Please select an Excel file.");
        return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet);

        tbody.innerHTML = "";
        sno = 1;

        rows.forEach(student => {
            if (!student["HallTicket Number"] || !student["Student Name"]) return;

            let tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${sno}</td>
                <td><input type="text" value="${student["HallTicket Number"]}" required></td>
                <td><input type="text" value="${student["Student Name"]}" required></td>
            `;
            tbody.appendChild(tr);
            sno++;
        });

        showTableControls();
    };
    reader.readAsArrayBuffer(file);
});
const logoutBtn = document.getElementById("logoutBtn");
    // logout
    if (logoutBtn) {
    logoutBtn.addEventListener("click", async function () {
        if (!confirm("Log out of the faculty panel?")) return;

        const role = localStorage.getItem("role");
        const userId = localStorage.getItem("hodId");

        try {
            await fetch("/logout", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ role, userId })
            });
        } catch (err) {
            console.error("Logout API failed:", err);
        }
        localStorage.clear();

        window.location.href = "/";
    });
    }