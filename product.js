let currentProduct = null;

function money(value) { return "$" + Number(value || 0).toFixed(2); }
function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem("morveniCart") || "[]");
    document.getElementById("cart-count").textContent = cart.reduce((sum, item) => sum + Number(item.quantity || 1), 0);
}

async function loadProduct() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    if (!id) { updateCartCount(); return; }

    const res = await fetch("products_api.php?action=one&id=" + id);
    const data = await res.json();
    if (!data.product) return;
    currentProduct = data.product;

    document.getElementById("productName").textContent = currentProduct.name;
    document.getElementById("sku").textContent = "SKU: MORV-" + currentProduct.id;
    document.getElementById("productPrice").textContent = money(currentProduct.price);
    document.getElementById("productStatus").textContent = Number(currentProduct.stock) > 0 ? "In Stock" : "Out of Stock";
    document.getElementById("productDescription").textContent = `${currentProduct.category} item in ${currentProduct.color}.`;
    document.getElementById("productImg").src = currentProduct.image || "shirt.jpg";
    document.getElementById("productSize").innerHTML = `<option>${currentProduct.size}</option>`;
    document.getElementById("productColor").innerHTML = `<option>${currentProduct.color}</option>`;
    updateCartCount();
}

function addProductToCart(goCheckout = false) {
    if (!currentProduct) {
        currentProduct = { id: null, name: "Classic White Shirt", price: 29.99, image: "shirt.jpg", size: "Medium", color: "White" };
    }
    const qty = Number(document.getElementById("quantity").value || 1);
    let cart = JSON.parse(localStorage.getItem("morveniCart") || "[]");
    cart.push({
        id: currentProduct.id,
        name: currentProduct.name,
        price: Number(currentProduct.price),
        quantity: qty,
        size: document.getElementById("productSize").value,
        color: document.getElementById("productColor").value,
        image: currentProduct.image
    });
    localStorage.setItem("morveniCart", JSON.stringify(cart));
    updateCartCount();
    if (goCheckout) window.location.href = "checkout.html";
    else alert("Added to cart");
}

document.getElementById("addCart").addEventListener("click", () => addProductToCart(false));
document.getElementById("buyNow").addEventListener("click", () => addProductToCart(true));
loadProduct();
