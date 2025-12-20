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
        const studentYear = localStorage.getItem("studentYear");
        const studentHtno = localStorage.getItem("studentHtno");
        fetch(`/studentDashboard/${studentYear}/${studentHtno}`, { method: "POST" })
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

const profileBtn = document.getElementById("profileBtn");
const profileSection = document.getElementById("studentProfile");

if (profileBtn) {
    profileBtn.addEventListener("click", () => {
        profileSection.classList.toggle("hidden");

        // Auto-fill from already loaded student info
        const nameText = document.querySelector("#studentInfo p:nth-child(1)")?.textContent;
        const htnoText = document.querySelector("#studentInfo p:nth-child(2)")?.textContent;

        if (nameText && htnoText) {
            document.getElementById("profileName").value = nameText.replace("Name:", "").trim();
            document.getElementById("profileHtno").value = htnoText.replace("HTNO:", "").trim();
        }
    });
}

const saveBtn = document.querySelector("#studentProfile button");

profileBtn.addEventListener("click", async () => {
    profileSection.classList.toggle("hidden");

    const htno = document.getElementById("profileHtno").value;
    if (!htno) return;

    const res = await fetch(`/studentProfile/${htno}`);
    const data = await res.json();

    if (data.exists) {
        const p = data.profile;

        batch.value = p.batch || "";
        dob.value = p.dob || "";
        gender.value = p.gender || "";
        admissionType.value = p.admission_type || "";
        status.value = p.current_status || "Active";

        studentMobile.value = p.student_mobile || "";
        email.value = p.email || "";
        currentAddress.value = p.current_address || "";
        permanentAddress.value = p.permanent_address || "";

        fatherName.value = p.father_name || "";
        motherName.value = p.mother_name || "";
        parentMobile.value = p.parent_mobile || "";

        guardianName.value = p.guardian_name || "";
        guardianRelation.value = p.guardian_relation || "";
        guardianMobile.value = p.guardian_mobile || "";

        bloodGroup.value = p.blood_group || "";
        nationality.value = p.nationality || "";
        religion.value = p.religion || "";
    }
});
saveBtn.addEventListener("click", async () => {
    const payload = {
        htno: profileHtno.value,
        full_name: profileName.value,
        branch: document.querySelector("#studentInfo p:nth-child(3)")?.textContent.replace("Branch:", "").trim(),
        year: document.querySelector("#studentInfo p:nth-child(4)")?.textContent.replace("Year:", "").trim(),

        batch: batch.value,
        dob: dob.value,
        gender: gender.value,
        admission_type: admissionType.value,
        current_status: status.value,

        student_mobile: studentMobile.value,
        email: email.value,
        current_address: currentAddress.value,
        permanent_address: permanentAddress.value,

        father_name: fatherName.value,
        mother_name: motherName.value,
        parent_mobile: parentMobile.value,

        guardian_name: guardianName.value,
        guardian_relation: guardianRelation.value,
        guardian_mobile: guardianMobile.value,

        blood_group: bloodGroup.value,
        nationality: nationality.value,
        religion: religion.value
    };

    const res = await fetch("/studentProfile/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });

    const result = await res.json();
    alert(result.message || "Profile saved");
});
