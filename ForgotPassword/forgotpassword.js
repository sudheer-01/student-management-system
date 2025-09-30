document.getElementById("forgotForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const role = document.getElementById("role").value;
  const userId = document.getElementById("userId").value;

  try {
    const response = await fetch("/forgotpassword", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role, userId })
    });

    const data = await response.json();

    if (data.success) {
      document.getElementById("emailSection").classList.remove("hidden");
      document.getElementById("retrievedEmail").value = data.email;
    } else {
      alert(data.message);
    }
  } catch (err) {
    console.error("Error:", err);
    alert("Server error, please try again.");
  }
});

// Send OTP
document.getElementById("sendOtpBtn").addEventListener("click", async function () {
  const email = document.getElementById("retrievedEmail").value;

  try {
    const response = await fetch("/sendOtp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });

    const data = await response.json();

    if (data.success) {
      alert("OTP sent to your email!");
      document.getElementById("otpSection").classList.remove("hidden");
    } else {
      alert(data.message);
    }
  } catch (err) {
    console.error("Error:", err);
    alert("Server error, please try again.");
  }
});

// Reset Password
document.getElementById("resetPasswordBtn").addEventListener("click", async function () {
  const email = document.getElementById("retrievedEmail").value;
  const otp = document.getElementById("otp").value;
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
      body: JSON.stringify({ email, otp, newPassword })
    });

    const data = await response.json();

    if (data.success) {
      alert("Password reset successful!");
      window.location.href = "/";
    } else {
      alert(data.message);
    }
  } catch (err) {
    console.error("Error:", err);
    alert("Server error, please try again.");
  }
});
