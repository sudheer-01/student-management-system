// Load available years dynamically
async function loadYears() {
    const storedYears = localStorage.getItem("hodYears");

    if (!storedYears) {
        console.warn("No HOD years found in localStorage");
        return;
    }

    let parsedYears;
    try {
        // Try parsing as JSON first (["2","3","4"])
        parsedYears = JSON.parse(storedYears);
    } catch (e) {
        // If not JSON, fallback to comma-split ("2,3,4")
        parsedYears = storedYears.split(",");
    }
    // Convert to array of objects { year: "X" }
    const years = parsedYears.map(year => ({ year: year.trim() }));

    console.log("HOD Years from localStorage:", years);

    // Populate dropdown
    const yearDropdown = document.getElementById("yearDropdown");
    yearDropdown.innerHTML = '<option value="">Select Year</option>';

    years.forEach(({ year }) => {
        const option = document.createElement("option");
        option.value = year;
        console.log(option.value);
        option.textContent = `${year} Year`;
        yearDropdown.appendChild(option);
    });
}


// Load branches dynamically based on selected year and HOD's branch
document.getElementById("yearDropdown").addEventListener("change", async function () {
    const year = this.value;
    console.log("Selected year:", year); // Debugging log

    if (!year) {
        document.getElementById("branchDropdown").innerHTML = '<option value="">Select Branch</option>';
        return;
    }

    try {
        const branch = localStorage.getItem("hodBranch");
        console.log("HOD Branch from localStorage:", branch); // Debugging log
        const response = await fetch(`/getBranches/${year}/${branch}`);
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
        console.error("Error loading branches:", error);
        alert("Server error. Try again later.");
    }
});

// Load faculty requests when clicking the button
document.getElementById("loadRequests").addEventListener("click", async function () {
    const year = document.getElementById("yearDropdown").value;
    const branch = document.getElementById("branchDropdown").value;

    if (!year || !branch) {
        alert("Please select both year and branch.");
        return;
    }

    try {
        const response = await fetch(`/hodRequests/${year}/${branch}`);
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
                <td id="status-${request.faculty_Id}-${request.year}-${request.branch}-${request.subject}">${request.status}</td>
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
        console.error("Error loading requests:", error);
        alert("Server error. Try again later.");
    }
});
// Function to update request status
async function updateStatus(facultyId, year, branch, subject, status) {
    console.log("Sending request with:", facultyId, year, branch, subject, status); // Debugging log

    try {
        const response = await fetch(`/updateRequestStatus`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ facultyId, status, year, branch, subject })
        });
        const result = await response.json();
        console.log("Server response:", result); // Debugging log

        if (response.ok) {
            document.querySelector(`#status-${facultyId}-${year}-${branch}-${subject}`).textContent = status;
            alert(`Request ${status} successfully!`);
        } else {
            alert(result.error || "Failed to update request status.");
        }
    } catch (error) {
        console.error("Error updating status:", error);
        alert("Server error. Try again later.");
    }
}

// Load years when page loads
window.onload = loadYears;
