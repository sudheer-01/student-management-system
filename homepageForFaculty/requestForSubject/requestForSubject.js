function showMessage(message, type = "info", autoHide = true) {
    const msgEl = document.getElementById("uiMessage");
    if (!msgEl) return;

    msgEl.textContent = message;
    msgEl.className = `ui-message ${type}`;
    msgEl.classList.remove("hidden");

    if (autoHide) {
        setTimeout(() => {
            msgEl.classList.add("hidden");
        }, 4000); 
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    const subjectContainer = document.getElementById("subjectContainer");
    const addSubjectButton = document.getElementById("addSubject");
    const approvedSubjectsList = document.getElementById("approved-subjects-list");
    const goToDashboardBtn = document.getElementById("goToDashboardBtn");
    const role = localStorage.getItem("role");
    const sessionValue = localStorage.getItem("key");
  
    let allBranches = [];
    let allSubjects = [];
    const facultyId = localStorage.getItem("facultyId");
    if (!facultyId) {
        // If somehow not logged in, send back to login
        window.location.href = "/";
    }

    // Fetch all branches and subjects initially
    async function fetchAllData() {
        try {
            const branchResponse = await fetch(`/branches/${role}/${facultyId}`,  {
            headers: {
                "x-session-key": sessionValue
            } });
            allBranches = await branchResponse.json();

            const subjectResponse = await fetch(`/subjects/${role}/${facultyId}`, {headers: { "x-session-key" : sessionValue }});
            allSubjects = await subjectResponse.json();
        } catch (error) {
            showMessage("Error fetching data.", "error");
        }
    }

    async function fetchRequests() {
        try {
            const response = await fetch(`/getRequests/${role}?facultyId=${facultyId}`,
                {
            headers: {
                "x-session-key": sessionValue
            } }
            );
            const requests = await response.json();
            displayRequests(requests);
        } catch (error) {
            showMessage("Error fetching requests.", "error");
        }
    }
    function displayRequests(requests) {
        const pendingRequestList = document.createElement("div");
        pendingRequestList.classList.add("request-list");
        approvedSubjectsList.innerHTML = ''; // Clear previous radio buttons

        const approvedRequests = requests.filter(r => r.status === 'Approved');
        const pendingRequests = requests.filter(r => r.status !== 'Approved');

        if (approvedRequests.length > 0) {
            document.getElementById('approved-subjects-container').style.display = 'block';
        } else {
            document.getElementById('approved-subjects-container').style.display = 'none';
        }

        approvedRequests.forEach(request => {
            const label = document.createElement('label');
            label.classList.add('approved-subject-option');
            label.innerHTML = `
                <input type="radio" name="approvedSubject" value='${JSON.stringify(request)}'>
                <span><strong>${request.subject}</strong> (${request.branch} - Year ${request.year})</span>
            `;
            approvedSubjectsList.appendChild(label);
        });

        pendingRequests.forEach(request => {
            const div = document.createElement("div");
            div.classList.add("request-item");
            div.innerHTML = `
                <p><strong>Subject:</strong> ${request.subject}</p>
                <p><strong>Branch:</strong> ${request.branch}</p>
                <p><strong>Year:</strong> ${request.year}</p>
                <p><strong>Status:</strong> ${request.status}</p>
            `;
            pendingRequestList.appendChild(div);
        });

        subjectContainer.appendChild(pendingRequestList);

        // Add event listener for radio buttons
        document.querySelectorAll('input[name="approvedSubject"]').forEach(radio => {
            radio.addEventListener('change', function() {
                const selectedRequest = JSON.parse(this.value);
                localStorage.setItem("selectedYear", selectedRequest.year);
                localStorage.setItem("selectedBranch", selectedRequest.branch);
                localStorage.setItem("selectedSubject", selectedRequest.subject);
                goToDashboardBtn.style.display = 'block';
            });
        });
    }

    goToDashboardBtn.addEventListener('click', () => {
        window.location.href = '/home';
    });

    // Fetch branches for a specific year
    async function fetchBranches(year) {
        try {
            const response = await fetch(`/branches/${year}/${role}/${facultyId}`, 
                 {
            headers: {
                "x-session-key": sessionValue
            } }
            );
            return await response.json();
        } catch (error) {
            showMessage("Error fetching branches.", "error");
            //console.error("Error fetching branches:", error);
            return [];
        }
    }

    // Fetch subjects for a specific year and branch
    async function fetchSubjects(year, branch) {
        try {
            const response = await fetch(`/subjects/${year}/${branch}/${role}/${facultyId}`, 
                 {
            headers: {
                "x-session-key": sessionValue
            } }
            );
            return await response.json();
        } catch (error) {
            showMessage("Error fetching subjects.", "error");
            //console.error("Error fetching subjects:", error);
            return [];
        }
    }

    function createSubjectField() {
        const div = document.createElement("div");
        div.classList.add("subject-row");

        const yearSelect = document.createElement("select");
        yearSelect.classList.add("year");
        yearSelect.innerHTML = `
            <option value="">Choose Year</option>
            <option value="1">1st Year</option>
            <option value="2">2nd Year</option>
            <option value="3">3rd Year</option>
            <option value="4">4th Year</option>
        `;

        const branchSelect = document.createElement("select");
        branchSelect.classList.add("branch");
        branchSelect.innerHTML = `<option value="">Choose Branch</option>`;
        allBranches.forEach(branch => {
            branchSelect.innerHTML += `<option value="${branch.branch_name}">${branch.branch_name}</option>`;
        });

        const subjectSelect = document.createElement("select");
        subjectSelect.classList.add("subject");
        subjectSelect.innerHTML = `<option value="">Choose Subject</option>`;
        allSubjects.forEach(subject => {
            subjectSelect.innerHTML += `<option value="${subject.subject_name}">${subject.subject_name}</option>`;
        });

        const removeButton = document.createElement("button");
        removeButton.textContent = "Remove";
        removeButton.classList.add("remove-btn");
        removeButton.addEventListener("click", () => div.remove());

        const requestButton = document.createElement("button");
        requestButton.textContent = "Send Request To Hod";
        requestButton.classList.add("request-btn");
        requestButton.addEventListener("click", function () {
            this.textContent = "Pending...";
            this.style.background = "gray";
            this.disabled = true;
        });

        yearSelect.addEventListener("change", async () => {
            const selectedYear = yearSelect.value;
            const branches = selectedYear ? await fetchBranches(selectedYear) : allBranches;

            branchSelect.innerHTML = `<option value="">Choose Branch</option>`;
            branches.forEach(branch => {
                branchSelect.innerHTML += `<option value="${branch.branch_name}">${branch.branch_name}</option>`;
            });

            subjectSelect.innerHTML = `<option value="">Choose Subject</option>`;
            allSubjects.forEach(subject => {
                subjectSelect.innerHTML += `<option value="${subject.subject_name}">${subject.subject_name}</option>`;
            });
        });

        branchSelect.addEventListener("change", async () => {
            const selectedYear = yearSelect.value;
            const selectedBranch = branchSelect.value;
            const subjects = selectedYear && selectedBranch ? await fetchSubjects(selectedYear, selectedBranch) : allSubjects;

            subjectSelect.innerHTML = `<option value="">Choose Subject</option>`;
            subjects.forEach(subject => {
                subjectSelect.innerHTML += `<option value="${subject.subject_name}">${subject.subject_name}</option>`;
            });
        });

        div.append(yearSelect, branchSelect, subjectSelect, removeButton, requestButton);
        subjectContainer.appendChild(div);


        requestButton.addEventListener("click", async function () {
            const selectedYear = yearSelect.value;
            const selectedBranch = branchSelect.value;
            const selectedSubject = subjectSelect.value;
        
            if (!selectedYear || !selectedBranch || !selectedSubject) {
                showMessage("Please select Year, Branch, and Subject before sending request.", "error");
                return;
            }
        
            const requestData = {
                year: selectedYear,
                branch: selectedBranch,
                subject: selectedSubject,
                facultyId: facultyId
            };
            
        
            try {
                const response = await fetch(`/sendRequest/${role}`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                         "x-session-key": sessionValue
                    },
                    body: JSON.stringify(requestData)
                });
        
                const result = await response.json();
                if (response.ok) {
                    showMessage("Request sent successfully!", "success");
                    this.textContent = "Pending...";
                    this.style.background = "gray";
                    this.disabled = true;
                } else {
                    showMessage("Error sending request.", "error");
                }
            } catch (error) {
                showMessage("Server error. Try again later.", "error");
            }
        });
    }
    addSubjectButton.addEventListener("click", createSubjectField);
    
    await fetchAllData();  
    await fetchRequests();  
});
               
/* ===============================
   LOGOUT HANDLER
================================ */
const logoutBtn = document.getElementById("logoutBtn");
    // logout
    if (logoutBtn) {
    logoutBtn.addEventListener("click", async function () {

        const role = localStorage.getItem("role");
        const userId = localStorage.getItem("facultyId");
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
