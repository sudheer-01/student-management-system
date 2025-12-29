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
    async function loadExistingBranchesAndSubjects() {
    try {
        const res = await fetch(
            `/hod/branches-subjects?year=${selectedYear}&hodBranch=${hodBranch}`
        );
        const data = await res.json();

        /* ===== SECTIONS ===== */
        branchContainer.innerHTML = "";
        if (!data.branches.length) {
            branchContainer.innerHTML =
                `<p class="empty-msg">No sections assigned for this year</p>`;
        } else {
            data.branches.forEach(b => {
                const div = document.createElement("div");
                div.className = "branch-row";
                div.innerHTML = `
                    <input type="checkbox" class="existing-branch" value="${b}">
                    <input type="text" class="branch-name" value="${b}" readonly>
                `;
                branchContainer.appendChild(div);
                branchCount++;
            });
        }

        /* ===== SUBJECTS ===== */
        subjectContainer.innerHTML = "";
        if (!data.subjects.length) {
            subjectContainer.innerHTML =
                `<p class="empty-msg">No subjects assigned for this year</p>`;
        } else {
            data.subjects.forEach(s => {
                const div = document.createElement("div");
                div.className = "subject-row";
                div.innerHTML = `
                    <input type="checkbox" class="existing-subject" value="${s}">
                    <input type="text" class="subject-name" value="${s}" readonly>
                `;
                subjectContainer.appendChild(div);
            });
        }

    } catch (err) {
        console.error("Load existing data error:", err);
        alert("Failed to load existing sections/subjects");
    }
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

        branchContainer.innerHTML = "";
        subjectContainer.innerHTML = "";
        branchCount = 0;

        if (!selectedYear) return;

        await loadExistingBranchesAndSubjects();
    });




    // Add Branch Button Click
    addBranchBtn.addEventListener("click", () => {
        if (!selectedYear) {
            alert("Please select a year first.");
            return;
        }

        let branchName = "";

        if (selectedYear === "1") {
            // First-year HOD should manually enter branches
            const div = document.createElement("div");
            div.classList.add("branch-row");
            div.innerHTML = `
                <input type="text" class="branch-name" placeholder="Enter Branch Name" required>
                <button type="button" class="remove-btn">Remove</button>
            `;
            branchContainer.appendChild(div);

            div.querySelector(".remove-btn").addEventListener("click", () => {
                div.remove();
            });

        } else if (hodYears.includes(parseInt(selectedYear))) {
            // Other HODs get predefined branches
            if (branchCount === 0) {
                branchName = hodBranch; // First branch is the main HOD branch
            } else {
                branchName = `${hodBranch}-${String.fromCharCode(64 + branchCount)}`; // CSM-A, CSM-B...
            }

            const div = document.createElement("div");
            div.classList.add("branch-row");
            div.innerHTML = `
                <input type="text" class="branch-name" value="${branchName}" readonly required>
                <button type="button" class="remove-btn">Remove</button>
            `;
            branchContainer.appendChild(div);

            div.querySelector(".remove-btn").addEventListener("click", () => {
                div.remove();
            });

            branchCount++;
        } else {
            alert("You can only add branches for your designated years.");
        }
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
            if (!selectedYear) {
                alert("Please select a year first.");
                return;
            }

            /* NEW sections */
            const newBranches = Array.from(
                document.querySelectorAll(".branch-row input.branch-name")
            )
            .map(i => i.value.trim())
            .filter(Boolean);

            /* NEW subjects */
            const newSubjects = Array.from(
                document.querySelectorAll(".subject-row input.subject-name")
            )
            .filter(i => !i.readOnly)
            .map(i => i.value.trim())
            .filter(Boolean);

            /* Checked existing sections */
            const checkedSections = Array.from(
                document.querySelectorAll(".existing-branch:checked")
            ).map(cb => cb.value);

            /* Checked existing subjects */
            const checkedSubjects = Array.from(
                document.querySelectorAll(".existing-subject:checked")
            ).map(cb => cb.value);

            try {
                const response = await fetch("/saveSubjects", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        year: selectedYear,
                        newBranches,
                        newSubjects,
                        checkedSections,
                        checkedSubjects
                    })
                });

                const result = await response.json();
                if (result.error) {
                    alert(result.error);
                } else {
                    alert("Saved successfully!");
                    branchContainer.innerHTML = "";
                    subjectContainer.innerHTML = "";
                    branchCount = 0;
                    loadExistingBranchesAndSubjects();
                }
            } catch (err) {
                console.error(err);
                alert("Save failed");
            }
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
