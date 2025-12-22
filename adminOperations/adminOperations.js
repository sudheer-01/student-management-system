const yearSelect = document.getElementById("yearSelect");
const branchSelect = document.getElementById("branchSelect");
const loadBtn = document.getElementById("loadStudentsBtn");
const tableBody = document.querySelector("#studentsTable tbody");

yearSelect.addEventListener("change", async () => {

    const year = yearSelect.value;

    // Clear existing branches
    branchSelect.innerHTML = `<option value="">Select Branch</option>`;

    if (!year) return;

    try {
        const res = await fetch(`/api/branches/${year}`);
        const data = await res.json();

        if (!data.branches || data.branches.length === 0) {
            alert("No branches found for selected year");
            return;
        }

        data.branches.forEach(branch => {
            const opt = document.createElement("option");
            opt.value = branch;
            opt.textContent = branch;
            branchSelect.appendChild(opt);
        });

    } catch (err) {
        console.error("Failed to load branches:", err);
        alert("Error loading branches");
    }
});


// Load students
loadBtn.addEventListener("click", async () => {
    const year = yearSelect.value;
    const branch = branchSelect.value;

    if (!year || !branch) {
        alert("Select Year and Branch");
        return;
    }

    const res = await fetch(`/admin/students?year=${year}&branch=${branch}`);
    const data = await res.json();

    tableBody.innerHTML = "";

    data.forEach(row => {
        tableBody.innerHTML += `
            <tr>
                <td>${row.htno}</td>
                <td>${row.name}</td>
                <td>${row.branch}</td>
                <td>${row.year}</td>
                <td>${row.subject}</td>
                <td contenteditable="true">${row.marks}</td>
                <td>
                    <button onclick="updateMark('${row.id}')">Save</button>
                    <button onclick="deleteMark('${row.id}')">Delete</button>
                </td>
            </tr>
        `;
    });
});

function updateMark(id) {
    alert("Update mark for ID " + id);
}

function deleteMark(id) {
    if (!confirm("Delete this record?")) return;
    alert("Deleted " + id);
}
