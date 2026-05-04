let cart = JSON.parse(localStorage.getItem("morveniCart") || "[]");
if (cart.length === 0) {
    cart = [
        { id: null, name: "White Shirt", quantity: 1, price: 30, image: "shirt.jpg" },
        { id: null, name: "Blue Jeans", quantity: 1, price: 50, image: "jeans.jpg" }
    ];
}

function money(value) { return "$" + Number(value || 0).toFixed(2); }
function saveCart(){ localStorage.setItem("morveniCart", JSON.stringify(cart)); }

function renderCart() {
    const cartItems = document.getElementById("cartItems");
    if (cart.length === 0) {
        cartItems.innerHTML = '<div class="cart-item"><div class="item-info"><h3>Your cart is empty</h3><p>Shop products and add them here.</p></div></div>';
    } else {
        cartItems.innerHTML = cart.map((item, index) => `
            <div class="cart-item">
                <img src="${item.image || 'shirt.jpg'}" alt="${item.name}">
                <div class="item-info">
                    <h3>${item.name}</h3>
                    <p>${money(item.price)}</p>
                    <input type="number" value="${item.quantity || 1}" min="1" onchange="updateQty(${index}, this.value)">
                    <button class="remove-btn" onclick="removeItem(${index})">Remove</button>
                </div>
            </div>
        `).join("");
    }
    const total = cart.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 1), 0);
    document.getElementById("cartTotal").textContent = money(total);
    saveCart();
}

function updateQty(index, qty) {
    cart[index].quantity = Number(qty);
    renderCart();
}

function removeItem(index) {
    cart.splice(index, 1);
    renderCart();
}

renderCart();
