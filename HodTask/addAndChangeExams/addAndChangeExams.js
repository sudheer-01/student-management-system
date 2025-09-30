document.addEventListener("DOMContentLoaded", function () {
    fetchYears();
});
async function fetchYears() {
    try {
    const storedYears = localStorage.getItem("hodYears");
    if (!storedYears) {
        console.warn("No HOD years found in localStorage");
        return;
    }

    let parsedYears;
    try {
        // Try parsing JSON (["2","3","4"])
        parsedYears = JSON.parse(storedYears);
    } catch (e) {
        // Fallback to comma-split ("2,3,4")
        parsedYears = storedYears.split(",");
    }

    // Convert to numbers (int)
    const years = parsedYears.map(year => parseInt(year, 10));

    const yearSelect = document.getElementById("yearSelect");
    yearSelect.innerHTML = `<option value="">Select Year</option>`;

    years.forEach(year => {
        yearSelect.innerHTML += `<option value="${year}">${year} Year</option>`;
    });

    yearSelect.addEventListener("change", fetchBranches);
} catch (error) {
    console.error("Error loading years from localStorage:", error);
}

}

async function fetchBranches() {
    const year = document.getElementById("yearSelect").value;
    const branch = localStorage.getItem("hodBranch"); // example: "CSE" or "ECE"
    
    if (!year || !branch) return;

    try {
        const response = await fetch(`/getbranches/${year}/${branch}`);
        const branches = await response.json();
        const branchSelect = document.getElementById("branchSelect");

        branchSelect.innerHTML = `<option value="">Select Branch</option>`;
        branches.forEach(({ branch_name }) => {
            branchSelect.innerHTML += `<option value="${branch_name}">${branch_name}</option>`;
        });
        branchSelect.addEventListener("change", loadExams);
    } catch (error) {
        console.error("Error fetching branches:", error);
    }
}

// Add event listener for branch selection (outside fetchBranches to avoid re-adding)
document.getElementById("branchSelect").addEventListener("change", loadExams);

// Load exams when both year and branch are selected
async function loadExams() {
    const year = document.getElementById("yearSelect").value;
    const branch = document.getElementById("branchSelect").value;
    
    if (!year || !branch) return; // Ensure both are selected before fetching

    try {
        const response = await fetch(`/getExamColumns/${year}/${branch}`);
        const exams = await response.json();
        const tbody = document.querySelector("#examsTable tbody");

        tbody.innerHTML = ""; // Clear previous data

        if (exams.length === 0) {
            tbody.innerHTML = "<tr><td colspan='2'>No exams available</td></tr>";
            return;
        }

        exams.forEach(exam => addExamRow(exam));
    } catch (error) {
        console.error("Error fetching exams:", error);
    }
}


document.getElementById("addExam").addEventListener("click", async function () {
    const examNameWithSpaces = document.getElementById("examName").value.trim();
    const year = document.getElementById("yearSelect").value;
    const branch = document.getElementById("branchSelect").value;

    if (!examName) {
        alert("Please enter an exam name.");
        return;
    }

    try {
        const response = await fetch("/addExamToDatabase", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ year, branch, examNameWithSpaces })
        });

        const message = await response.text();
        alert(message);
        loadExams();
        document.getElementById("examName").value = "";
    } catch (error) {
        console.error("Error adding exam:", error);
    }
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
    try {
        const response = await fetch("/removeExamColumn", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ year, branch, examName })
        });

        const message = await response.text();
        alert(message);
        loadExams();
    } catch (error) {
        console.error("Error removing exam:", error);
    }
}
