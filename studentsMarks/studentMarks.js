document.addEventListener("DOMContentLoaded", function () {
    const fetchMarksBtn = document.getElementById("fetchMarksBtn");
    const spinner = document.getElementById("loadingSpinner");
    const statusMessage = document.getElementById("statusMessage");
    const exportCsvBtn = document.getElementById("exportCsvBtn");
    const printBtn = document.getElementById("printBtn");
    const logoutBtn = document.getElementById("logoutBtn");

    if (!fetchMarksBtn) {
        console.error("fetchMarksBtn not found!");
        return;
    }

    fetchMarksBtn.addEventListener("click", function () {
        if (spinner) spinner.classList.remove("hidden");
        if (statusMessage) {
            statusMessage.textContent = "Fetching your marks...";
            statusMessage.classList.remove("hidden");
        }
        fetchMarksBtn.disabled = true;

        fetch("/studentDashboard", { method: "POST" })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                if (!data || !data.subjects || data.subjects.length === 0) {
                    if (statusMessage) {
                        statusMessage.textContent = "Invalid HTNO or Year. Redirecting...";
                    } else {
                        alert("Invalid HTNO or Year");
                    }
                    setTimeout(() => { window.location.href = "/"; }, 1200);
                    return;
                }

                // Update student information section
                document.getElementById("studentInfo").innerHTML = `
                    <p><strong>Name:</strong> ${data.name}</p>
                    <p><strong>HTNO:</strong> ${data.htno}</p>
                    <p><strong>Branch:</strong> ${data.branch}</p>
                    <p><strong>Year:</strong> ${data.year}</p>
                `;

                // Extract exam names dynamically
                let examSet = new Set();
                data.subjects.forEach(subject => {
                    Object.keys(subject.marks).forEach(exam => {
                        let formattedExam = exam.replace(/_/g, " ");
                        examSet.add(formattedExam);
                    });
                });

                // Convert Set to an array and sort
                let examList = Array.from(examSet).sort();

                // Generate header row dynamically
                let headerRow = `<th class=\"col-subject\">Subject</th>`;
                examList.forEach(exam => {
                    headerRow += `<th>${exam}</th>`;
                });
                document.getElementById("examHeaders").innerHTML = headerRow;

                // Populate table body
                const marksBody = document.getElementById("marksBody");
                marksBody.innerHTML = "";
                data.subjects.forEach(subject => {
                    let row = `<tr><td class=\"subject\">${subject.subject}</td>`;

                    examList.forEach(exam => {
                        let examKey = exam.replace(/ /g, "_");
                        let raw = subject.marks[examKey];
                        if (raw === undefined || raw === null || raw === "" || raw === "N/A") {
                            row += `<td><span class="badge">N/A</span></td>`;
                        } else if (!isNaN(parseFloat(raw))) {
                            const value = parseFloat(raw);
                            row += `<td class="num">${value}</td>`;
                        } else {
                            row += `<td>${raw}</td>`;
                        }
                    });
                    row += "</tr>";
                    marksBody.innerHTML += row;
                });

                // Show the marks table
                document.getElementById("marksTable").style.display = "table";
                const wrapper = document.querySelector('.table-wrapper');
                if (wrapper) wrapper.classList.remove('hidden');

                if (statusMessage) {
                    statusMessage.textContent = "Marks loaded successfully.";
                    setTimeout(() => statusMessage.classList.add("hidden"), 1500);
                }
            })
            .catch(error => {
                if (statusMessage) {
                    statusMessage.textContent = "Error retrieving data. Please try again later.";
                    statusMessage.classList.remove("hidden");
                } else {
                    alert("Error retrieving data. Please try again later.");
                }
            })
            .finally(() => {
                if (spinner) spinner.classList.add("hidden");
                fetchMarksBtn.disabled = false;
            });
    });
    // Export CSV from current table
    if (exportCsvBtn) {
        exportCsvBtn.addEventListener("click", function () {
            const table = document.getElementById("marksTable");
            if (!table || table.style.display === "none") return;
            const rows = Array.from(table.querySelectorAll("tr"));
            const data = rows.map(tr => {
                return Array.from(tr.querySelectorAll("th,td")).map(cell => {
                    const text = cell.textContent.replace(/\s+/g, " ").trim();
                    // Wrap in quotes and escape quotes
                    return '"' + text.replace(/"/g, '""') + '"';
                }).join(",");
            }).join("\n");

            const blob = new Blob([data], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "student-marks.csv";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        });
    }

    // Print
    if (printBtn) {
        printBtn.addEventListener("click", function () {
            window.print();
        });
    }

    // logout
    if (logoutBtn) {
        logoutBtn.addEventListener("click", function () {
            if (!confirm("Log out?")) return;
            fetch("/logout", { method: "POST" })
                .then(() => { window.location.href = "/"; })
                .catch(() => { window.location.href = "/"; });
        });
    }
});
