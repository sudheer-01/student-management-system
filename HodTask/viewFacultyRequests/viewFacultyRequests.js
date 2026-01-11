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

// Load available years dynamically
async function loadYears() {
    const storedYears = localStorage.getItem("hodYears");

    if (!storedYears) {
        showMessage("No HOD years found.", "error");
        return;
    }

    let parsedYears;
    try {
        parsedYears = JSON.parse(storedYears);
    } catch (e) {
        parsedYears = storedYears.split(",");
    }
    const years = parsedYears.map(year => ({ year: year.trim() }));


    // Populate dropdown
    const yearDropdown = document.getElementById("yearDropdown");
    yearDropdown.innerHTML = '<option value="">Select Year</option>';

    years.forEach(({ year }) => {
        const option = document.createElement("option");
        option.value = year;
        option.textContent = `${year} Year`;
        yearDropdown.appendChild(option);
    });
}


// Load branches dynamically based on selected year and HOD's branch
document.getElementById("yearDropdown").addEventListener("change", async function () {
    const year = this.value;

    if (!year) {
        document.getElementById("branchDropdown").innerHTML = '<option value="">Select Branch</option>';
        return;
    }

    try {
        const branch = localStorage.getItem("hodBranch");
        const role = localStorage.getItem("role");
        const hodId = localStorage.getItem("hodId");
        const sessionValue = localStorage.getItem("key");
        const response = await fetch(`/getbranches/${role}/${hodId}/${year}/${branch}`,
            {
                 headers: {
                "x-session-key": sessionValue
                }
            }
        );
        const branches = await response.json();
        const branchDropdown = document.getElementById("branchDropdown");
        branchDropdown.innerHTML = '<option value="">Select Branch</option>';

        branches.forEach(({ branch_name }) => {
            const option = document.createElement("option");
            option.value = branch_name;
            option.textContent = branch_name;
            branchDropdown.appendChild(option);
        });

    } catch (error) {
        showMessage("Server error. Try again later.", "error");
    }
});
// Load faculty requests when clicking the button
document.getElementById("loadRequests").addEventListener("click", async function () {
    const year = document.getElementById("yearDropdown").value;
    const branch = document.getElementById("branchDropdown").value;

    if (!year || !branch) {
        showMessage("Please select both year and branch.", "error");
        return;
    }

    try {
        const role = localStorage.getItem("role");
        const hodId = localStorage.getItem("hodId");
        const sessionValue = localStorage.getItem("key");
        const response = await fetch(`/hodRequests/${role}/${hodId}/${year}/${branch}`,
             {
                 headers: {
                "x-session-key": sessionValue
            }
            }
        );
        const requests = await response.json();

        const tableBody = document.getElementById("requestTable");
        tableBody.innerHTML = "";

        if (requests.length === 0) {
            const noRequestsMessage = document.createElement("div");
            noRequestsMessage.className = "no-requests";
            noRequestsMessage.textContent = "There are no requests for the selected year and branch.";
            tableBody.appendChild(noRequestsMessage);
            return;
        }

        requests.forEach(request => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${request.faculty_Id}</td>
                <td>${request.facultyName}</td>
                <td>${request.year}</td>
                <td>${request.subject}</td>
                <td class="status-cell"
                    data-id="${request.faculty_Id}"
                    data-year="${request.year}"
                    data-branch="${request.branch}"
                    data-subject="${request.subject}">
                    ${request.status}
                </td>
                <td>
                    <button class="approve-btn" 
                        data-id="${request.faculty_Id}" 
                        data-year="${request.year}" 
                        data-branch="${request.branch}" 
                        data-subject="${request.subject}">
                        Approve
                    </button>
                    <button class="reject-btn" 
                        data-id="${request.faculty_Id}" 
                        data-year="${request.year}" 
                        data-branch="${request.branch}" 
                        data-subject="${request.subject}">
                        Reject
                    </button>
                </td>
            `;
        
            tableBody.appendChild(row);
        });
        
        // Attach event listeners to the buttons
        document.querySelectorAll(".approve-btn").forEach(button => {
            button.addEventListener("click", () => {
                const facultyId = button.dataset.id;
                const year = button.dataset.year;
                const branch = button.dataset.branch;
                const subject = button.dataset.subject;
                updateStatus(facultyId, year, branch, subject, "Approved");
            });
        });
        
        document.querySelectorAll(".reject-btn").forEach(button => {
            button.addEventListener("click", () => {
                const facultyId = button.dataset.id;
                const year = button.dataset.year;
                const branch = button.dataset.branch;
                const subject = button.dataset.subject;
                updateStatus(facultyId, year, branch, subject, "Rejected");
            });
        });

    } catch (error) {
        showMessage("Server error. Try again later.", "error");
    }
});
// Function to update request status
async function updateStatus(facultyId, year, branch, subject, status) {

    try {
        const role = localStorage.getItem("role");
        const hodId = localStorage.getItem("hodId");
        const sessionValue = localStorage.getItem("key");
        const response = await fetch(`/updateRequestStatus/${role}/${hodId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-session-key": sessionValue },
            body: JSON.stringify({ facultyId, status, year, branch, subject })
        });
        const result = await response.json();

        if (response.ok) {
            const statusCell = document.querySelector(
            `.status-cell[data-id="${facultyId}"][data-year="${year}"][data-branch="${branch}"][data-subject="${subject}"]`
            );
            // if (!statusCell) {
            //     console.error("Status cell not found", { facultyId, year, branch, subject });
            //     return;
            // }
            statusCell.textContent = status;
            showMessage(`Request ${status} successfully!`, "success");
        } else {
            showMessage(result.error || "Failed to update request status.", "error");
        }
    } catch (error) {
        // console.error("Error updating status:", error);
        showMessage("Server error. Try again later.", "error");
    }
}

// Load years when page loads
window.onload = loadYears;

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