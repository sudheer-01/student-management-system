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

function switchTab(role, button) {
  const sections = document.querySelectorAll('.allDetails');
  sections.forEach((element) => { element.style.display = 'none'; });

  const selectedSection = document.querySelector(`.${role}`);
  if (selectedSection) selectedSection.style.display = 'block';

  const buttons = document.querySelectorAll('.tab-btn');
  buttons.forEach((b) => b.classList.remove('active'));
  if (button) button.classList.add('active');
}
// Default selection on load: show Teacher by default
window.addEventListener('DOMContentLoaded', () => {
  const defaultButton = document.getElementById('teacher');
  if (defaultButton) {
    switchTab('allDetailsOfTeacher', defaultButton);
  }
  // Setup password toggles
  document.querySelectorAll('.toggle-password').forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-target');
      const input = document.getElementById(targetId);
      if (!input) return;
      const isPassword = input.getAttribute('type') === 'password';
      input.setAttribute('type', isPassword ? 'text' : 'password');
      const icon = btn.querySelector('i');
      if (icon) {
        icon.classList.toggle('fa-eye');
        icon.classList.toggle('fa-eye-slash');
      }
      btn.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
      input.focus();
    });
  });
});

document.getElementById("teacherForm").addEventListener("submit", async function (e) {
    e.preventDefault();

    const facultyId = document.getElementById("facultyId").value;
    const password = document.getElementById("passwordOfTeacher").value;
    try {
        const response = await fetch("/TeacherLogin", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ facultyId: facultyId, passwordOfTeacher: password })
        });
        const data = await response.json();

        if (data.success) {
            localStorage.setItem("facultyId", data.facultyId);
            localStorage.setItem("isLoggedIn", data.isLoggedIn);
            localStorage.setItem("role", data.role);
            // Redirect to faculty request page
            window.location.href = data.redirectUrl;
        } else {
            showMessage(data.message, "info");
        }
    } catch (error) {
        //console.error("Error:", error);
        showMessage("Network error, please try again.", "error");
    }
});

document.getElementById("hodForm").addEventListener("submit", async function (e) {
    e.preventDefault();

    const HodId = document.getElementById("HodId").value;
    const passwordOfHod = document.getElementById("passwordOfHod").value;

    try {
        const response = await fetch("/loginToHodDashBoard", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ HodId: HodId, passwordOfHod: passwordOfHod })
        });

        const data = await response.json();

        if (data.success) {
            // Save HOD details in localStorage
            localStorage.setItem("hodName", data.hodDetails.hodName);
            localStorage.setItem("hodBranch", data.hodDetails.hodBranch);
            localStorage.setItem("hodYears", JSON.stringify(data.hodDetails.hodYears)); // Store as string
            localStorage.setItem("hodId", data.hodId);
            localStorage.setItem("isLoggedIn", data.isLoggedIn);
            localStorage.setItem("role", data.role);
            // Redirect to HOD dashboard page
            window.location.href = data.redirectUrl;
        } else {
            showMessage(data.message, "info");
        }
    } catch (error) {
        //console.error("Error:", error);
        showMessage("Invalid HOD ID or Password.", "error");
    }
});

document.getElementById("studentForm").addEventListener("submit", async function (e) {
    e.preventDefault();

    const htno = document.getElementById("htno").value;
    const password = document.getElementById("studentPassword").value;

    try {
        const response = await fetch("/studentCheckin", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ htno: htno, password: password })
        });

        const data = await response.json();

        if (data.success) {
            // Save student details in localStorage
            localStorage.setItem("studentHtno", data.studentDetails.htno);
            localStorage.setItem("isLoggedIn", data.isLoggedIn);
            localStorage.setItem("role", data.role);

            // Redirect to marks page
            window.location.href = data.redirectUrl;
        } else {
            showMessage(data.message || "Invalid HTNO", "info");
            window.location.href = "/";
        }
    } catch (error) {
       //console.error("Error:", error);
        showMessage("Network error, please try again.", "error");
    }
});

document.getElementById("adminForm").addEventListener("submit", async function (e) {
    e.preventDefault();

    const idOfAdmin = document.getElementById("idOfAdmin").value;
    const passwordOfAdmin = document.getElementById("passwordOfAdmin").value;   
    try {
        const response = await fetch("/adminLogin", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idOfAdmin: idOfAdmin, passwordOfAdmin: passwordOfAdmin })
        });

        const data = await response.json();
        if (data.success) {
            localStorage.setItem("adminId", data.adminId);
            localStorage.setItem("isLoggedIn", data.isLoggedIn);
            localStorage.setItem("role", data.role);
            // Redirect to admin dashboard
            window.location.href = data.redirectUrl;
        } else {
            showMessage(data.message, "info");
        }
    } catch (error) {
        //console.error("Error:", error);
        showMessage("Invalid Admin ID or Password.", "error");
    }
});
