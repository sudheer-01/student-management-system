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

    if (!exam || !examMaxMarks[exam]) {
        document.getElementById("examHeading").textContent = "Marks";
        return;
    }

    document.getElementById("examHeading").textContent =
        `${exam} Marks (Max: ${examMaxMarks[exam]})`;
});


let table = document.getElementById('studentsInformationTable');
let tbody = table.tBodies[0];
document.getElementById("getStudentMarks").addEventListener("click", fetchStudentData);
async function fetchStudentData() {
    let selectedExam = document.getElementById("exam").value;
    if (!selectedExam) {
        showMessage("Please select an exam.", "error");
        return;
    }

    const selectedYear = localStorage.getItem("selectedYear");
    const selectedBranch = localStorage.getItem("selectedBranch");
    const selectedSubject = localStorage.getItem("selectedSubject");
    const role = localStorage.getItem("role");
    const facultyId = localStorage.getItem("facultyId");
    const sessionValue = localStorage.getItem("key");  

    /* Fetch max marks map */
    const maxRes = await fetch(
        `/getExamMaxMarksAll/${role}/${facultyId}/${selectedYear}/${selectedBranch}`, 
        { headers: { "x-session-key": sessionValue } }
    );
    examMaxMarks = await maxRes.json();

    document.getElementById("examHeading").textContent =
        `${selectedExam} Marks (Max: ${examMaxMarks[selectedExam]})`;

    const response = await fetch(
        `/getStudentMarks/${role}/${facultyId}?exam=${selectedExam}&year=${selectedYear}&branch=${selectedBranch}&subject=${selectedSubject}`,
        { headers: { "x-session-key": sessionValue } }
    );

    const data = await response.json();

    tbody.innerHTML = "";

    data.forEach((student, index) => {
        let row = document.createElement("tr");
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${student.htno}</td>
            <td>${student.name}</td>
            <td>${student[selectedExam] ?? 'N/A'}</td>
        `;
        tbody.appendChild(row);
    });
}

document.addEventListener("DOMContentLoaded", async function() {
    try {
        const selectedYear = localStorage.getItem("selectedYear");
        const selectedBranch = localStorage.getItem("selectedBranch");
        const role = localStorage.getItem("role");
        const facultyId = localStorage.getItem("facultyId");
        const sessionValue = localStorage.getItem("key");
        const response = await fetch(`/getExams/${role}/${facultyId}?year=${selectedYear}&branch=${selectedBranch}`,
            { headers: { "x-session-key": sessionValue } }
        );
        const exams = await response.json();
        
        const examDropdown = document.getElementById("exam");
        examDropdown.innerHTML = '<option value="">Select Exam</option>'; 

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

        const role = localStorage.getItem("role");
        const userId = localStorage.getItem("facultyId");
        const sessionValue =  localStorage.getItem("key");

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
