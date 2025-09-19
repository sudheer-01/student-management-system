document.addEventListener("DOMContentLoaded", async () => {
    try {
        const response = await fetch("/getFacultyDetails");
        const data = await response.json();
        if (data.success) {
            document.getElementById("teacherName").textContent = `Welcome back ${data.facultyName}!`;
            document.getElementById("subject").textContent = `Subject: ${data.subject}`;
            document.getElementById("breanch").textContent = `Branch: ${data.branch} Year: ${data.year}`;
        } else {
            alert("Failed to load faculty details.");
        }
    } catch (error) {
        console.error("Error fetching faculty details:", error);
        alert("Server error. Try again later.");
    }
});