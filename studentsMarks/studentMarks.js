function showMessage(message, type = "info", autoHide = true) {
    const msgEl = document.getElementById("uiMessage");
    if (!msgEl) return;

    msgEl.textContent = message;
    msgEl.className = `ui-message ${type}`;
    msgEl.classList.remove("hidden");

    if (autoHide) {
        setTimeout(() => {
            msgEl.classList.add("hidden");
        }, 3000);
    }
}

document.addEventListener("DOMContentLoaded", () => {

    /* =====================================================
       BASIC REFERENCES
    ===================================================== */

    const fetchMarksBtn = document.getElementById("fetchMarksBtn");
    const profileBtn    = document.getElementById("profileBtn");
    const exportCsvBtn  = document.getElementById("exportCsvBtn");
    const printBtn      = document.getElementById("printBtn");

    const spinner       = document.getElementById("loadingSpinner");
    const statusMessage = document.getElementById("statusMessage");

    const marksWrapper  = document.querySelector(".table-wrapper");
    const marksTable    = document.getElementById("marksTable");
    const studentInfo   = document.getElementById("studentInfo");

    const profileSection = document.getElementById("studentProfile");
    const saveProfileBtn = document.getElementById("saveProfile");

    const studentHtno = localStorage.getItem("studentHtno");

    if (!studentHtno) {
        showMessage("Session expired. Please login again.", "error");
        window.location.href = "/";
        return;
    }

    /* =====================================================
       HELPER FUNCTIONS
    ===================================================== */

    function showMarksView() {
        profileSection.classList.add("hidden");
        marksWrapper.classList.remove("hidden");
    }

    function showProfileView() {
        marksWrapper.classList.add("hidden");
        profileSection.classList.remove("hidden");
    }

    function setStatus(msg) {
        statusMessage.textContent = msg;
        statusMessage.classList.remove("hidden");
        setTimeout(() => statusMessage.classList.add("hidden"), 1500);
    }

    /* =====================================================
       GET YOUR MARKS
    ===================================================== */
    //get student year from server
   async function fetchAndStoreStudentYear() {
    try {
        const res = await fetch(`/api/studentyear/${studentHtno}`);
        const data = await res.json();

        if (!data.success) {
            showMessage(data.message || "Failed to fetch student year", "error");
            return null;
        }

        localStorage.setItem("studentYear", data.year);
        return data.year;

    } catch (error) {
        console.error(error);
        showMessage("Network error while fetching student year", "error");
        return null;
    }
    }

    fetchMarksBtn.addEventListener("click", async () => {

        showMarksView();
        spinner.classList.remove("hidden");
        setStatus("Fetching your marks...");

        try {
            let studentYear = localStorage.getItem("studentYear");

            // fetch ONLY if not present
            if (!studentYear) {
                studentYear = await fetchAndStoreStudentYear();
            }

            if (!studentYear) {
                throw new Error("Student year not available");
            }

            const res = await fetch(`/studentDashboard/${studentYear}/${studentHtno}`, {
                method: "POST"
            });
            const data = await res.json();

            if (!data || !data.subjects || data.subjects.length === 0) {
                throw new Error("Invalid data");
            }

            studentInfo.innerHTML = `
                <p><strong>Name:</strong> ${data.name}</p>
                <p><strong>HTNO:</strong> ${data.htno}</p>
                <p><strong>Branch:</strong> ${data.branch}</p>
                <p><strong>Year:</strong> ${data.year}</p>
            `;

            // ---------- Build exam headers ----------
            const examSet = new Set();
            data.subjects.forEach(s =>
                Object.keys(s.marks).forEach(e => examSet.add(e.replace(/_/g, " ")))
            );
            const exams = Array.from(examSet).sort();

            document.getElementById("examHeaders").innerHTML =
                `<th class="col-subject">Subject</th>` +
                exams.map(e => `<th>${e}</th>`).join("");

            // ---------- Table body ----------
            const body = document.getElementById("marksBody");
            body.innerHTML = "";

            data.subjects.forEach(s => {
                let row = `<tr><td class="subject">${s.subject}</td>`;
                exams.forEach(ex => {
                    const key = ex.replace(/ /g, "_");
                    const v = s.marks[key];
                    row += `<td>${v ?? `<span class="badge">N/A</span>`}</td>`;
                });
                row += "</tr>";
                body.innerHTML += row;
            });

            marksTable.style.display = "table";
            setStatus("Marks loaded successfully");
            // === Enable marks operations immediately ===
            marksOps.classList.remove("hidden");
            buildExamCheckboxes();


        } catch (err) {
            showMessage("Failed to load marks. Please try again.", "error");
            console.error(err);
        } finally {
            spinner.classList.add("hidden");
        }
    });

    /* =====================================================
       STUDENT PROFILE (NO DEPENDENCY ON MARKS)
    ===================================================== */

    profileBtn.addEventListener("click", async () => {

        showProfileView();

        // ----- BASIC INFO -----
        const basic = await fetch(`/studentBasic/${studentHtno}`).then(r => r.json());

        profileName.value = basic.name;
        profileHtno.value = basic.htno;

        // ----- PROFILE DATA -----
        const res = await fetch(`/studentProfile/${studentHtno}`);
        const data = await res.json();

        if (!data.exists) return;

        const p = data.profile;

        batch.value = p.batch || "";
        if (p.dob) {
            const d = new Date(p.dob);
            dob.value = d.toISOString().split("T")[0]; // YYYY-MM-DD
        } else {
            dob.value = "";
        }
        gender.value = p.gender || "";
        admissionType.value = p.admission_type || "";
        cstatus.value = p.current_status || "Active";

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

        if (p.profile_photo) {
            profilePreview.src = `/studentProfile/photo/${studentHtno}`;
        }
    });



    /* =====================================================
       SAVE PROFILE
    ===================================================== */

   saveProfileBtn.addEventListener("click", async () => {
    const currentStatus = cstatus.value || "Active";
    const payload = {
        htno: studentHtno,
        full_name: profileName.value,
        batch: batch.value,
        dob: dob.value,
        gender: gender.value,
        admission_type: admissionType.value,
        current_status: currentStatus,

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

    try {
        const res = await fetch("/studentProfile/save", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        const result = await res.json();
        await uploadProfilePhoto();

        showMessage(result.message || "Profile saved successfully", "success");

    } catch (err) {
        showMessage("Failed to save profile. Please try again.", "error");
        console.error(err);
    }
});

profilePhoto.addEventListener("change", e => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size < 20 * 1024 || file.size > 100 * 1024) {
        showMessage("Image size must be between 20 KB and 100 KB", "error");
        e.target.value = "";
        return;
    }

    profilePreview.src = URL.createObjectURL(file);
});

async function uploadProfilePhoto() {

    const file = profilePhoto.files[0];
    if (!file) return;

    const fd = new FormData();
    fd.append("profile_photo", file);

    const res = await fetch(`/studentProfile/photo/${studentHtno}`, {
        method: "POST",
        body: fd
    });

    if (!res.ok) {
        const text = await res.text();
        console.error("Upload failed:", text);
        showMessage("Image upload failed.", "error");
        return;
    }

    const result = await res.json();
    showMessage(result.message || "Image uploaded successfully", "success");
}

    /* =====================================================
       EXPORT CSV
    ===================================================== */

    exportCsvBtn.addEventListener("click", () => {
        if (marksTable.style.display === "none") return;

        const rows = [...marksTable.querySelectorAll("tr")];
        const csv = rows.map(r =>
            [...r.children].map(c => `"${c.innerText.trim()}"`).join(",")
        ).join("\n");

        const blob = new Blob([csv], { type: "text/csv" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "student-marks.csv";
        a.click();
    });

    /* =====================================================
       PRINT
    ===================================================== */

    printBtn.addEventListener("click", function () {

    // Collect student details
    const info = document.getElementById("studentInfo").querySelectorAll("p");

    const name   = info[0]?.innerText.replace("Name:", "").trim();
    const htno   = info[1]?.innerText.replace("HTNO:", "").trim();
    const branch = info[2]?.innerText.replace("Branch:", "").trim();
    const year   = info[3]?.innerText.replace("Year:", "").trim();

    // Marks table
    const tableHTML = document.getElementById("marksTable").outerHTML;

    const win = window.open("", "_blank");

    win.document.write(`
        <html>
        <head>
            <title>Student Marks</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    text-align: center;
                }

                img {
                    width: 100%;
                    height: auto;
                    max-height: 150px;
                    object-fit: contain;
                    margin-bottom: 15px;
                }

                h2 {
                    margin: 10px 0;
                }

                .meta {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 10px;
                    font-weight: bold;
                    margin-bottom: 20px;
                    text-align: left;
                }

                table {
                    width: 100%;
                    border-collapse: collapse;
                }

                th, td {
                    border: 1px solid #000;
                    padding: 8px;
                    text-align: center;
                }

                th {
                    background: #f0f0f0;
                }
            </style>
        </head>

        <body>

            <!-- OPTIONAL LOGO -->
            <!-- <img src="balaji.png" alt="College Logo"> -->

            <h2>Student Marks</h2>

            <div class="meta">
                <div>Name: ${name}</div>
                <div>HTNO: ${htno}</div>
                <div>Branch: ${branch}</div>
                <div>Year: ${year}</div>
            </div>

            ${tableHTML}

        </body>
        </html>
    `);

    win.document.close();
    win.print();
});


    /* =====================================================
       LOGOUT
    ===================================================== */

    const logoutBtn = document.getElementById("logoutBtn");
    // logout
    if (logoutBtn) {
    logoutBtn.addEventListener("click", async function () {

        const role = localStorage.getItem("role");
        const userId = localStorage.getItem("studentHtno");

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

});


/* =====================================================
   STUDENT MARKS – SUM / AVERAGE COLUMN ADDER
===================================================== */

const marksOps        = document.getElementById("marksOps");
const examCheckboxes  = document.getElementById("examCheckboxes");
const addColumnBtn    = document.getElementById("addColumnBtn");
const newColumnInput  = document.getElementById("newColumnName");
const operationSelect = document.getElementById("operationType");

/* Build checkboxes after marks load */
function buildExamCheckboxes() {
  examCheckboxes.innerHTML = "";

  const headers = document.querySelectorAll("#examHeaders th");

  headers.forEach((th, index) => {
    if (index === 0) return; // skip Subject

    // ❌ Skip derived columns (SUM / AVG / custom)
    if (th.dataset.derived === "true") return;

    const label = document.createElement("label");

    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.value = index;

    label.appendChild(cb);
    label.appendChild(document.createTextNode(" " + th.innerText));
    examCheckboxes.appendChild(label);
  });
}

/* Inject column */
addColumnBtn.addEventListener("click", () => {

  const selectedCols = [...examCheckboxes.querySelectorAll("input:checked")]
    .map(cb => Number(cb.value));

  const colName = newColumnInput.value.trim();
  const operation = operationSelect.value;

  if (!colName || !operation || selectedCols.length === 0) {
    showMessage("Select columns, operation, and column name", "error");
    return;
  }

  const headerRow = document.getElementById("examHeaders");
  headerRow.insertAdjacentHTML(
    "beforeend",
    `<th data-derived="true">${colName}</th>`
    );


  document.querySelectorAll("#marksBody tr").forEach(row => {
    let sum = 0;
    let count = 0;

    selectedCols.forEach(idx => {
      const cell = row.children[idx];
      const val = parseFloat(cell?.innerText);
      if (!isNaN(val)) {
        sum += val;
        count++;
      }
    });

    const result =
      operation === "average" && count > 0
        ? (sum / count).toFixed(2)
        : sum;

    row.insertAdjacentHTML("beforeend", `<td>${result}</td>`);
  });

  // 🔥 IMPORTANT: rebuild checkbox list immediately
  buildExamCheckboxes();

  showMessage(`Column "${colName}" added successfully`, "success");
});


