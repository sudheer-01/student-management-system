const roleSelect = document.getElementById("roleSelect");
const userIdInput = document.getElementById("userId");
const verifyBtn = document.getElementById("verifyBtn");
const requestBtn = document.getElementById("requestBtn");

function showMessage(message, type = "info", autoHide = true) {
    const msgEl = document.getElementById("uiMessage");
    if (!msgEl) return;

    msgEl.textContent = message;
    msgEl.className = `ui-message ${type}`;
    msgEl.classList.remove("hidden");

    if (autoHide) {
        setTimeout(() => {
            msgEl.classList.add("hidden");
        }, 4000); // hide after 4 seconds
    }
}

let verified = false;

/* ROLE CHANGE */
roleSelect.addEventListener("change", () => {
    verified = false;
    requestBtn.disabled = true;
});

/* VERIFY USER */
verifyBtn.addEventListener("click", async () => {

    const role = roleSelect.value;
    const id = userIdInput.value.trim();

    if (!role || !id) {
        showMessage("Please fill all required fields", "error");
        return;
    }

    const payload = {
        role,
        id
    };

    const res = await fetch("/auth/verify-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (!data.success) {
        showMessage("Invalid details", "error");
        verified = false;
        requestBtn.disabled = true;
    } else {
        showMessage("Verified successfully", "success");
        verified = true;
        requestBtn.disabled = false;
    }
});

/* SEND RESET REQUEST */
requestBtn.addEventListener("click", async () => {

    if (!verified) return;

    const payload = {
        role: roleSelect.value,
        id: userIdInput.value.trim()
    };

    const res = await fetch("/auth/request-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (data.success) {
        showMessage("Reset request sent successfully", "success");
        requestBtn.disabled = true;
    } else {
        showMessage("Failed to send request", "error");
    }
});
