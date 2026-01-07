/* =========================================================
   SIMS – AUTHENTICATION GUARD (FRONTEND)
   Verifies login + role + ID with backend
========================================================= */

(async function () {

    const LOGIN_PAGE = "/";
    const VERIFY_API = "/verify-session";

    function redirectToLogin() {
        localStorage.clear();
        window.location.replace(LOGIN_PAGE);
    }

    function getUserIdByRole(role) {
        switch (role) {
            case "admin":
                return localStorage.getItem("adminId");
            case "hod":
                return localStorage.getItem("hodId");
            case "faculty":
                return localStorage.getItem("facultyId");
            case "student":
                return localStorage.getItem("studentHtno");
            default:
                return null;
        }
    }

    async function verifySession() {

        const isLoggedIn = localStorage.getItem("isLoggedIn");
        const role = localStorage.getItem("role");
        //console.log("in auth js", isLoggedIn, role);
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
