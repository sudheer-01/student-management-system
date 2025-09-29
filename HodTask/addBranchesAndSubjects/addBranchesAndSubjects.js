document.addEventListener("DOMContentLoaded", async () => {
    const yearDropdown = document.getElementById("year");
    const branchContainer = document.getElementById("branchContainer");
    const addBranchBtn = document.getElementById("addBranch");
    const subjectContainer = document.getElementById("subjectContainer");
    const addSubjectBtn = document.getElementById("addSubject");
    const saveBtn = document.getElementById("saveData");

    let selectedYear = null;
    let branchCount = 0;
    let hodBranch = "";
    let hodYears = [];

    // Retrieve HOD details from localStorage
    const hodDetailsString = localStorage.getItem('hodDetails');
    const hodDetails = JSON.parse(hodDetailsString);

    if (hodDetails) {
        hodBranch = hodDetails.hodBranch;
        hodYears = hodDetails.hodYears.map(year => parseInt(year)); // Ensure years are numbers

        populateYearDropdown();
    } else {
        alert("HOD details not found. Please log in again.");
        return;
    }

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

    // Handle year selection
    yearDropdown.addEventListener("change", () => {
        selectedYear = yearDropdown.value;
        branchContainer.innerHTML = "";
        subjectContainer.innerHTML = "";
        branchCount = 0;
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

        const branchInputs = document.querySelectorAll("#branchContainer .branch-name");
        const subjectInputs = document.querySelectorAll("#subjectContainer .subject-name");

        if (branchInputs.length === 0) {
            alert("Please add at least one branch.");
            return;
        }

        if (subjectInputs.length === 0) {
            alert("Please add at least one subject.");
            return;
        }

        const branches = Array.from(branchInputs)
            .map(input => input.value.trim())
            .filter(Boolean); // Remove empty values

        const subjects = Array.from(subjectInputs)
            .map(input => input.value.trim())
            .filter(Boolean); // Remove empty values

        if (branches.length === 0) {
            alert("Please enter valid branch names.");
            return;
        }

        if (subjects.length === 0) {
            alert("Please enter valid subject names.");
            return;
        }
        try {
            const response = await fetch("/saveSubjects", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ year: selectedYear, branches, subjects })
            });

            const result = await response.json();
            if (result.error) {
                alert(`Error: ${result.error}`);
            } else {
                alert("Branches and subjects saved successfully!");
                branchContainer.innerHTML = "";
                subjectContainer.innerHTML = "";
                branchCount = 0;
            }
        } catch (error) {
            console.error("Error saving data:", error);
            alert("Failed to save data. Try again.");
        }
    });
});
      