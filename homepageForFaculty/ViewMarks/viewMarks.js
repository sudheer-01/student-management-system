let examMaxMarks = {};

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
// console.log(table.tBodies[0]);  // Correct way to access tbody
let tbody = table.tBodies[0];
document.getElementById("getStudentMarks").addEventListener("click", fetchStudentData);
async function fetchStudentData() {
    let selectedExam = document.getElementById("exam").value;
    if (!selectedExam) {
        alert("Please select an exam.");
        return;
    }
    const selectedYear = localStorage.getItem("selectedYear");
    const selectedBranch = localStorage.getItem("selectedBranch");

    /* 🔹 Fetch max marks map */
    const maxRes = await fetch(
    `/getExamMaxMarksAll/${selectedYear}/${selectedBranch}`
    );
    examMaxMarks = await maxRes.json();

    const selectedSubject = localStorage.getItem("selectedSubject");
    fetch(`/getStudentMarks?exam=${selectedExam}&year=${selectedYear}&branch=${selectedBranch}&subject=${selectedSubject}`).then(response => response.json()).then(data => {
            tbody.innerHTML = ""; // Clear existing rows
            data.forEach((student, index) => {
                let row = document.createElement("tr");
                row.innerHTML = `
                    <td>${index + 1}</td>
                    <td>${student.htno}</td>
                    <td>${student.name}</td>
                    <td>${student[selectedExam] || 'N/A'}</td> 
                `;
                tbody.appendChild(row);
            });
        })
        .catch(error => console.error("Error fetching data:", error));
}

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
