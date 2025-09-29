document.addEventListener("DOMContentLoaded", () => {
    const logoutBtn = document.getElementById("logoutBtn");
    const profileAvatar = document.getElementById("profileAvatar");
    
    // Retrieve HOD details from localStorage
    const hodDetailsString = localStorage.getItem("hodDetails");
    const hodDetails = JSON.parse(hodDetailsString);

    if (hodDetails) {
        const { hodName, hodBranch, hodYears } = hodDetails;

        // Update HOD details in navbar
        const hodNameNav = document.getElementById("hodNameNav");
        const hodBranchNav = document.getElementById("hodBranchNav");
        if (hodNameNav) hodNameNav.textContent = `HOD: ${hodName}`;
        if (hodBranchNav) {
            hodBranchNav.textContent = `Branch: ${hodBranch}`;
            const pill = document.getElementById("branchPillText");
            if (pill) pill.textContent = hodBranch;
        }
        // Update profile avatar with first letter of HOD name
        if (profileAvatar && hodName) {
            profileAvatar.textContent = hodName.charAt(0).toUpperCase();
        }

        // Update years display
        document.getElementById("hodYears").innerText = `Available Years: ${hodYears.join(", ")}`;
    } else {
        // Handle case where HOD details are not available
        const hodNameNav = document.getElementById("hodNameNav");
        const hodBranchNav = document.getElementById("hodBranchNav");
        const hodYearsElement = document.getElementById("hodYears");
        if (hodNameNav) hodNameNav.textContent = "HOD: Not Logged In";
        if (hodBranchNav) hodBranchNav.textContent = "Branch: N/A";
        if (hodYearsElement) hodYearsElement.textContent = "Year: N/A";
    }

    if (logoutBtn) {
        logoutBtn.addEventListener("click", function () {
            if (!confirm("Log out of the HOD panel?")) return;
            // Clear HOD details from localStorage
            localStorage.removeItem("hodDetails");
            window.location.href = "/";
        });
    }
});
