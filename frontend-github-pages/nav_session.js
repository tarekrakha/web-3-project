/**
 * nav_session.js
 * Include this on every client-facing page.
 * - If logged in: hides Login/Create Account, shows "Welcome, Name" + Logout
 * - If not logged in: shows Login / Create Account as normal
 */
(async function(){
    try {
        const res  = await fetch(api("session_api.php"), { ...withAuth });
        const data = await res.json();

        const loginLinks  = document.querySelectorAll('a[href="login.html"], a[href="create.html"]');
        const navRight    = document.querySelector(".nav-right");

        if (data.logged_in && navRight) {
            loginLinks.forEach(a => a.parentElement?.removeChild(a));
            navRight.innerHTML =
                `<span class="welcome-msg">Welcome, ${data.first_name}!</span>
                 <a href="order-history.html">My Orders</a>
                 <a href="#" id="logoutLink">Logout</a>`;

            // Logout now calls the Railway backend, then returns home.
            document.getElementById("logoutLink")?.addEventListener("click", async (e) => {
                e.preventDefault();
                try { await fetch(api("logout.php"), { ...withAuth }); } catch(err) {}
                window.location.href = "index.html";
            });
        }
    } catch(e) { /* session_api not available or not on XAMPP — ignore */ }
})();
