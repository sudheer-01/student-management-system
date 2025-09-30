document.addEventListener("DOMContentLoaded", () => {
    loadYears();

    document.getElementById("yearDropdown").addEventListener("change", loadBranches);
    document.getElementById("loadRequests").addEventListener("click", loadRequests);
});

async function loadYears() {
    try {
        // Get stored years from localStorage
        const storedYears = localStorage.getItem("hodYears");
        if (!storedYears) return;

        // Parse and clean years (convert to integers)
        const years = JSON.parse(storedYears).map(y => parseInt(y, 10));

        const dropdown = document.getElementById("yearDropdown");
        dropdown.innerHTML = '<option value="">Select Year</option>';

        years.forEach(year => {
            let option = new Option(`${year} Year`, year);
            dropdown.add(option);
        });
    } catch (err) {
        console.error("Error loading years:", err);
    }
}

async function loadBranches() {
    const year = document.getElementById("yearDropdown").value;
    if (!year) return;

    // HOD branch filter from localStorage
    const hodBranch = localStorage.getItem("hodBranch") || "";

    try {
        const response = await fetch(`/getbranches/${year}/${hodBranch}`);
        const branches = await response.json();
        const dropdown = document.getElementById("branchDropdown");

        dropdown.innerHTML = '<option value="">Select Branch</option>';
        branches.forEach(({ branch_name }) => {
            let option = new Option(branch_name, branch_name);
            dropdown.add(option);
        });
    } catch (err) {
        console.error("Error loading branches:", err);
    }
}


async function loadRequests() {
    const year = document.getElementById("yearDropdown").value;
    const branch = document.getElementById("branchDropdown").value;

    if (!year || !branch) {
        alert("Please select both year and branch.");
        return;
    }

    const response = await fetch(`/getRequests/${year}/${branch}`);

    if (!response.ok) {
        alert("Failed to load data. Please try again.");
        return;
    }

    const text = await response.text();
    if (!text) {
        alert("No data found.");
        return;
    }

    try {
        const requests = JSON.parse(text);
        populateTable(requests);
    } catch (error) {
        console.error("Error parsing JSON:", error);
    }
}

function populateTable(requests) {
    const tableBody = document.getElementById("requestTable");
    tableBody.innerHTML = "";

    requests.forEach(req => {
        let row = document.createElement("tr");
        row.innerHTML = `
            <td>${req.requested_by}</td>
            <td>${req.subject}</td>
            <td>${req.exam}</td>
            <td>${req.requested_at}</td>
            <td>${req.request_status}</td>
            <td>
                <button class="approve-btn" onclick="updateStatus('${req.requested_by}', '${req.subject}', '${req.exam}', 'Approved')">Approve</button>
                <button class="reject-btn" onclick="updateStatus('${req.requested_by}', '${req.subject}', '${req.exam}', 'Rejected')">Reject</button>
            </td>
            <td>
                <button class="view-btn" onclick="toggleStudentTable(this, '${req.requested_by}', '${req.subject}', '${req.exam}')">View</button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

async function updateStatus(faculty, subject, exam, status) {
    try {
        const response = await fetch(`/updateStatus/${faculty}/${subject}/${exam}/${status}`, { method: "POST" });

        if (!response.ok) {
            throw new Error("Failed to update request status.");
        }

        alert(`Request ${status} successfully!`);
        loadRequests(); // Refresh table after updating
    } catch (error) {
        console.error("Error updating status:", error);
        alert("Error updating status. Please try again.");
    }
}


async function toggleStudentTable(button, faculty, subject, exam) {
    let existingTable = document.querySelector(".student-table");
    if (existingTable) existingTable.remove(); // Remove previous table if present

    try {
        const response = await fetch(`/getUpdate/${faculty}/${subject}/${exam}`);
        if (!response.ok) throw new Error("Failed to fetch data");

        const students = await response.json();

        if (students.length === 0) {
            alert("No student details found for this request.");
            return;
        }

        let table = document.createElement("table");
        table.classList.add("student-table");
        table.innerHTML = `
            <tr>
                <th>HTNO</th>
                <th>Name</th>
                <th>Old Marks</th>
                <th>New Marks</th>
            </tr>
        `;

        students.forEach(student => {
            let row = `<tr>
                <td>${student.htno}</td>
                <td>${student.name}</td>
                <td>${student.old_marks}</td>
                <td>${student.new_marks}</td>
            </tr>`;
            table.innerHTML += row;
        });

        button.closest("tr").after(table); // Insert table below the clicked row
    } catch (error) {
        console.error("Error fetching update details:", error);
        alert("Error fetching details. Please try again.");
    }
}
