function showMessage(message, type = "info", autoHide = true) {
    const msgEl = document.getElementById("uiMessage");
    if (!msgEl) return;

    msgEl.textContent = message;
    msgEl.className = `ui-message ${type}`;
    msgEl.classList.remove("hidden");

    if (autoHide) {
        setTimeout(() => {
            msgEl.classList.add("hidden");
        }, 3000); // hide after 3 seconds
    }
}

document.addEventListener("DOMContentLoaded", loadResetRequests);

async function loadResetRequests() {

    const res = await fetch("/admin/reset-requests");
    const data = await res.json();

    const tbody = document.querySelector("#resetTable tbody");
    tbody.innerHTML = "";

    data.forEach(r => {
        tbody.innerHTML += `
            <tr>
                <td>${r.role}</td>
                <td>${r.id}</td>
                <td>${r.name}</td>
                <td>${r.email}</td>
                <td>
                    <input type="password" id="pwd-${r.role}-${r.id}">
                </td>
                <td>
                    <button id="enableReset" onclick="approveReset('${r.role}','${r.id}')">
                        Enable Reset
                    </button>
                </td>
            </tr>
        `;
    });
}

async function approveReset(role, id) {

    const pwdInput = document.getElementById(`pwd-${role}-${id}`);
    const newPassword = pwdInput.value;

    if (!newPassword) {
        showMessage("Enter a temporary password", "error");
        return;
    }

    const res = await fetch("/admin/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, id, newPassword })
    });

    const result = await res.json();
    showMessage(result.message, result.success ? "success" : "error");

    loadResetRequests();
}
   const logoutBtn = document.getElementById("logoutBtn");
    // logout
    if (logoutBtn) {
    logoutBtn.addEventListener("click", async function () {

        const role = localStorage.getItem("role");
        const userId = localStorage.getItem("adminId");

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