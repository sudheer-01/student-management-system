/* =========================
   EXAM CHANGE – SAFE DOM
========================= */
document.addEventListener("DOMContentLoaded", () => {
    const examSelect = document.getElementById("exam");
    const examHeading = document.getElementById("examHeading");

    if (examSelect && examHeading) {
        examSelect.addEventListener("change", function () {
            examHeading.textContent = this.value
                ? `${this.value} Marks`
                : "Marks";
        });
    }
});

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
/* =========================
   GET STUDENT MARKS
========================= */
document.getElementById("getStudentMarks").addEventListener("click", function () {
    const selectedExam = document.getElementById("exam").value;

    if (!selectedExam) {
        showMessage("Please select an exam.", "error");
        return;
    }

    const selectedYear = localStorage.getItem("selectedYear");
    const selectedBranch = localStorage.getItem("selectedBranch");
    const selectedSubject = localStorage.getItem("selectedSubject");

    fetch(
        `/getStudentMarksForEditing?exam=${selectedExam}&year=${selectedYear}&branch=${selectedBranch}&subject=${selectedSubject}`
    )
        .then(res => res.json())
        .then(data => {
            const tbody = document.querySelector("#studentsInformationTable tbody");
            tbody.innerHTML = "";

            if (!data || data.length === 0) {
                showMessage("No student records found.", "error");
                return;
            }

            data.forEach((student, index) => {
                const oldMarks = student[selectedExam] ?? "";

                const row = document.createElement("tr");
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
                               placeholder="Enter reason">
                    </td>
                `;
                tbody.appendChild(row);
            });
        })
        .catch(err => {
            showMessage("Failed to fetch student marks.", "error");
        });
});

/* =========================
   REQUEST HOD FOR UPDATE
========================= */
document.getElementById("requestHod").addEventListener("click", function () {
    const selectedExam = document.getElementById("exam").value;

    if (!selectedExam) {
        showMessage("Please select an exam.", "error");
        return;
    }

    const tbodyRows = document.querySelectorAll("#studentsInformationTable tbody tr");
    let updateRequests = [];

    tbodyRows.forEach(row => {
        const htno = row.cells[1].textContent.trim();
        const name = row.cells[2].textContent.trim();
        const oldMarks = row.cells[3].textContent.trim();

        const newMarksInput = row.querySelector(".newMarksInput");
        const reasonInput = row.querySelector(".reasonInput");

        if (!newMarksInput) return;

        const newMarks = newMarksInput.value.trim();
        const reason = reasonInput.value.trim();

        if (newMarks === "" || isNaN(newMarks)) return;
        if (Number(newMarks) === Number(oldMarks)) return;

        if (!reason) {
            showMessage(`Please enter reason for HTNO: ${htno}`, "error");
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
        showMessage("No marks were changed.", "info");
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
                showMessage("Request sent to HOD successfully!", "success");    
            } else {
                showMessage("Failed to send request.", "error");
            }
        })
        .catch(err => console.error("Request error:", err));
});

/* =========================
   LOAD EXAMS ON PAGE LOAD
========================= */
document.addEventListener("DOMContentLoaded", async function () {
    try {
        const selectedYear = localStorage.getItem("selectedYear");
        const selectedBranch = localStorage.getItem("selectedBranch");

        const res = await fetch(`/getExams?year=${selectedYear}&branch=${selectedBranch}`);
        const exams = await res.json();

        const examDropdown = document.getElementById("exam");
        examDropdown.innerHTML = `<option value="">Select Exam</option>`;

        exams.forEach(exam => {
            const option = document.createElement("option");
            option.value = exam;
            option.textContent = exam;
            examDropdown.appendChild(option);
        });
    } catch (error) {
        showMessage("Failed to load exams.", "error");
    }
});

/* =========================
   LOGOUT
========================= */
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