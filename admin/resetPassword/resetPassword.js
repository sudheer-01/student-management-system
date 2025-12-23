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
                    <button onclick="approveReset('${r.role}','${r.id}')">
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
        alert("Enter a temporary password");
        return;
    }

    const res = await fetch("/admin/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, id, newPassword })
    });

    const result = await res.json();
    alert(result.message);

    loadResetRequests();
}
