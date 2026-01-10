document.addEventListener("DOMContentLoaded", async () => {
    try {
        // Retrieve from localStorage
        const selectedYear = localStorage.getItem("selectedYear");
        const selectedBranch = localStorage.getItem("selectedBranch");
        const selectedSubject = localStorage.getItem("selectedSubject");
        const facultyId = localStorage.getItem("facultyId");

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
        
        if (!selectedYear || !selectedBranch || !selectedSubject || !facultyId) {
            showMessage("No approved subject selected. Redirecting...", "error");
            window.location.href = "/";
            return;
        }
        // Prepare request data
        const requestData = {
            year: selectedYear,
            branch: selectedBranch,
            subject: selectedSubject,
            facultyId: facultyId
        };
        const role = localStorage.getItem("role");
        const sessionValue = localStorage.getItem("key");
        const response = await fetch(`/getFacultyDetails/${role}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-session-key": sessionValue
            },
            body: JSON.stringify(requestData)
        });

        const data = await response.json();
        if (data.success) {
            document.getElementById("teacherName").textContent = `Welcome back, ${data.facultyName}!`;
            document.getElementById("subject").textContent = `Subject: ${data.subject}`;
            document.getElementById("breanch").textContent = `Branch: ${data.branch} | Year: ${data.year}`;
        } else {
            showMessage("Failed to load faculty details" + data.message, "error");
        }
    } catch (error) {
        showMessage("Server error in faculty home page. Try again later.", "error");
        window.location.href = "/";
            return;
    }

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

});