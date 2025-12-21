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

app.get("/studentProfile/photo/:htno", (req, res) => {

    const { htno } = req.params;

    const query = `
        SELECT profile_photo
        FROM student_profiles
        WHERE htno = ?
        LIMIT 1
    `;

    con.query(query, [htno], (err, rows) => {
        if (err) {
            console.error("Image fetch error:", err);
            return res.status(500).end();
        }

        if (!rows.length || !rows[0].profile_photo) {
            return res.status(204).end(); // No image
        }

        res.setHeader("Content-Type", "image/jpeg");
        res.send(rows[0].profile_photo);
    });
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

        alert(result.message || "Profile saved successfully");

    } catch (err) {
        alert("Failed to save profile");
        console.error(err);
    }
});

profilePhoto.addEventListener("change", e => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size < 20 * 1024 || file.size > 100 * 1024) {
        alert("Image size must be between 20 KB and 100 KB");
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

    const res = await fetch(
        `/studentProfile/photo/${studentHtno}`,
        {
            method: "POST",
            body: fd
        }
    );

    const result = await res.json();
    alert(result.message);
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
