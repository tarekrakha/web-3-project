let currentProduct = null;

function money(value) { return "$" + Number(value || 0).toFixed(2); }

function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem("morveniCart") || "[]");
    document.getElementById("cart-count").textContent =
        cart.reduce((sum, item) => sum + Number(item.quantity || 1), 0);
}

// ── Toast notification (replaces alert) ──────────────────────────────────────
function showToast(msg) {
    let toast = document.getElementById("cartToast");
    if (!toast) {
        toast = document.createElement("div");
        toast.id = "cartToast";
        document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.add("toast-show");
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.classList.remove("toast-show"), 2400);
}

// ── Load product from API ─────────────────────────────────────────────────────
async function loadProduct() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");

    // Disable buttons until product is confirmed loaded
    document.getElementById("addCart").disabled = true;
    document.getElementById("buyNow").disabled  = true;

    if (!id) { updateCartCount(); return; }

    const res  = await fetch(api("products_api.php?action=one&id=" + id), { ...withAuth });
    const data = await res.json();
    if (!data.product) return;

    currentProduct = data.product;

    document.getElementById("productName").textContent        = currentProduct.name;
    document.getElementById("sku").textContent                = "SKU: MORV-" + currentProduct.id;
    document.getElementById("productPrice").textContent       = money(currentProduct.price);
    document.getElementById("productStatus").textContent      = Number(currentProduct.stock) > 0 ? "In Stock" : "Out of Stock";
    document.getElementById("productDescription").textContent = `${currentProduct.category} item in ${currentProduct.color}.`;
    document.getElementById("productImg").src                 = currentProduct.image || "pic1.png";
    document.getElementById("productSize").innerHTML          = `<option>${currentProduct.size}</option>`;
    document.getElementById("productColor").innerHTML         = `<option>${currentProduct.color}</option>`;

    // Enable buttons only once a real product is loaded
    document.getElementById("addCart").disabled = false;
    document.getElementById("buyNow").disabled  = false;

    updateCartCount();
}

// ── Add to cart ───────────────────────────────────────────────────────────────
function addProductToCart(goCheckout = false) {
    if (!currentProduct) return; // buttons are disabled, but guard just in case

    const qty = Math.max(1, Number(document.getElementById("quantity").value || 1));
    let cart  = JSON.parse(localStorage.getItem("morveniCart") || "[]");

    cart.push({
        id:       currentProduct.id,
        name:     currentProduct.name,
        price:    Number(currentProduct.price),
        quantity: qty,
        size:     document.getElementById("productSize").value,
        color:    document.getElementById("productColor").value,
        image:    currentProduct.image
    });

    localStorage.setItem("morveniCart", JSON.stringify(cart));
    updateCartCount();

    if (goCheckout) {
        window.location.href = "checkout.html";
    } else {
        showToast("✓ Added to cart");
    }
}

document.getElementById("addCart").addEventListener("click", () => addProductToCart(false));
document.getElementById("buyNow").addEventListener("click", () => addProductToCart(true));
loadProduct();
