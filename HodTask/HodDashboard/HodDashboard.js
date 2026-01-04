document.addEventListener("DOMContentLoaded", async () => {
    const profileAvatar = document.getElementById("profileAvatar");
        
        // Update HOD details in navbar
        const hodName = localStorage.getItem("hodName");
        const hodBranch = localStorage.getItem("hodBranch");
        const hodYears = JSON.parse(localStorage.getItem("hodYears")) || [];

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
    

    const logoutBtn = document.getElementById("logoutBtn");
    // logout
    if (logoutBtn) {
    logoutBtn.addEventListener("click", async function () {
        if (!confirm("Log out of the faculty panel?")) return;

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
});
