document.addEventListener("DOMContentLoaded", async () => {
    const subjectContainer = document.getElementById("subjectContainer");
    const addSubjectButton = document.getElementById("addSubject");

    let allBranches = [];
    let allSubjects = [];



    // Fetch all branches and subjects initially
    async function fetchAllData() {
        try {
            const branchResponse = await fetch("/branches");
            allBranches = await branchResponse.json();

            const subjectResponse = await fetch("/subjects");
            allSubjects = await subjectResponse.json();
        } catch (error) {
            console.error("Error fetching initial data:", error);
        }
    }

    async function fetchRequests() {
        try {
            const response = await fetch("/getRequests");
            const requests = await response.json();
            displayRequests(requests);
        } catch (error) {
            console.error("Error fetching requests:", error);
        }
    }
    function displayRequests(requests) {
        const requestList = document.createElement("div");
        requestList.classList.add("request-list");

        requests.forEach(request => {
            const div = document.createElement("div");
            div.classList.add("request-item");

            div.innerHTML = `
                <p><strong>Subject:</strong> ${request.subject}</p>
                <p><strong>Branch:</strong> ${request.branch}</p>
                <p><strong>Year:</strong> ${request.year}</p>
                <p><strong>Status:</strong> ${request.status}</p>
            `;

            if (request.status === "Approved") {
                const continueButton = document.createElement("button");
                continueButton.textContent = "Continue";
                continueButton.classList.add("continue-btn");

                // continueButton.addEventListener("click", async () => {
                //     const requestData = {
                //         subject: request.subject,
                //         branch: request.branch,
                //         year: request.year
                //     };
                
                //     console.log("Sending Request:", requestData);
                
                //     try {
                //         const response = await fetch("/dashboardOfFaculty", {
                //             method: "POST",
                //             headers: {
                //                 "Content-Type": "application/json"
                //             },
                //             body: JSON.stringify(requestData)
                //         });
                
                //         const data = await response.json();
                //         console.log("Response:", data);
                
                //         if (data.success) {
                //             window.location.href = data.redirectUrl; // Redirects to "/home"
                //         } else {
                //             alert(data.message || "Navigation failed");
                //         }
                //     } catch (error) {
                //         console.error("Fetch error:", error);
                //         alert("Server error. Try again later.");
                //     }
                // });
               continueButton.addEventListener("click", async () => {
    const requestData = {
        subject: request.subject,
        branch: request.branch,
        year: request.year
    };

    console.log("Sending Request:", requestData);

    try {
        const response = await fetch("/dashboardOfFaculty", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(requestData)
        });

        if (response.ok) {
            const html = await response.text();
            document.open();
            document.write(html);
            document.close();
        } else {
            const errorText = await response.text();
            console.error("Server returned:", errorText);
            alert("Error: " + errorText);
        }
    } catch (error) {
        console.error("Fetch error:", error);
        alert("Network or server error. Check console.");
    }
});

                div.appendChild(continueButton);
            }

            requestList.appendChild(div);
        });

        subjectContainer.appendChild(requestList);
    }




    // Fetch branches for a specific year
    async function fetchBranches(year) {
        try {
            const response = await fetch(`/branches/${year}`);
            return await response.json();
        } catch (error) {
            console.error("Error fetching branches:", error);
            return [];
        }
    }

    // Fetch subjects for a specific year and branch
    async function fetchSubjects(year, branch) {
        try {
            const response = await fetch(`/subjects/${year}/${branch}`);
            return await response.json();
        } catch (error) {
            console.error("Error fetching subjects:", error);
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
                alert("Please select Year, Branch, and Subject before sending request.");
                return;
            }
        
            const requestData = {
                year: selectedYear,
                branch: selectedBranch,
                subject: selectedSubject
            };
        
            try {
                const response = await fetch("/sendRequest", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(requestData)
                });
        
                const result = await response.json();
                if (response.ok) {
                    alert("Request sent successfully!");
                    this.textContent = "Pending...";
                    this.style.background = "gray";
                    this.disabled = true;
                } else {
                    alert("Error sending request.");
                }
            } catch (error) {
                console.error("Error:", error);
                alert("Server error. Try again later.");
            }
        });




    }

    addSubjectButton.addEventListener("click", createSubjectField);
    
    await fetchAllData();  // Load all data when the page loads
    await fetchRequests();  
});



