/* =========================================================
   SIMS – AUTHENTICATION GUARD (FRONTEND)
   Verifies login + role + ID with backend
========================================================= */

(async function () {

    const LOGIN_PAGE = "/login.html";
    const VERIFY_API = "/api/auth/verify-session";

    function redirectToLogin() {
        localStorage.clear();
        window.location.replace(LOGIN_PAGE);
    }

    function getUserIdByRole(role) {
        switch (role) {
            case "ADMIN":
                return localStorage.getItem("adminId");
            case "HOD":
                return localStorage.getItem("hodId");
            case "FACULTY":
                return localStorage.getItem("facultyId");
            case "STUDENT":
                return localStorage.getItem("studentId");
            default:
                return null;
        }
    }

    async function verifySession() {

        const isLoggedIn = localStorage.getItem("isLoggedIn");
        const role = localStorage.getItem("role");

        if (isLoggedIn !== "true" || !role) {
            redirectToLogin();
            return;
        }

        const userId = getUserIdByRole(role);

        if (!userId) {
            redirectToLogin();
            return;
        }

        try {
            const response = await fetch(VERIFY_API, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    role,
                    userId
                })
            });

            if (!response.ok) {
                redirectToLogin();
                return;
            }

            const result = await response.json();

            if (!result.valid) {
                redirectToLogin();
            }

        } catch (error) {
            console.error("Auth verification failed:", error);
            redirectToLogin();
        }
    }

    // Run on normal load
    await verifySession();

    // Run again on back / forward navigation
    window.addEventListener("pageshow", verifySession);

})();
