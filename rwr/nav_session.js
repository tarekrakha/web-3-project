/**
 * nav_session.js
 * Include this on every client-facing page.
 * - If logged in: hides Login/Create Account, shows "Welcome, Name" + Logout
 * - If not logged in: shows Login / Create Account as normal
 */
(async function(){
    try {
        const res  = await fetch("session_api.php");
        const data = await res.json();

        const loginLinks  = document.querySelectorAll('a[href="login.html"], a[href="create.html"]');
        const navRight    = document.querySelector(".nav-right");

        if (data.logged_in && navRight) {
            loginLinks.forEach(a => a.parentElement?.removeChild(a));
            navRight.innerHTML =
                `<span class="welcome-msg">Welcome, ${data.first_name}!</span>
                 <a href="order-history.html">My Orders</a>
                 <a href="logout.php">Logout</a>`;
        }
    } catch(e) { /* session_api not available or not on XAMPP — ignore */ }
})();
