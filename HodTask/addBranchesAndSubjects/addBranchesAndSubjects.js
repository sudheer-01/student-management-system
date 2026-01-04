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

document.addEventListener("DOMContentLoaded", async () => {
    const yearDropdown = document.getElementById("year");
    const branchContainer = document.getElementById("branchContainer");
    const addBranchBtn = document.getElementById("addBranch");
    const subjectContainer = document.getElementById("subjectContainer");
    const addSubjectBtn = document.getElementById("addSubject");
    const saveBtn = document.getElementById("saveData");
    const newSubjectsContainer = document.getElementById("newSubjectsContainer");
    const deleteModeBtn = document.getElementById("deleteModeBtn");
    let deleteMode = false;

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

yearDropdown.addEventListener("change", async () => {
    selectedYear = yearDropdown.value;
    if (!selectedYear) return;
    await loadExistingData();
});



    // Add Branch Button Click
   addBranchBtn.addEventListener("click", async () => {
    const sec = document.getElementById("newSectionInput").value.trim();
    if (!sec) return showMessage("Enter section name", "error");

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
        showMessage("Please select a year first.", "error");
        return;
    }

    const div = document.createElement("div");
    div.className = "subject-row";
    div.innerHTML = `
        <input type="text" class="new-subject-input" placeholder="Enter Subject Name" required>
        <button type="button" class="remove-btn">Remove</button>
    `;

    div.querySelector(".remove-btn").onclick = () => div.remove();
    newSubjectsContainer.appendChild(div);
});


    // Save Data Button Click
saveBtn.addEventListener("click", async () => {

    const newSubjects = Array.from(
        document.querySelectorAll(".new-subject-input")
    )
    .map(i => i.value.trim())
    .filter(Boolean);

    if (!newSubjects.length) {
        return showMessage("Enter at least one subject", "error");
    }

    const selectedSections = Array.from(
        document.querySelectorAll(".section-check:checked")
    ).map(cb => cb.value);

    if (!selectedSections.length) {
        return showMessage("Select at least one section", "error");
    }

    await fetch("/saveSubjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            year: selectedYear,
            newSections: [],
            newSubjects,
            selectedSections
        })
    });

    newSubjectsContainer.innerHTML = "";
    loadExistingData();
});

deleteModeBtn.addEventListener("click", async () => {
    deleteMode = true;

    /* Hide add/save UI */
    document.getElementById("newSectionInput").style.display = "none";
    addBranchBtn.style.display = "none";
    addSubjectBtn.style.display = "none";
    saveBtn.style.display = "none";
    deleteModeBtn.style.display = "none";

    /* Show back button */
    document.getElementById("backToSaveBtn").style.display = "inline-block";

    await loadDeleteUI();
});

async function loadDeleteUI() {
    const res = await fetch(
        `/hod/branches-subjects?year=${selectedYear}&hodBranch=${hodBranch}`
    );
    const data = await res.json();

    branchContainer.innerHTML = "";
    subjectContainer.innerHTML = "";

    data.sections.forEach(sec => {
        const secDiv = document.createElement("div");
        secDiv.className = "section-card";
        secDiv.innerHTML = `
            <strong>${sec.name}</strong>
            <button class="danger-btn delete-section" data-sec="${sec.name}">
                Delete Section
            </button>
            <ul>
                ${sec.subjects.map(s => `
                    <li>
                        <input type="checkbox" class="delete-subject"
                               data-sec="${sec.name}"
                               value="${s}">
                        ${s}
                    </li>
                `).join("")}
            </ul>
        `;
        branchContainer.appendChild(secDiv);
    });

    addDeleteHandlers();
}
function addDeleteHandlers() {

    /* DELETE SECTION */
    document.querySelectorAll(".delete-section").forEach(btn => {
        btn.onclick = async () => {
            const section = btn.dataset.sec;

            await fetch("/deleteSection", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ year: selectedYear, section })
            });

            //deleteMode = false;
            resetUI();
        };
    });

    /* DELETE SUBJECTS */
    subjectContainer.insertAdjacentHTML(
        "beforeend",
        `<button id="deleteSubjectsBtn" class="danger-btn">Delete Selected Subjects</button>`
    );

    document.getElementById("deleteSubjectsBtn").onclick = async () => {
        const checked = Array.from(
            document.querySelectorAll(".delete-subject:checked")
        );

        if (!checked.length) {
            return showMessage("Select subjects to delete", "error");
        }

        const payload = checked.map(c => ({
            section: c.dataset.sec,
            subject: c.value
        }));

        await fetch("/deleteSubjects", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ year: selectedYear, items: payload })
        });

        //deleteMode = false;
        resetUI();
    };
}

function resetUI() {
    switchToSaveMode();
    loadExistingData();
}

function switchToSaveMode() {
    deleteMode = false;

    document.getElementById("newSectionInput").style.display = "";
    addBranchBtn.style.display = "";
    addSubjectBtn.style.display = "";
    saveBtn.style.display = "";
    deleteModeBtn.style.display = "";

    document.getElementById("backToSaveBtn").style.display = "none";
}

document.getElementById("backToSaveBtn").addEventListener("click", () => {
    switchToSaveMode();
    loadExistingData();
});


});

const logoutBtn = document.getElementById("logoutBtn");
    // logout
    if (logoutBtn) {
    logoutBtn.addEventListener("click", async function () {

        const role = localStorage.getItem("role");
        const userId = localStorage.getItem("hodId");

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