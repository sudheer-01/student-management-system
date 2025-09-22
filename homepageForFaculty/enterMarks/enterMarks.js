document.getElementById("exam").addEventListener("change", function() {
    let selectedExam = this.value;  // Get the selected exam
    document.getElementById("examHeading").textContent = selectedExam + " Marks";  // Update heading
});

document.getElementById("getDetailsToEnterMarks").addEventListener("click", getStudentDetailsToEnterMarks);

async function getStudentDetailsToEnterMarks() {
    const exam = document.getElementById("exam").value;
    if (!exam) {
        alert("Please select an exam.");
        return;
    }
    try {
        const selectedYear = localStorage.getItem("selectedYear");
        const selectedBranch = localStorage.getItem("selectedBranch");
        const response = await fetch(`/getStudents?year=${selectedYear}&branch=${selectedBranch}`);
        const students = await response.json();
        
        if (students.length === 0) {
            alert("No student records found!");
            return;
        }

        const tbody = document.querySelector("#studentsInformationTable tbody");
        tbody.innerHTML = ""; // Clear previous data

        students.forEach((student, index) => {
            const row = document.createElement("tr");

            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${student.htno}</td>
                <td>${student.name}</td>
                <td><input type="number" name="marks_${student.htno}" min="0" max="100" required></td>
            `;

            tbody.appendChild(row);
        });

    } catch (error) {
        console.error("Error fetching student details:", error);
        alert("Failed to fetch student details.");
    }
}

document.getElementById("studentsForm").addEventListener("submit", async function(event) {
    event.preventDefault();

    const exam = document.getElementById("exam").value;
    if (!exam) {
        alert("Please select an exam.");
        return;
    }

    const formData = {};
    document.querySelectorAll("input[name^='marks_']").forEach(input => {
        formData[input.name] = input.value;
    });

    formData["exam"] = exam; // Add exam field

    console.log("Submitting marks data:", formData); // Debug log

    try {
        const response = await fetch("/saveMarks", {
            method: "POST",
            headers: { "Content-Type": "application/json" }, // Ensure JSON format
            body: JSON.stringify(formData),
        });

        const result = await response.json();
        console.log("Server response:", result);

        if (result.success) {
            alert("Marks saved successfully!");
        } else {
            alert("Failed to save marks.");
        }
    } catch (error) {
        console.error("Error saving marks:", error);
        alert("Error occurred while saving marks.");
    }
});

document.addEventListener("DOMContentLoaded", async function() {
    try {
        const selectedYear = localStorage.getItem("selectedYear");
        const selectedBranch = localStorage.getItem("selectedBranch");
        // const response = await fetch("/getExams");
        const response = await fetch(`/getExams?year=${selectedYear}&branch=${selectedBranch}`);
        const exams = await response.json();
        
        const examDropdown = document.getElementById("exam");
        examDropdown.innerHTML = '<option value="">Select Exam</option>'; // Reset options

        exams.forEach(exam => {
            let option = document.createElement("option");
            option.value = exam;
            option.textContent = exam;
            examDropdown.appendChild(option);
        });

    } catch (error) {
        console.error("Error fetching exams:", error);
        alert("Failed to load exams.");
    }
    const logoutBtn = document.getElementById("logoutBtn");
    // logout
    if (logoutBtn) {
        logoutBtn.addEventListener("click", function () {
            if (!confirm("Log out of the faculty panel?")) return;
            // Clear session-related storage
            localStorage.removeItem("selectedYear");
            localStorage.removeItem("selectedBranch");
            localStorage.removeItem("selectedSubject");
            localStorage.removeItem("facultyId");

            fetch("/logout", { method: "POST" })
                .then(() => { window.location.href = "/"; })
                .catch(() => { window.location.href = "/"; });
        });
    }
});
