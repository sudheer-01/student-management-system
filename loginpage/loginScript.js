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
            // ✅ Save facultyId in localStorage
            localStorage.setItem("facultyId", data.facultyId);

            // Redirect to faculty request page
            window.location.href = data.redirectUrl;
        } else {
            alert(data.message);
        }
    } catch (error) {
        console.error("Error:", error);
        alert("Network error, please try again.");
    }
});
