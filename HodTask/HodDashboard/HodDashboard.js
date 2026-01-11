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
    const profileAvatar = document.getElementById("profileAvatar");
        
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
        if (profileAvatar && hodName) {
            profileAvatar.textContent = hodName.charAt(0).toUpperCase();
        }

        document.getElementById("hodYears").innerText = `Available Years: ${hodYears.join(", ")}`;
    

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
});
