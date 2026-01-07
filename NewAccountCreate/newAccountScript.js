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
function isValidEmail(email) {
    // strict email check
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isStrongPassword(password) {
    // min 8 chars, one letter, one number, one special char
    return /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&]).{8,}$/.test(password);
}

function isEmpty(value) {
    return !value || value.trim() === "";
}

function switchTab(role, button) {
    const entiredata = document.querySelectorAll('.allDetails');
    entiredata.forEach(element => element.style.display = 'none');

    const selectedData = document.querySelector(`.${role}`);
    if (selectedData) selectedData.style.display = 'block';

    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(t => t.classList.remove('active'));
    if (button) button.classList.add('active');

    const headingOfHodAndTeacher = document.getElementsByTagName('h2');
    if (role === 'allDetailsOfTeacher') {
        if (headingOfHodAndTeacher[1]) headingOfHodAndTeacher[1].style.display = 'block';
        if (headingOfHodAndTeacher[0]) headingOfHodAndTeacher[0].style.display = 'none';
    } else if (role === 'allDetailsOfHod') {
        if (headingOfHodAndTeacher[0]) headingOfHodAndTeacher[0].style.display = 'block';
        if (headingOfHodAndTeacher[1]) headingOfHodAndTeacher[1].style.display = 'none';
    }
}

// Default tab and password toggles
window.addEventListener('DOMContentLoaded', () => {
    const defaultButton = document.getElementById('teacher');
    if (defaultButton) switchTab('allDetailsOfTeacher', defaultButton);

    document.querySelectorAll('.toggle-password').forEach((btn) => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-target');
            const input = document.getElementById(targetId);
            if (!input) return;
            const isPassword = input.getAttribute('type') === 'password';
            input.setAttribute('type', isPassword ? 'text' : 'password');
            const icon = btn.querySelector('i');
            if (icon) { icon.classList.toggle('fa-eye'); icon.classList.toggle('fa-eye-slash'); }
            btn.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
            input.focus();
        });
    });
});
function toggleBranchVisibility() {
    let yearSelect = document.getElementById("yearOfHod");
    let branchSection = document.getElementById("branchSection");

    branchSection.style.display = (yearSelect.value === "1") ? "none" : "block";
}

document.getElementById("hodSubmitButton").addEventListener("click", function (event) {
    event.preventDefault();

    let yearOfHod = yearOfHod.value;
    let branchOfHod = branchOfHod.value;
    let hodId = hodId.value;
    let hodName = hodName.value.trim().toUpperCase();
    let email = emailOfHod.value.trim();
    let password = passwordOfHod.value;
    let confirm = reEnterPassword.value;

    // ⛔ EMPTY CHECK
    if (
        isEmpty(hodId) ||
        isEmpty(hodName) ||
        isEmpty(email) ||
        isEmpty(password) ||
        isEmpty(confirm)
    ) {
        showMessage("All fields are required.", "error");
        return;
    }

    // ⛔ EMAIL CHECK
    if (!isValidEmail(email)) {
        showMessage("Enter a valid email address.", "error");
        return;
    }

    // ⛔ PASSWORD STRENGTH
    if (!isStrongPassword(password)) {
        showMessage(
            "Password must be at least 8 characters and include letters, numbers, and special characters.",
            "error"
        );
        return;
    }

    // ⛔ PASSWORD MATCH
    if (password !== confirm) {
        showMessage("Passwords do not match.", "error");
        return;
    }

    // ✅ ONLY NOW CALL BACKEND (UNCHANGED)
    fetch("/createHodAccount", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            yearOfHod,
            branchOfHod,
            hodName,
            emailOfHod: email,
            passwordOfHod: password,
            reEnterPassword: confirm,
            hodId
        })
    })
    .then(res => res.json())
    .then(data => {
        showMessage(data.message, data.success ? "success" : "error");
        if (data.success) document.getElementById("hodForm").reset();
    })
    .catch(() => showMessage("Server error. Try again.", "error"));
});

//teacher details
document.getElementById("teacherSubmitButton").addEventListener("click", function (event) {
    event.preventDefault();

    let teacherName = teacherName.value.trim().toUpperCase();
    let facultyId = facultyId.value.trim();
    let email = emailOfTeacher.value.trim();
    let password = passwordOfTeacher.value;
    let confirm = reEnterPasswordTeacher.value;

    if (
        isEmpty(teacherName) ||
        isEmpty(facultyId) ||
        isEmpty(email) ||
        isEmpty(password) ||
        isEmpty(confirm)
    ) {
        showMessage("All fields are required.", "error");
        return;
    }

    if (!isValidEmail(email)) {
        showMessage("Enter a valid email address.", "error");
        return;
    }

    if (!isStrongPassword(password)) {
        showMessage(
            "Password must be at least 8 characters and include letters, numbers, and special characters.",
            "error"
        );
        return;
    }

    if (password !== confirm) {
        showMessage("Passwords do not match.", "error");
        return;
    }

    fetch("/createTeacherAccount", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            teacherName,
            facultyId,
            emailOfTeacher: email,
            passwordOfTeacher: password,
            reEnterPasswordTeacher: confirm
        })
    })
    .then(res => res.json())
    .then(data => {
        showMessage(data.message, data.success ? "success" : "error");
        if (data.success) document.getElementById("teacherForm").reset();
    })
    .catch(() => showMessage("Server error. Try again.", "error"));
});