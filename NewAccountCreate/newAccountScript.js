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
    event.preventDefault(); // Prevent default form submission

    // Get form values
    let yearOfHod = document.getElementById("yearOfHod").value;
    let branchOfHod = document.getElementById("branchOfHod").value;
    let hodName = document.getElementById("hodName").value.toUpperCase();
    let emailOfHod = document.getElementById("emailOfHod").value;
    let passwordOfHod = document.getElementById("passwordOfHod").value;
    let reEnterPassword = document.getElementById("reEnterPassword").value;
    let hodId = document.getElementById("hodId").value;

    if (passwordOfHod !== reEnterPassword) {
        alert("Passwords do not match.");
        return;
    }

    // Send data to backend using fetch
    fetch("/createHodAccount", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            yearOfHod: yearOfHod,
            branchOfHod: branchOfHod,
            hodName: hodName,
            emailOfHod: emailOfHod,
            passwordOfHod: passwordOfHod,
            reEnterPassword: reEnterPassword,
            hodId: hodId
        })
    })
    .then(response => response.json())
    .then(data => {
        alert(data.message); // Show success or error message
        if (data.success) {
            document.getElementById("hodForm").reset(); // Reset form on success
        }
    })
    .catch(error => {
        console.error("Error:", error);
        alert("An error occurred. Please try again.");
    });
});

//teacher details
document.getElementById("teacherSubmitButton").addEventListener("click", function (event) {
    event.preventDefault(); // Prevent default form submission

    let teacherName = document.getElementById("teacherName").value.toUpperCase();
    console.log("teacherName:", teacherName);
    let facultyId = document.getElementById("facultyId").value;
    let emailOfTeacher = document.getElementById("emailOfTeacher").value;
    let passwordOfTeacher = document.getElementById("passwordOfTeacher").value;
    let reEnterPasswordTeacher = document.getElementById("reEnterPasswordTeacher").value;

    if (passwordOfTeacher !== reEnterPasswordTeacher) { // FIXED THIS LINE
        alert("Passwords do not match.");
        return;
    }

    // Send data to backend using fetch
    fetch("/createTeacherAccount", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            teacherName: teacherName,
            facultyId: facultyId,
            emailOfTeacher: emailOfTeacher,
            passwordOfTeacher: passwordOfTeacher,
            reEnterPasswordTeacher: reEnterPasswordTeacher
        })
    })
    .then(response => response.json())
    .then(data => {
        alert(data.message); // Show success or error message
        if (data.success) {
            document.getElementById("teacherForm").reset(); // Reset form on success
        }
    })
    .catch(error => {
        console.error("Error:", error);
        alert("An error occurred. Please try again.");
    });
});
