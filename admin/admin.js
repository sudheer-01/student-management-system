document.addEventListener("DOMContentLoaded", function () {
    const statusFilter = document.getElementById("statusFilter");
    const hodRequestsBody = document.getElementById("hodRequestsBody");
    const spinner = document.getElementById("loadingSpinner");
    const statusMessage = document.getElementById("statusMessage");
    const searchInput = document.getElementById("searchInput");
    const exportCsvBtn = document.getElementById("exportCsvBtn");
    //const logoutBtn = document.getElementById("logoutBtn");
    let cachedData = [];

    // Fetch HOD Requests
    function fetchHodRequests(status = "All") {
        if (spinner) spinner.classList.remove("hidden");
        if (statusMessage) { statusMessage.textContent = "Loading requests..."; statusMessage.classList.remove("hidden"); }
        fetch("/getHodRequests")
            .then(response => response.json())
            .then(data => {
                console.log("Fetched Data:", data);
                cachedData = Array.isArray(data) ? data : [];
                hodRequestsBody.innerHTML = ""; // Clear table before inserting new data

                cachedData.forEach(hod => {
                    if (status !== "All" && hod.status !== status) return;

                    let row = `<tr>
                        <td>${hod.hod_id}</td>
                        <td>${hod.name}</td>
                        <td>${hod.email}</td>
                        <td>${hod.year}</td>
                        <td>${hod.branch}</td>
                        <td><span class="badge">${hod.status}</span></td>
                        <td>
                            ${hod.status === "Pending" ? `
                                <button class="action-btn approve" onclick="updateStatus('${hod.hod_id}', 'Approved')">Approve</button>
                                <button class="action-btn reject" onclick="updateStatus('${hod.hod_id}', 'Rejected')">Reject</button>
                            ` : "No Action"}
                        </td>
                    </tr>`;
                    hodRequestsBody.innerHTML += row;
                });
                const wrapper = document.querySelector('.table-wrapper');
                if (wrapper) wrapper.classList.remove('hidden');

                if (statusMessage) { statusMessage.textContent = `${hodRequestsBody.children.length} request(s) loaded.`; setTimeout(() => statusMessage.classList.add('hidden'), 1500); }
            })
            .catch(error => {
                console.error("Error fetching HOD requests:", error);
                if (statusMessage) { statusMessage.textContent = "Error loading requests."; statusMessage.classList.remove("hidden"); }
            })
            .finally(() => { if (spinner) spinner.classList.add("hidden"); });
    }

    // Update Status (Approve/Reject)
    window.updateStatus = function (hod_id, newStatus) {
        if (!confirm(`Are you sure you want to mark ${hod_id} as ${newStatus}?`)) return;
        if (spinner) spinner.classList.remove("hidden");
        fetch("/updateHodStatus", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ hod_id, newStatus })
        })
        .then(response => response.json())
        .then(result => {
            console.log("Update Response:", result);
            alert(result.message);
            fetchHodRequests(statusFilter.value); // Refresh table after update
        })
        .catch(error => console.error("Error updating status:", error))
        .finally(() => { if (spinner) spinner.classList.add("hidden"); });
    };

    // Status Filter Event
    statusFilter.addEventListener("change", () => fetchHodRequests(statusFilter.value));
    // live search filter
    if (searchInput) {
        searchInput.addEventListener("input", function () {
            const q = this.value.toLowerCase().trim();
            hodRequestsBody.innerHTML = "";
            cachedData.forEach(hod => {
                if (statusFilter.value !== "All" && hod.status !== statusFilter.value) return;
                const hay = `${hod.name} ${hod.email}`.toLowerCase();
                if (!q || hay.includes(q)) {
                    let row = `<tr>
                        <td>${hod.hod_id}</td>
                        <td>${hod.name}</td>
                        <td>${hod.email}</td>
                        <td>${hod.year}</td>
                        <td>${hod.branch}</td>
                        <td><span class="badge">${hod.status}</span></td>
                        <td>
                            ${hod.status === "Pending" ? `
                                <button class="action-btn approve" onclick="updateStatus('${hod.hod_id}', 'Approved')">Approve</button>
                                <button class="action-btn reject" onclick="updateStatus('${hod.hod_id}', 'Rejected')">Reject</button>
                            ` : "No Action"}
                        </td>
                    </tr>`;
                    hodRequestsBody.innerHTML += row;
                }
            });
        });
    }
    // export CSV
    if (exportCsvBtn) {
        exportCsvBtn.addEventListener("click", function () {
            const table = document.getElementById("hodRequestsTable");
            if (!table) return;
            const rows = Array.from(table.querySelectorAll("tr"));
            const csv = rows.map(tr => Array.from(tr.children).map(td => '"' + td.textContent.replace(/\"/g, '""').trim() + '"').join(",")).join("\n");
            const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "hod-requests.csv";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        });
    }

    // logout
   const logoutBtn = document.getElementById("logoutBtn");
    // logout
    if (logoutBtn) {
    logoutBtn.addEventListener("click", async function () {
        if (!confirm("Log out of the faculty panel?")) return;

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

    // initial load
    fetchHodRequests("All");
});
