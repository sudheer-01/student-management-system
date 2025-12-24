const roleSelect = document.getElementById("roleSelect");
const userIdInput = document.getElementById("userId");
const verifyBtn = document.getElementById("verifyBtn");
const requestBtn = document.getElementById("requestBtn");

let verified = false;

verifyBtn.addEventListener("click", async () => {

    const role = roleSelect.value;
    const id = userIdInput.value.trim();

    if (!role || !id) {
        alert("Select role and enter ID");
        return;
    }

    const res = await fetch("/auth/verify-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, id })
    });

    const data = await res.json();

    if (!data.success) {
        alert("Invalid ID");
        requestBtn.disabled = true;
        verified = false;
    } else {
        alert("Verified successfully. You can send reset request.");
        requestBtn.disabled = false;
        verified = true;
    }
});

requestBtn.addEventListener("click", async () => {

    if (!verified) return;

    const role = roleSelect.value;
    const id = userIdInput.value.trim();

    const res = await fetch("/auth/request-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, id })
    });

    const data = await res.json();

    if (data.success) {
        alert("Reset request sent to admin");
        requestBtn.disabled = true;
    } else {
        alert("Failed to send request");
    }
});
