const roleSelect = document.getElementById("roleSelect");
const studentFields = document.getElementById("studentFields");
const yearSelect = document.getElementById("yearSelect");
const branchSelect = document.getElementById("branchSelect");
const userIdInput = document.getElementById("userId");
const verifyBtn = document.getElementById("verifyBtn");
const requestBtn = document.getElementById("requestBtn");

let verified = false;

/* ROLE CHANGE */
roleSelect.addEventListener("change", () => {
    verified = false;
    requestBtn.disabled = true;

    if (roleSelect.value === "student") {
        studentFields.style.display = "block";
    } else {
        studentFields.style.display = "none";
    }
});

/* LOAD BRANCHES FOR STUDENT */
yearSelect?.addEventListener("change", async () => {
    branchSelect.innerHTML = `<option value="">Select Branch</option>`;
    if (!yearSelect.value) return;

    const res = await fetch(`/api/branches/${yearSelect.value}`);
    const data = await res.json();

    data.branches.forEach(b => {
        branchSelect.innerHTML += `<option value="${b}">${b}</option>`;
    });
});

/* VERIFY USER */
verifyBtn.addEventListener("click", async () => {

    const role = roleSelect.value;
    const id = userIdInput.value.trim();

    if (!role || !id) {
        alert("Fill all required fields");
        return;
    }

    const payload = {
        role,
        id,
        year: yearSelect?.value,
        branch: branchSelect?.value
    };

    const res = await fetch("/auth/verify-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (!data.success) {
        alert("Invalid details");
        verified = false;
        requestBtn.disabled = true;
    } else {
        alert("Verified successfully");
        verified = true;
        requestBtn.disabled = false;
    }
});

/* SEND RESET REQUEST */
requestBtn.addEventListener("click", async () => {

    if (!verified) return;

    const payload = {
        role: roleSelect.value,
        id: userIdInput.value.trim(),
        year: yearSelect?.value,
        branch: branchSelect?.value
    };

    const res = await fetch("/auth/request-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (data.success) {
        alert("Reset request sent successfully");
        requestBtn.disabled = true;
    } else {
        alert("Failed to send request");
    }
});
