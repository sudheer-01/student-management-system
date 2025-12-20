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
                <td>
                    <input type="number"
                        class="newMarksInput"
                        data-htno="${student.htno}"
                        value="${oldMarks}">
                </td>
                <td>
                    <input type="text"
                        class="reasonInput"
                        placeholder="Enter reason"
                        data-htno="${student.htno}">
                </td>
            `;
        });
    })
    .catch(error => console.error("Error fetching student marks:", error));
});

// Request HOD to update marks
document.getElementById("requestHod").addEventListener("click", function () {
    const selectedExam = document.getElementById("exam").value;
    if (!selectedExam) {
        alert("Please select an exam.");
        return;
    }

    let updateRequests = [];

    document.querySelectorAll("#studentsInformationTable tbody tr").forEach(row => {
        const htno = row.cells[1].textContent.trim();
        const name = row.cells[2].textContent.trim();
        const oldMarks = row.cells[3].textContent.trim();

        const newMarksInput = row.querySelector(".newMarksInput");
        const reasonInput = row.querySelector(".reasonInput");

        if (!newMarksInput) return;

        const newMarks = newMarksInput.value.trim();
        const reason = reasonInput.value.trim();

        // 🔥 KEY LOGIC: only changed marks
        if (newMarks === "" || isNaN(newMarks)) return;
        if (newMarks === oldMarks) return;

        if (!reason) {
            alert(`Please enter reason for HTNO: ${htno}`);
            throw new Error("Reason missing");
        }

        updateRequests.push({
            htno,
            name,
            exam: selectedExam,
            oldMarks,
            newMarks,
            reason
        });
    });

    if (updateRequests.length === 0) {
        alert("No marks were changed.");
        return;
    }

    fetch("/requestHodToUpdateMarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            requests: updateRequests,
            selectedYear: localStorage.getItem("selectedYear"),
            selectedBranch: localStorage.getItem("selectedBranch"),
            selectedSubject: localStorage.getItem("selectedSubject"),
            facultyId: localStorage.getItem("facultyId")
        })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            alert("Request sent to HOD successfully!");
        } else {
            alert("Failed to send request.");
        }
    })
    .catch(err => console.error(err));
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
