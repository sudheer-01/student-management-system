document.getElementById("exam").addEventListener("change", function() {
    let selectedExam = this.value;  // Get the selected exam
    document.getElementById("examHeading").textContent = selectedExam + " Marks";  // Update heading
});

let table = document.getElementById('studentsInformationTable');
// console.log(table.tBodies[0]);  // Correct way to access tbody
let tbody = table.tBodies[0];
document.getElementById("getStudentMarks").addEventListener("click", fetchStudentData);
function fetchStudentData() {
    let selectedExam = document.getElementById("exam").value;
    if (!selectedExam) {
        alert("Please select an exam.");
        return;
    }

    fetch(`http://localhost:9812/getStudentMarks?exam=${selectedExam}`)  // Pass exam as query param
        .then(response => response.json())
        .then(data => {
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
        const response = await fetch("/getExams");
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
});
