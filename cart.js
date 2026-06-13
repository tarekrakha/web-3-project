let cart = JSON.parse(localStorage.getItem("morveniCart") || "[]");

function money(value) { return "$" + Number(value || 0).toFixed(2); }
function saveCart() { localStorage.setItem("morveniCart", JSON.stringify(cart)); }

function renderCart() {
    const cartItems = document.getElementById("cartItems");

    if (cart.length === 0) {
        cartItems.innerHTML = `
            <div class="cart-item">
                <div class="item-info">
                    <h3>Your cart is empty</h3>
                    <p>Shop products and add them here.</p>
                    <a href="season.html" style="color:#A38C55;font-weight:bold;">← Continue Shopping</a>
                </div>
            </div>`;
    } else {
        // Use data-index attributes — avoids stale-index bugs from inline closures
        cartItems.innerHTML = cart.map((item, index) => `
            <div class="cart-item">
                <img src="${item.image || 'pic1.png'}" alt="${item.name}">
                <div class="item-info">
                    <h3>${item.name}</h3>
                    <p>${money(item.price)}</p>
                    <input type="number" value="${item.quantity || 1}" min="1"
                           data-index="${index}" class="qty-input">
                    <button class="remove-btn" data-index="${index}">Remove</button>
                </div>
            </div>
        `).join("");
    }

    const total = cart.reduce((sum, item) =>
        sum + Number(item.price || 0) * Number(item.quantity || 1), 0);
    document.getElementById("cartTotal").textContent = money(total);

    saveCart();
    attachCartEvents();
}

// ── Event delegation instead of inline handlers ───────────────────────────────
function attachCartEvents() {
    document.querySelectorAll(".qty-input").forEach(input => {
        input.addEventListener("change", function () {
            const idx = Number(this.dataset.index);
            cart[idx].quantity = Math.max(1, Number(this.value));
            renderCart();
        });
    });

    document.querySelectorAll(".remove-btn").forEach(btn => {
        btn.addEventListener("click", function () {
            const idx = Number(this.dataset.index);
            cart.splice(idx, 1);
            renderCart();
        });
    });
}

renderCart();
