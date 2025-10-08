const yearSelect = document.getElementById("year");
const branchSelect = document.getElementById("branch");
const message = document.getElementById("message");

// Populate branches dynamically from backend
yearSelect.addEventListener("change", () => {
    const year = yearSelect.value;
    branchSelect.innerHTML = '<option value="">--Select Branch--</option>';

    if (!year) return;

    fetch(`/api/branches/${year}`)
        .then(res => res.json())
        .then(data => {
            if (data.branches && data.branches.length > 0) {
                data.branches.forEach(branch => {
                    const option = document.createElement("option");
                    option.value = branch;
                    option.textContent = branch;
                    branchSelect.appendChild(option);
                });
            }
        })
        .catch(err => {
            message.textContent = "Failed to load branches: " + err.message;
            message.className = "error";
        });
});

// Delete semester data
document.getElementById("deleteBtn").addEventListener("click", () => {
    const year = yearSelect.value;
    const branch = branchSelect.value;

    if (!year || !branch) {
        message.textContent = "Please select both year and branch!";
        message.className = "error";
        return;
    }

    if (!confirm(`Are you sure you want to delete all data for year ${year}, branch ${branch}?`)) return;

    fetch("/api/delete-semester-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year, branch })
    })
    .then(res => res.json())
    .then(data => {
        if (data.error) {
            message.textContent = data.error;
            message.className = "error";
        } else {
            message.textContent = data.message;
            message.className = "success";
        }
    })
    .catch(err => {
        message.textContent = err.message;
        message.className = "error";
    });
});
