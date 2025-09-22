document.getElementById("exam").addEventListener("change", function() {
    let selectedExam = this.value;
    document.getElementById("examHeading").textContent = selectedExam + " Marks";
});

// Fetch student marks
document.getElementById("getStudentMarks").addEventListener("click", function() {
    let selectedExam = document.getElementById("exam").value;
    if (!selectedExam) {
        alert("Please select an exam.");
        return;
    }
    const selectedYear = localStorage.getItem("selectedYear");
    const selectedBranch = localStorage.getItem("selectedBranch");
    const selectedSubject = localStorage.getItem("selectedSubject");
    fetch(`/getStudentMarksForEditing?exam=${selectedExam}&year=${selectedYear}&branch=${selectedBranch}&subject=${selectedSubject}`)
    .then(response => response.json())
    .then(data => {
        let tbody = document.querySelector("#studentsInformationTable tbody");
        tbody.innerHTML = ""; // Clear previous data

        data.forEach((student, index) => {
            let oldMarks = student[selectedExam] || ''; // Get old marks
            
            let row = tbody.insertRow();
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${student.htno}</td>
                <td>${student.name}</td>
                <td>${oldMarks}</td>  
                <td><input type="number" class="newMarksInput" data-htno="${student.htno}" value="${oldMarks}"></td>
            `;
        });
    })
    .catch(error => console.error("Error fetching student marks:", error));
});

// Save marks when button is clicked
// document.getElementById("saveMarks").addEventListener("click", function() {
//     let selectedExam = document.getElementById("exam").value;
//     if (!selectedExam) {
//         alert("Please select an exam.");
//         return;
//     }

//     let updatedMarks = [];
//     document.querySelectorAll(".newMarksInput").forEach(input => {
//         let htno = input.dataset.htno;
//         let newMarks = input.value;
//         updatedMarks.push({ htno, exam: selectedExam, marks: newMarks });
//     });

//     fetch("/updateStudentMarks", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ marks: updatedMarks })
//     })
//     .then(response => response.json())
//     .then(data => {
//         if (data.success) {
//             alert("Marks updated successfully!");
//         } else {
//             alert("Error updating marks.");
//         }
//     })
//     .catch(error => console.error("Error updating marks:", error));
// });
// Request HOD to update marks
document.getElementById("requestHod").addEventListener("click", function() {
    let selectedExam = document.getElementById("exam").value;
    if (!selectedExam) {
        alert("Please select an exam.");
        return;
    }

    let updateRequests = [];
    document.querySelectorAll("#studentsInformationTable tbody tr").forEach(row => {
        let htno = row.cells[1].textContent.trim();
        let name = row.cells[2].textContent.trim();
        let oldMarks = row.cells[3].textContent.trim();
        let newMarksInput = row.cells[4].querySelector("input");
        let newMarks = newMarksInput ? newMarksInput.value.trim() : "";

        // Ensure newMarks is a valid number
        if (newMarks === "" || isNaN(newMarks)) {
            alert(`Please enter valid new marks for HTNO: ${htno}`);
            return;
        }

        updateRequests.push({ htno, name, oldMarks, newMarks, exam: selectedExam });
    });

    if (updateRequests.length === 0) {
        alert("No valid marks to update.");
        return;
    }
    const selectedYear = localStorage.getItem("selectedYear");
        const selectedBranch = localStorage.getItem("selectedBranch");
        const selectedSubject = localStorage.getItem("selectedSubject");
        const facultyId = localStorage.getItem("facultyId");
    fetch("/requestHodToUpdateMarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requests: updateRequests, selectedBranch: selectedBranch, selectedYear: selectedYear, selectedSubject: selectedSubject, facultyId: facultyId })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert("Request sent to HOD successfully!");
        } else {
            alert("Error sending request.");
        }
    })
    .catch(error => console.error("Error sending request:", error));
});



//----------------------------------------------------------------------------
document.addEventListener("DOMContentLoaded", async function() {
    try {
         const selectedYear = localStorage.getItem("selectedYear");
        const selectedBranch = localStorage.getItem("selectedBranch");
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
});
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
