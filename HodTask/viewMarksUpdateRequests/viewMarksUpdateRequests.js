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

document.addEventListener("DOMContentLoaded", () => {
    loadYears();

    document.getElementById("yearDropdown").addEventListener("change", loadBranches);
    document.getElementById("loadRequests").addEventListener("click", loadRequests);
});

async function loadYears() {
    try {
        const storedYears = localStorage.getItem("hodYears");
        if (!storedYears) return;

        const years = JSON.parse(storedYears).map(y => parseInt(y, 10));

        const dropdown = document.getElementById("yearDropdown");
        dropdown.innerHTML = '<option value="">Select Year</option>';

        years.forEach(year => {
            let option = new Option(`${year} Year`, year);
            dropdown.add(option);
        });
    } catch (err) {
        showMessage("Error loading years. Please try again.", "error");
        // console.error("Error loading years:", err);
    }
}

async function loadBranches() {
    const year = document.getElementById("yearDropdown").value;
    if (!year) return;

    const hodBranch = localStorage.getItem("hodBranch") || "";
    const role = localStorage.getItem("role");
    const hodId = localStorage.getItem("hodId");
    const sessionValue = localStorage.getItem("key");
    try {
        const response = await fetch(`/getbranches/${role}/${hodId}/${year}/${hodBranch}`,
            {
                 headers: {
                "x-session-key": sessionValue
            }
            }
        );
        const branches = await response.json();
        const dropdown = document.getElementById("branchDropdown");

        dropdown.innerHTML = '<option value="">Select Branch</option>';
        branches.forEach(({ branch_name }) => {
            let option = new Option(branch_name, branch_name);
            dropdown.add(option);
        });
    } catch (err) {
        showMessage("Error loading branches. Please try again.", "error");
        //console.error("Error loading branches:", err);
    }
}


async function loadRequests() {
    const year = document.getElementById("yearDropdown").value;
    const branch = document.getElementById("branchDropdown").value;

    const noMsg = document.getElementById("noRequestsMsg");

    if (!year || !branch) {
        showMessage("Please select both year and branch.", "error");
        return;
    }
    const role = localStorage.getItem("role");
    const hodId = localStorage.getItem("hodId");
    const sessionValue = localStorage.getItem("key");
    const response = await fetch(`/getRequests/${role}/${hodId}/${year}/${branch}`,
        {
                 headers: {
                "x-session-key": sessionValue
            }
        }
    );

    if (!response.ok) {
        showMessage("Failed to load data. Please try again.", "error");
        return;
    }

    const requests = await response.json();

    if (!requests || requests.length === 0) {
        document.getElementById("requestTable").innerHTML = "";
        noMsg.style.display = "block"; 
        return;
    }

    noMsg.style.display = "none"; 
    populateTable(requests);
}

function populateTable(requests) {
    const tableBody = document.getElementById("requestTable");
    const noMsg = document.getElementById("noRequestsMsg");

    tableBody.innerHTML = "";

    if (!requests || requests.length === 0) {
        noMsg.style.display = "block";
        return;
    }

    noMsg.style.display = "none";

    requests.forEach(req => {
        let row = document.createElement("tr");
        row.innerHTML = `
            <td>${req.requested_by}</td>
            <td>${req.subject}</td>
            <td>${req.exam}</td>
            <td>${req.requested_date}</td>
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
        const role = localStorage.getItem("role");
        const hodId = localStorage.getItem("hodId");
        const sessionValue = localStorage.getItem("key");
        const response = await fetch(`/updateStatus/${role}/${hodId}/${faculty}/${subject}/${exam}/${status}`, { method: "POST",
                 headers: {
                "x-session-key": sessionValue
            }
         });

        if (!response.ok) {
            throw new Error("Failed to update request status.");
        }

        showMessage(`Request ${status} successfully!`,"success");
        loadRequests(); // Refresh table after updating
    } catch (error) {
        //console.error("Error updating status:", error);
        showMessage("Error updating status. Please try again.","error");
    }
}

async function toggleStudentTable(button, faculty, subject, exam) {
    // Remove any existing expanded student table
    let existingTable = document.querySelector(".student-table");
    if (existingTable) existingTable.remove();

    try {
        const role = localStorage.getItem("role");
        const hodId = localStorage.getItem("hodId");
        const sessionValue = localStorage.getItem("key");
        const response = await fetch(`/getUpdate/${role}/${hodId}/${faculty}/${subject}/${exam}`,
            {
                 headers: {
                "x-session-key": sessionValue
            }
            }
        );
        if (!response.ok) throw new Error("Failed to fetch data");

        const students = await response.json();

        // Filter only students whose marks have changed
        const changedStudents = students.filter(s => s.old_marks !== s.new_marks);

        if (changedStudents.length === 0) {
            showMessage("No students have updated marks for this request.", "info");
            return;
        }

        // Build the filtered table
        let table = document.createElement("table");
        table.classList.add("student-table");
      table.innerHTML = `
        <tr>
            <th>HTNO</th>
            <th>Name</th>
            <th>Old Marks</th>
            <th>New Marks</th>
            <th>Reason</th>
        </tr>
    `;


        changedStudents.forEach(student => {
            let row = `
               <tr>
                    <td>${student.htno}</td>
                    <td>${student.name}</td>
                    <td>${student.old_marks}</td>
                    <td>${student.new_marks}</td>
                    <td>${student.reason}</td>
                </tr>
            `;
            table.innerHTML += row;
        });

        // Insert the new table below the clicked row
       const wrapper = document.createElement("tr");
        wrapper.innerHTML = `
            <td colspan="7">
                <div class="student-table-wrapper"></div>
            </td>
        `;

        wrapper.querySelector(".student-table-wrapper").appendChild(table);
        button.closest("tr").after(wrapper);
    } catch (error) {
        //console.error("Error fetching update details:", error);
        showMessage("Error fetching details. Please try again.", "error");
    }
}

// Logout functionality
const logoutBtn = document.getElementById("logoutBtn");
    // logout
    if (logoutBtn) {
    logoutBtn.addEventListener("click", async function () {

        const role = localStorage.getItem("role");
        const userId = localStorage.getItem("hodId");
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