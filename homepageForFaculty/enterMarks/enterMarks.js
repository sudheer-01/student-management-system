let examMaxMarks = {};

document.getElementById("exam").addEventListener("change", function () {
    const exam = this.value;

    // Update heading only if exam exists
    if (exam && examMaxMarks[exam]) {
        document.getElementById("examHeading").textContent =
            `${exam} Marks (Max: ${examMaxMarks[exam]})`;
    } else {
        document.getElementById("examHeading").textContent = "Marks";
    }

    // 🔥 IMPORTANT FIX: clear table when exam changes
    const tbody = document.querySelector("#studentsInformationTable tbody");
    tbody.innerHTML = "";

    // Optional UX message
    // alert("Exam changed. Please click 'Get student details' again.");
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

            const max = examMaxMarks[exam];

            row.innerHTML = `
            <td>${index + 1}</td>
            <td>${student.htno}</td>
            <td>${student.full_name}</td>
            <td>
                <input 
                type="number"
                name="marks_${student.htno}"
                min="0"
                max="${max}"
                data-max="${max}"
                required
                oninput="validateMarks(this)"
                >
                <div class="error-msg" style="color:red;font-size:12px;display:none;">
                Marks must be between 0 and ${max}
                </div>
            </td>
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
    const invalid = document.querySelector("input:invalid");
    if (invalid) {
        alert("Please correct invalid marks before saving.");
        invalid.focus();
        return;
    }
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

    //console.log("Submitting marks data:", formData); // Debug log

    try {
        const selectedSubject = localStorage.getItem("selectedSubject");
        const response = await fetch("/saveMarks", {
            method: "POST",
            headers: { "Content-Type": "application/json" }, // Ensure JSON format
            // body: JSON.stringify(formData),
              body: JSON.stringify({
                ...formData,             // keep your existing formData
                subject: selectedSubject // add subject to it
            }),
        });

        const result = await response.json();
        //console.log("Server response:", result);

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
        const examsRes = await fetch(`/getExams?year=${selectedYear}&branch=${selectedBranch}`);
        const exams = await examsRes.json();

        const maxRes = await fetch(`/getExamMaxMarksAll/${selectedYear}/${selectedBranch}`);
        examMaxMarks = await maxRes.json();

        
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
function validateMarks(input) {
    const value = Number(input.value);
    const max = Number(input.dataset.max);
    const error = input.nextElementSibling;

    if (value < 0 || value > max) {
        input.style.border = "2px solid red";
        error.style.display = "block";
        input.setCustomValidity("Invalid marks");
    } else {
        input.style.border = "1px solid #ccc";
        error.style.display = "none";
        input.setCustomValidity("");
    }
}
