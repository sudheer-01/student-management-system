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

function toRoman(num) {
    if (num <= 0 || num >= 4000) return num;

    const romanMap = [
        ["M", 1000],
        ["CM", 900],
        ["D", 500],
        ["CD", 400],
        ["C", 100],
        ["XC", 90],
        ["L", 50],
        ["XL", 40],
        ["X", 10],
        ["IX", 9],
        ["V", 5],
        ["IV", 4],
        ["I", 1]
    ];

    let result = "";
    for (const [roman, value] of romanMap) {
        while (num >= value) {
            result += roman;
            num -= value;
        }
    }
    return result;
}

document.addEventListener("DOMContentLoaded", function () {
    fetchYears();
});
async function fetchYears() {
    try {
    const storedYears = localStorage.getItem("hodYears");
    if (!storedYears) {
        showMessage("No HOD years found.", "error");
        return;
    }

    let parsedYears;
    try {
        parsedYears = JSON.parse(storedYears);
    } catch (e) {
        parsedYears = storedYears.split(",");
    }

    const years = parsedYears.map(year => parseInt(year, 10));

    const yearSelect = document.getElementById("yearSelect");
    yearSelect.innerHTML = `<option value="">Select Year</option>`;

    years.forEach(year => {
        yearSelect.innerHTML += `<option value="${year}">${year} Year</option>`;
    });

    yearSelect.addEventListener("change", fetchBranches);
} catch (error) {
    showMessage("Error loading years.", "error");
}

}

async function fetchBranches() {
    const year = document.getElementById("yearSelect").value;
    const branch = localStorage.getItem("hodBranch"); 
    const role = localStorage.getItem("role");
    const hodId = localStorage.getItem("hodId");
    const sessionValue = localStorage.getItem("key");
    if (!year || !branch) return;

    try {
        const response = await fetch(`/getbranches/${role}/${hodId}/${year}/${branch}`,
              {
                 headers: {
                "x-session-key": sessionValue
                }
            }
        );
        const branches = await response.json();
        const branchSelect = document.getElementById("branchSelect");

        branchSelect.innerHTML = `<option value="">Select Section</option>`;
        branches.forEach(({ branch_name }) => {
            branchSelect.innerHTML += `<option value="${branch_name}">${branch_name}</option>`;
        });
        branchSelect.addEventListener("change", loadExams);
    } catch (error) {
        showMessage("Error loading sections.", "error");
    }
}

// Add event listener for branch selection 
document.getElementById("branchSelect").addEventListener("change", loadExams);

// Load exams when both year and branch are selected
async function loadExams() {
    const year = document.getElementById("yearSelect").value;
    const branch = document.getElementById("branchSelect").value;
    const role = localStorage.getItem("role");
    const hodId = localStorage.getItem("hodId");
    const sessionValue = localStorage.getItem("key");
    if (!year || !branch) return; // Ensure both are selected before fetching

    try {
        const response = await fetch(`/getExamColumns/${role}/${hodId}/${year}/${branch}`,
              {
                 headers: {
                "x-session-key": sessionValue
            }
            }
        );
        const exams = await response.json();
        const tbody = document.querySelector("#examsTable tbody");

        tbody.innerHTML = ""; // Clear previous data

        if (exams.length === 0) {
            tbody.innerHTML = "<tr><td colspan='2'>No exams available</td></tr>";
            return;
        }

        exams.forEach(exam => addExamRow(exam));
    } catch (error) {
        showMessage("Error loading exams.", "error");
    }
}


document.getElementById("addExam").addEventListener("click", async () => {
    const year = document.getElementById("yearSelect").value;
    const branch = document.getElementById("branchSelect").value;

    if (!year || !branch) {
        showMessage("Please select Year and Section.", "error");
        return;
    }

    const examRows = document.querySelectorAll("#examChecklist .exam-row");

    for (const row of examRows) {
        const checkbox = row.querySelector("input[type='checkbox']");
        if (!checkbox.checked) continue;

        const examBase = checkbox.value;
        const number = row.querySelector(".exam-number").value || 0;
        const maxMarks = row.querySelector(".max-marks").value;

        if (!maxMarks) {
            showMessage(`Please enter max marks for ${examBase}.`, "info");
            return;
        }

        let examName;
        if (number == 0) {
            examName = examBase;
        } else {
            examName = `${examBase}${toRoman(Number(number))}`;
        }
        const role = localStorage.getItem("role");
        const hodId = localStorage.getItem("hodId");
        const sessionValue = localStorage.getItem("key");
        await fetch(`/addExamToDatabase/${role}/${hodId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json",  "x-session-key": sessionValue },
            body: JSON.stringify({
                year,
                branch,
                examNameWithSpaces: examName,
                maxMarks
            })
        });
    }
    showMessage("Selected exams added successfully.", "success");
    loadExams();
});



function addExamRow(examName) {
    const tbody = document.querySelector("#examsTable tbody");

    let row = document.createElement("tr");
    row.innerHTML = `
        <td>${examName}</td>
        <td><button class="remove-btn" onclick="removeExam('${examName}')">Remove</button></td>
    `;
    tbody.appendChild(row);
}

async function removeExam(examName) {
    const year = document.getElementById("yearSelect").value;
    const branch = document.getElementById("branchSelect").value;
    const role = localStorage.getItem("role");
    const hodId = localStorage.getItem("hodId");
    const sessionValue = localStorage.getItem("key");
    try {
        const response = await fetch(`/removeExamColumn/${role}/${hodId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json",  "x-session-key": sessionValue },
            body: JSON.stringify({ year, branch, examName })
        });

        const message = await response.text();
        showMessage(message, "info");
        loadExams();
    } catch (error) {
        showMessage("Error removing exam.", "error");
    }
}

const logoutBtn = document.getElementById("logoutBtn");
    // logout
    if (logoutBtn) {
    logoutBtn.addEventListener("click", async function () {

        const role = localStorage.getItem("role");
        const userId = localStorage.getItem("hodId");
        const sessionValue = localStorage.getItem("key");

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