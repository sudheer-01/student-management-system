document.addEventListener("DOMContentLoaded", async () => {
    const subjectContainer = document.getElementById("subjectContainer");
    const addSubjectButton = document.getElementById("addSubject");

    // Fetch and display all requests
    async function fetchRequests() {
        try {
            const response = await fetch("/getRequests");
            const requests = await response.json();
            displayRequests(requests);
        } catch (error) {
            console.error("Error fetching requests:", error);
        }
    }

    // Display requests
    function displayRequests(requests) {
        subjectContainer.innerHTML = ""; // Clear previous

        requests.forEach(request => {
            const div = document.createElement("div");
            div.classList.add("request-item");

            div.innerHTML = `
                <p><strong>Subject:</strong> ${request.subject}</p>
                <p><strong>Branch:</strong> ${request.branch}</p>
                <p><strong>Year:</strong> ${request.year}</p>
                <p><strong>Status:</strong> ${request.status}</p>
            `;

            // Add Continue button for approved requests
            if (request.status === "Approved") {
                const continueBtn = document.createElement("button");
                continueBtn.textContent = "Continue";
                continueBtn.classList.add("continue-btn");

                continueBtn.addEventListener("click", () => {
                    // Redirect to home page or dashboard
                    window.location.href = "/dashboardOfFaculty"; 
                });

                div.appendChild(continueBtn);
            }

            subjectContainer.appendChild(div);
        });
    }

    // Create new request field
    function createSubjectField() {
        const div = document.createElement("div");
        div.classList.add("subject-row");

        const yearSelect = document.createElement("select");
        yearSelect.innerHTML = `
            <option value="">Choose Year</option>
            <option value="1">1st Year</option>
            <option value="2">2nd Year</option>
            <option value="3">3rd Year</option>
            <option value="4">4th Year</option>
        `;

        const branchInput = document.createElement("input");
        branchInput.type = "text";
        branchInput.placeholder = "Branch";

        const subjectInput = document.createElement("input");
        subjectInput.type = "text";
        subjectInput.placeholder = "Subject";

        const sendBtn = document.createElement("button");
        sendBtn.textContent = "Send Request";

        sendBtn.addEventListener("click", async () => {
            const year = yearSelect.value;
            const branch = branchInput.value;
            const subject = subjectInput.value;

            if (!year || !branch || !subject) {
                alert("Please fill all fields");
                return;
            }

            try {
                const response = await fetch("/sendRequest", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ year, branch, subject })
                });

                const result = await response.json();
                if (result.success) {
                    alert("Request sent successfully!");
                    fetchRequests(); // Refresh the list
                } else {
                    alert(result.message || "Error sending request");
                }
            } catch (err) {
                console.error(err);
                alert("Server error. Try again later.");
            }
        });

        div.append(yearSelect, branchInput, subjectInput, sendBtn);
        subjectContainer.appendChild(div);
    }

    addSubjectButton.addEventListener("click", createSubjectField);

    // Initial fetch of requests
    fetchRequests();
});
