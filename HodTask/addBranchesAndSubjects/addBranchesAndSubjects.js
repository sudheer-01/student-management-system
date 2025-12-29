document.addEventListener("DOMContentLoaded", async () => {
    const yearDropdown = document.getElementById("year");
    const branchContainer = document.getElementById("branchContainer");
    const addBranchBtn = document.getElementById("addBranch");
    const subjectContainer = document.getElementById("subjectContainer");
    const addSubjectBtn = document.getElementById("addSubject");
    const saveBtn = document.getElementById("saveData");

    let selectedYear = null;
    let branchCount = 0;
    let hodBranch = localStorage.getItem("hodBranch");
    let hodYears = JSON.parse(localStorage.getItem("hodYears")).map(year => parseInt(year));
async function loadExistingData() {
    const res = await fetch(
        `/hod/branches-subjects?year=${selectedYear}&hodBranch=${hodBranch}`
    );
    const data = await res.json();

    branchContainer.innerHTML = "";
    subjectContainer.innerHTML = "";

    if (!data.sections.length) {
        branchContainer.innerHTML =
            `<p class="empty-msg">No sections added yet</p>`;
        return;
    }

    /* SECTION CARDS */
    data.sections.forEach(sec => {
        const div = document.createElement("div");
        div.className = "section-card";
        div.innerHTML = `
            <strong>${sec.name}</strong>
            <ul>
                ${sec.subjects.length
                    ? sec.subjects.map(s => `<li>${s}</li>`).join("")
                    : "<li>No subjects</li>"
                }
            </ul>
        `;
        branchContainer.appendChild(div);
    });

    /* CHECKBOXES FOR SUBJECT ADD */
    const selectBox = document.createElement("div");
    selectBox.innerHTML = `<h4>Select section(s) to assign subject(s)</h4>`;

    data.sections.forEach(sec => {
        selectBox.innerHTML += `
            <label>
                <input type="checkbox" class="section-check" value="${sec.name}">
                ${sec.name}
            </label><br>
        `;
    });

    subjectContainer.appendChild(selectBox);
}

    populateYearDropdown();
    // Populate the year dropdown dynamically
    function populateYearDropdown() {
        yearDropdown.innerHTML = ""; // Clear existing options

        // Add default option
        const defaultOption = document.createElement("option");
        defaultOption.value = "";
        defaultOption.textContent = "Choose Year";
        defaultOption.disabled = true;
        defaultOption.selected = true;
        yearDropdown.appendChild(defaultOption);

        if (hodYears.length === 0) {
            // If no specific years assigned, allow selecting all years
            [1, 2, 3, 4].forEach(year => {
                const option = document.createElement("option");
                option.value = year;
                option.textContent = `${year} Year`;
                yearDropdown.appendChild(option);
            });
        } else {
            // Only show assigned years for the HOD
            hodYears.forEach(year => {
                const option = document.createElement("option");
                option.value = year;
                option.textContent = `${year} Year`;
                yearDropdown.appendChild(option);
            });
        }
    }

//    yearDropdown.addEventListener("change", async () => {
//         selectedYear = yearDropdown.value;

//         branchContainer.innerHTML = "";
//         subjectContainer.innerHTML = "";
//         branchCount = 0;

//         if (!selectedYear) return;

//         await loadExistingBranchesAndSubjects();
//     });

yearDropdown.addEventListener("change", async () => {
    selectedYear = yearDropdown.value;
    if (!selectedYear) return;
    await loadExistingData();
});



    // Add Branch Button Click
   addBranchBtn.addEventListener("click", async () => {
    const sec = document.getElementById("newSectionInput").value.trim();
    if (!sec) return alert("Enter section name");

    await fetch("/saveSubjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            year: selectedYear,
            newSections: [sec],
            newSubjects: [],
            selectedSections: []
        })
    });

    document.getElementById("newSectionInput").value = "";
    loadExistingData();
});


    // Add Subject Button Click
    addSubjectBtn.addEventListener("click", () => {
        if (!selectedYear) {
            alert("Please select a year first.");
            return;
        }

        const div = document.createElement("div");
        div.classList.add("subject-row");
        div.innerHTML = `
            <input type="text" class="subject-name" placeholder="Enter Subject Name" required>
            <button type="button" class="remove-btn">Remove</button>
        `;
        subjectContainer.appendChild(div);

        div.querySelector(".remove-btn").addEventListener("click", () => {
            div.remove();
        });
    });

    // Save Data Button Click
saveBtn.addEventListener("click", async () => {
    const subject = document.querySelector(".new-subject").value.trim();
    if (!subject) return alert("Enter subject");

    const selectedSections = Array.from(
        document.querySelectorAll(".section-check:checked")
    ).map(cb => cb.value);

    if (!selectedSections.length) {
        return alert("Select at least one section");
    }

    await fetch("/saveSubjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            year: selectedYear,
            newSections: [],
            newSubjects: [subject],
            selectedSections
        })
    });

    document.querySelector(".new-subject").value = "";
    loadExistingData();
});


});

const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
        logoutBtn.addEventListener("click", function () {
            if (!confirm("Log out?")) return;
            fetch("/logout", { method: "POST" })
                .then(() => { window.location.href = "/"; })
                .catch(() => { window.location.href = "/"; });
        });
    }
