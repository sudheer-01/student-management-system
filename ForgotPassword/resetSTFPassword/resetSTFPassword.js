const roleEl = document.getElementById("role");
const userIdEl = document.getElementById("userId");
const verifyBtn = document.getElementById("verifyBtn");
const verifySection = document.getElementById("verifySection");
const checkTempBtn = document.getElementById("checkTempBtn");
const resetSection = document.getElementById("resetSection");
const updateBtn = document.getElementById("updateBtn");
const msg = document.getElementById("msg");

verifyBtn.onclick = async () => {
    const role = roleEl.value;
    const userId = userIdEl.value;

    if (!role || !userId) return alert("Select role and enter ID");

    const res = await fetch("/api/reset/verify-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, userId })
    });

    const data = await res.json();

    if (!data.success) {
        msg.textContent = data.message;
        return;
    }

    verifySection.classList.remove("hidden");
    msg.textContent = "User verified. Enter temporary password.";
};

checkTempBtn.onclick = async () => {
    const role = roleEl.value;
    const userId = userIdEl.value;
    const tempPassword = document.getElementById("tempPassword").value;

    const res = await fetch("/api/reset/verify-temp-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, userId, tempPassword })
    });

    const data = await res.json();

    if (!data.success) {
        msg.textContent = data.message;
        return;
    }

    resetSection.classList.remove("hidden");
    msg.textContent = "Enter new password.";
};

updateBtn.onclick = async () => {
    const newPwd = document.getElementById("newPassword").value;
    const confirmPwd = document.getElementById("confirmPassword").value;

    if (newPwd !== confirmPwd) {
        return alert("Passwords do not match");
    }

    const res = await fetch("/api/reset/update-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            role: roleEl.value,
            userId: userIdEl.value,
            newPassword: newPwd
        })
    });

    const data = await res.json();
    msg.textContent = data.message;

    if (data.success) {
        setTimeout(() => window.location.href = "/", 2000);
    }
};
