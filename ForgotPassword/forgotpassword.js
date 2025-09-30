document.getElementById("forgotForm").addEventListener("submit", async function(e) {
  e.preventDefault();

  const role = document.getElementById("role").value;
  const userId = document.getElementById("userId").value;
  const newPassword = document.getElementById("newPassword").value;
  const confirmPassword = document.getElementById("confirmPassword").value;

  if (newPassword !== confirmPassword) {
    alert("Passwords do not match!");
    return;
  }

  try {
    const response = await fetch("/resetPassword", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role, userId, newPassword })
    });
    const data = await response.json();
    if (data.success) {
      alert("Password updated successfully!");
      window.location.href = "/login.html";
    } else {
      alert(data.message);
    }
  } catch (error) {
    console.error(error);
    alert("Error updating password");
  }
});

document.getElementById("sendOtpBtn").addEventListener("click", async function () {
  const role = document.getElementById("role").value;
  const userId = document.getElementById("userId").value;

  if (!role || !userId) {
    alert("Please select role and enter ID first!");
    return;
  }

  try {
    const response = await fetch("/forgotpassword", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role, userId })
    });
    const data = await response.json();

    if (data.success) {
      document.getElementById("email").value = data.email;
      document.getElementById("otpSection").style.display = "block";
    } else {
      alert(data.message);
    }
  } catch (error) {
    console.error(error);
    alert("Error retrieving email");
  }
});

document.getElementById("verifyOtpBtn").addEventListener("click", async function () {
  const otp = document.getElementById("otp").value;
  const userId = document.getElementById("userId").value;

  try {
    const response = await fetch("/verifyOtp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ otp, userId })
    });
    const data = await response.json();

    if (data.success) {
      document.getElementById("passwordSection").style.display = "block";
    } else {
      alert(data.message || "Invalid OTP");
    }
  } catch (error) {
    console.error(error);
    alert("Error verifying OTP");
  }
});

