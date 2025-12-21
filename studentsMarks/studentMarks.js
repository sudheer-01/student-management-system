document.addEventListener("DOMContentLoaded", () => {

    /* =====================================================
       BASIC REFERENCES
    ===================================================== */

    const fetchMarksBtn = document.getElementById("fetchMarksBtn");
    const profileBtn    = document.getElementById("profileBtn");
    const exportCsvBtn  = document.getElementById("exportCsvBtn");
    const printBtn      = document.getElementById("printBtn");
    const logoutBtn     = document.getElementById("logoutBtn");

    const spinner       = document.getElementById("loadingSpinner");
    const statusMessage = document.getElementById("statusMessage");

    const marksWrapper  = document.querySelector(".table-wrapper");
    const marksTable    = document.getElementById("marksTable");
    const studentInfo   = document.getElementById("studentInfo");

    const profileSection = document.getElementById("studentProfile");
    const saveProfileBtn = document.getElementById("saveProfile");

    const studentYear = localStorage.getItem("studentYear");
    const studentHtno = localStorage.getItem("studentHtno");

    if (!studentHtno || !studentYear) {
        alert("Session expired. Please login again.");
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

    fetchMarksBtn.addEventListener("click", async () => {

        showMarksView();
        spinner.classList.remove("hidden");
        setStatus("Fetching your marks...");

        try {
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

        } catch (err) {
            alert("Failed to load marks");
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

        if (p.profile_photo) {
            profilePreview.src = `data:image/jpeg;base64,${p.profile_photo}`;
        }
    });

    /* =====================================================
       PROFILE PHOTO VALIDATION (300–500 KB)
    ===================================================== */

    profilePhoto.addEventListener("change", e => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size < 300 * 1024 || file.size > 500 * 1024) {
            alert("Image size must be between 300 KB and 500 KB");
            e.target.value = "";
            return;
        }

        profilePreview.src = URL.createObjectURL(file);
    });

    /* =====================================================
       SAVE PROFILE
    ===================================================== */

    saveProfileBtn.addEventListener("click", async () => {

        const fd = new FormData();
        fd.append("htno", studentHtno);
        fd.append("full_name", profileName.value);
        fd.append("batch", batch.value);
        fd.append("dob", dob.value);
        fd.append("gender", gender.value);
        fd.append("admission_type", admissionType.value);
        fd.append("current_status", status.value);
        fd.append("student_mobile", studentMobile.value);
        fd.append("email", email.value);
        fd.append("current_address", currentAddress.value);
        fd.append("permanent_address", permanentAddress.value);
        fd.append("father_name", fatherName.value);
        fd.append("mother_name", motherName.value);
        fd.append("parent_mobile", parentMobile.value);
        fd.append("guardian_name", guardianName.value);
        fd.append("guardian_relation", guardianRelation.value);
        fd.append("guardian_mobile", guardianMobile.value);
        fd.append("blood_group", bloodGroup.value);
        fd.append("nationality", nationality.value);
        fd.append("religion", religion.value);

        if (profilePhoto.files[0]) {
            fd.append("profile_photo", profilePhoto.files[0]);
        }

        const res = await fetch("/studentProfile/save", {
            method: "POST",
            body: fd
        });

        const result = await res.json();
        alert(result.message || "Profile saved");
    });

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

    printBtn.addEventListener("click", () => window.print());

    /* =====================================================
       LOGOUT
    ===================================================== */

    logoutBtn.addEventListener("click", () => {
        if (!confirm("Log out?")) return;
        fetch("/logout", { method: "POST" })
            .finally(() => window.location.href = "/");
    });

});
