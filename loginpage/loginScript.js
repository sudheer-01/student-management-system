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
// document.getElementById("teacherForm").addEventListener("submit", async function (e) {
//     e.preventDefault();

//     const facultyId = document.getElementById("facultyId").value;
//     const password = document.getElementById("passwordOfTeacher").value;
//     try {
//         const response = await fetch("/TeacherLogin", {
//             method: "POST",
//             headers: { "Content-Type": "application/json" },
//             body: JSON.stringify({ facultyId: facultyId, passwordOfTeacher: password })
//         });
//         const data = await response.json();

//         if (data.success) {
//             // ✅ Save facultyId in localStorage
//             console.log("Storing facultyId:", data.facultyId);
//             localStorage.setItem("facultyId", data.facultyId);
//             console.log("Login successful, redirecting...", data.redirectUrl);
//             // Redirect to faculty request page
//             window.location.href = data.redirectUrl;
//         } else {
//             alert(data.message);
//         }
//     } catch (error) {
//         console.error("Error:", error);
//         alert("Network error, please try again.");
//     }
// });

document.getElementById("teacherForm").addEventListener("submit", async function (e) {
    e.preventDefault();

    const facultyId = document.getElementById("facultyId").value;
    const password = document.getElementById("passwordOfTeacher").value;

    const res = await fetch("/TeacherLogin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ facultyId, passwordOfTeacher: password })
    });

    const data = await res.json();

    if (!data.success) {
        alert(data.message);
        return;
    }

    /* ✅ THIS IS THE CHECK YOU ASKED FOR */
    if (data.resetRequired) {
        document.getElementById("facultyResetBox").style.display = "block";
        alert("You must reset your password to continue.");
        return;
    }

    // Normal login
    window.location.href = data.redirectUrl;
});

async function resetFacultyPassword() {
    const np = document.getElementById("facultyNewPassword").value;
    const cp = document.getElementById("facultyConfirmPassword").value;

    if (np !== cp) {
        alert("Passwords do not match");
        return;
    }

    await fetch("/reset-password-at-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            role: "faculty",
            id: document.getElementById("facultyId").value,
            newPassword: np
        })
    });

    alert("Password reset successfully. Please login again.");
    location.reload();
}


// document.getElementById("hodForm").addEventListener("submit", async function (e) {
//     e.preventDefault();

//     const HodId = document.getElementById("HodId").value;
//     const passwordOfHod = document.getElementById("passwordOfHod").value;

//     try {
//         const response = await fetch("/loginToHodDashBoard", {
//             method: "POST",
//             headers: { "Content-Type": "application/json" },
//             body: JSON.stringify({ HodId: HodId, passwordOfHod: passwordOfHod })
//         });

//         const data = await response.json();

//         if (data.success) {
//             // ✅ Save HOD details in localStorage
//             console.log("Storing HOD details:", data.hodDetails);
//             localStorage.setItem("hodName", data.hodDetails.hodName);
//             localStorage.setItem("hodBranch", data.hodDetails.hodBranch);
//             localStorage.setItem("hodYears", JSON.stringify(data.hodDetails.hodYears)); // Store as string

//             console.log("Login successful, redirecting...", data.redirectUrl);
//             // Redirect to HOD dashboard page
//             window.location.href = data.redirectUrl;
//         } else {
//             alert(data.message);
//         }
//     } catch (error) {
//         console.error("Error:", error);
//         alert("Invalid HOD ID or Password.");
//     }
// });


document.getElementById("hodForm").addEventListener("submit", async function (e) {
    e.preventDefault();

    const HodId = document.getElementById("HodId").value;
    const password = document.getElementById("passwordOfHod").value;

    const res = await fetch("/loginToHodDashBoard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ HodId, passwordOfHod: password })
    });

    const data = await res.json();

    if (!data.success) {
        alert(data.message);
        return;
    }

    /* ✅ RESET PASSWORD CHECK */
    if (data.resetRequired) {
        document.getElementById("hodResetBox").style.display = "block";
        alert("Reset your password to continue.");
        return;
    }

    window.location.href = data.redirectUrl;
});

// document.getElementById("studentForm").addEventListener("submit", async function (e) {
//     e.preventDefault();

//     const year = document.getElementById("year").value;
//     const htno = document.getElementById("htno").value;

//     try {
//         const response = await fetch("/studentCheckin", {
//             method: "POST",
//             headers: { "Content-Type": "application/json" },
//             body: JSON.stringify({ year: year, htno: htno })
//         });

//         const data = await response.json();

//         if (data.success) {
//             // ✅ Save student details in localStorage
//             localStorage.setItem("studentYear", data.studentDetails.year);
//             localStorage.setItem("studentHtno", data.studentDetails.htno);

//             // ✅ Redirect to marks page
//             window.location.href = data.redirectUrl;
//         } else {
//             alert(data.message || "Invalid HTNO or Year");
//             window.location.href = "/";
//         }
//     } catch (error) {
//         console.error("Error:", error);
//         alert("Network error, please try again.");
//     }
// });

document.getElementById("studentForm").addEventListener("submit", async function (e) {
    e.preventDefault();

    const year = document.getElementById("year").value;
    const htno = document.getElementById("htno").value;
    const password = document.getElementById("studentPassword").value;

    const res = await fetch("/studentCheckin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year, htno, password })
    });

    const data = await res.json();

    if (!data.success) {
        alert(data.message);
        return;
    }

    /* ✅ RESET PASSWORD CHECK */
    if (data.resetRequired) {
        document.getElementById("studentResetBox").style.display = "block";
        alert("You must reset your password.");
        return;
    }

    window.location.href = data.redirectUrl;
});
