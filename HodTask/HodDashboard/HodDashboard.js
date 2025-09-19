document.addEventListener("DOMContentLoaded", async () => {
    const logoutBtn = document.getElementById("logoutBtn");
    const profileAvatar = document.getElementById("profileAvatar");
    
    try {
        const response = await fetch("/getHodDetails");
        const data = await response.json();

        if (data.error) {
            alert(data.error);
            window.location.href = "/"; // Redirect to login if details are missing
            return;
        }
        
        // Update HOD details in navbar
        const hodNameNav = document.getElementById("hodNameNav");
        const hodBranchNav = document.getElementById("hodBranchNav");
        if (hodNameNav) hodNameNav.textContent = `HOD: ${data.hodName}`;
        if (hodBranchNav) {
            hodBranchNav.textContent = `Branch: ${data.hodBranch}`;
            const pill = document.getElementById("branchPillText");
            if (pill) pill.textContent = data.hodBranch;
        }

        // Update profile avatar with first letter of HOD name
        if (profileAvatar && data.hodName) {
            profileAvatar.textContent = data.hodName.charAt(0).toUpperCase();
        }

        // Update years display
        document.getElementById("hodYears").innerText = `Available Years: ${data.hodYears.join(", ")}`;
    } catch (error) {
        console.error("Error fetching HOD details:", error);
        alert("Failed to load HOD details. Try again later.");
    }

    if (logoutBtn) {
        logoutBtn.addEventListener("click", function () {
            if (!confirm("Log out?")) return;
            fetch("/logout", { method: "POST" })
                .then(() => { window.location.href = "/"; })
                .catch(() => { window.location.href = "/"; });
        });
    }
});
