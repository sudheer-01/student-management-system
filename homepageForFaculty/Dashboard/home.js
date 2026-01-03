document.addEventListener("DOMContentLoaded", async () => {
    try {
        // Retrieve from localStorage
        const selectedYear = localStorage.getItem("selectedYear");
        const selectedBranch = localStorage.getItem("selectedBranch");
        const selectedSubject = localStorage.getItem("selectedSubject");
        const facultyId = localStorage.getItem("facultyId");
        console.log("Retrieved from localStorage:", { selectedYear, selectedBranch, selectedSubject, facultyId });
        
        // If essential data is missing, redirect to the request page or login
        if (!selectedYear || !selectedBranch || !selectedSubject || !facultyId) {
            alert("No approved subject selected. Redirecting...");
            window.location.href = "/homepageForFaculty/requestForSubject/requestForSubject.html";
            return;
        }

        // Prepare request data
        const requestData = {
            year: selectedYear,
            branch: selectedBranch,
            subject: selectedSubject,
            facultyId: facultyId
        };

        const response = await fetch("/getFacultyDetails", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(requestData)
        });

        const data = await response.json();
        if (data.success) {
            document.getElementById("teacherName").textContent = `Welcome back, ${data.facultyName}!`;
            document.getElementById("subject").textContent = `Subject: ${data.subject}`;
            document.getElementById("breanch").textContent = `Branch: ${data.branch} | Year: ${data.year}`;
        } else {
            alert("Failed to load faculty details. " + data.message);
        }
    } catch (error) {
        console.error("Error fetching faculty details:", error);
        alert("Server error in home.js. Try again later.");
    }

    const logoutBtn = document.getElementById("logoutBtn");
    // logout
    if (logoutBtn) {
    logoutBtn.addEventListener("click", async function () {
        if (!confirm("Log out of the faculty panel?")) return;

        // 🔹 Get values FIRST (before clearing)
        const role = localStorage.getItem("role");
        const userId = localStorage.getItem("facultyId");

        try {
            // 🔹 Call backend logout API with required info
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

        // 🔹 NOW clear localStorage (AFTER backend logout)
        localStorage.clear();

        // 🔹 Redirect to login
        window.location.href = "/";
    });
}

});