let examMaxMarks = {};

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


document.getElementById("exam").addEventListener("change", function () {
    const exam = this.value;

    // Update heading only if exam exists
    if (exam && examMaxMarks[exam]) {
        document.getElementById("examHeading").textContent =
            `${exam} Marks (Max: ${examMaxMarks[exam]})`;
    } else {
        document.getElementById("examHeading").textContent = "Marks";
    }
    const tbody = document.querySelector("#studentsInformationTable tbody");
    tbody.innerHTML = "";

});



document.getElementById("getDetailsToEnterMarks").addEventListener("click", getStudentDetailsToEnterMarks);

async function getStudentDetailsToEnterMarks() {
    const exam = document.getElementById("exam").value;
    if (!exam) {
        showMessage("Please select an exam.", "error");
        return;
    }
    try {
        const selectedYear = localStorage.getItem("selectedYear");
        const selectedBranch = localStorage.getItem("selectedBranch");
        const response = await fetch(`/getStudents?year=${selectedYear}&branch=${selectedBranch}`);
        const students = await response.json();
        
        if (students.length === 0) {
            showMessage("No student records found!", "error");
            return;
        }

        const tbody = document.querySelector("#studentsInformationTable tbody");
        tbody.innerHTML = ""; 

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
        showMessage("Failed to fetch student details.", "error");
    }
}

document.getElementById("studentsForm").addEventListener("submit", async function(event) {
    event.preventDefault();
    const invalid = document.querySelector("input:invalid");
    if (invalid) {
        showMessage("Please correct invalid marks before saving.", "error");
        invalid.focus();
        return;
    }
    const exam = document.getElementById("exam").value;
    if (!exam) {
        showMessage("Please select an exam.", "error");
        return;
    }

    const formData = {};
    document.querySelectorAll("input[name^='marks_']").forEach(input => {
        formData[input.name] = input.value;
    });

    formData["exam"] = exam; // Add exam field

    try {
        const selectedSubject = localStorage.getItem("selectedSubject");
        const response = await fetch("/saveMarks", {
            method: "POST",
            headers: { "Content-Type": "application/json" }, 
              body: JSON.stringify({
                ...formData,             
                subject: selectedSubject 
            }),
        });

        const result = await response.json();

        if (result.success) {
            showMessage("Marks saved successfully!", "success");
        } else {
            showMessage("Failed to save marks.", "error");
        }
    } catch (error) {
        showMessage("Error occurred while saving marks.", "error");
    }
});

document.addEventListener("DOMContentLoaded", async function() {
    try {
        const selectedYear = localStorage.getItem("selectedYear");
        const selectedBranch = localStorage.getItem("selectedBranch");
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
        showMessage("Failed to load exams.", "error");
    }

    const logoutBtn = document.getElementById("logoutBtn");
    // logout
    if (logoutBtn) {
    logoutBtn.addEventListener("click", async function () {
        if (!confirm("Log out of the faculty panel?")) return;

        const role = localStorage.getItem("role");
        const userId = localStorage.getItem("facultyId");

        try {
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
        localStorage.clear();

        window.location.href = "/";
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
