document.addEventListener("DOMContentLoaded", function () {
    fetchYears();
});

async function fetchYears() {
    try {
        const response = await fetch("/getYears");
        const years = await response.json();
        const yearSelect = document.getElementById("yearSelect");

        yearSelect.innerHTML = `<option value="">Select Year</option>`;
        years.forEach(({ year }) => {
            yearSelect.innerHTML += `<option value="${year}">${year}</option>`;
        });

        yearSelect.addEventListener("change", fetchBranches);
    } catch (error) {
        console.error("Error fetching years:", error);
    }
}

async function fetchBranches() {
    const year = document.getElementById("yearSelect").value;
    if (!year) return;

    try {
        const response = await fetch(`/getBranches/${year}`);
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

    if (!year || !branch) {
        alert("Please select both Year and Branch.");
        return;
    }

    fetch(`/getData?branch=${branch}&year=${year}`)
        .then(response => response.json())
        .then(data => {
            tbody.innerHTML = "";
            data.forEach((student, index) => {
                let row = document.createElement("tr");
                row.innerHTML = `
                    <td>${index + 1}</td>
                    <td>${student.htno}</td>
                    <td>${student.name}</td>
                `;
                tbody.appendChild(row);
            });
        })
        .catch(error => console.error("Error fetching data:", error));
}

function showTableControls() {
    table.style.display = "table";
    document.getElementById('addRow').style.display = "inline-block";
    document.getElementById('save').style.display = "inline-block";
}

