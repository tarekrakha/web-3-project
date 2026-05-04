let allProducts = [];
let selectedSeason = "Summer";
const seasons = ["Summer", "Spring", "Fall", "Winter"];

function money(value) {
    return "$" + Number(value || 0).toFixed(2);
}

function productImage(product) {
    return product.image || "pic1.png";
}

async function loadCatalog() {
    const res = await fetch("products_api.php");
    const data = await res.json();
    allProducts = data.products || [];
    renderOptions();
    renderCatalog();
}

function renderOptions() {
    const colors = [...new Set(allProducts.map(p => p.color).filter(Boolean))];
    const sizes = [...new Set(allProducts.map(p => p.size).filter(Boolean))];
    document.getElementById("colorOptions").innerHTML = colors.map(c => `<label><input type="checkbox" value="${c}"> ${c}</label>`).join("");
    document.getElementById("sizeOptions").innerHTML = sizes.map(s => `<label><input type="checkbox" value="${s}"> ${s}</label>`).join("");
}

function checkedValues(id) {
    return [...document.querySelectorAll(`#${id} input:checked`)].map(input => input.value);
}

function renderCatalog() {
    const search = document.querySelector(".nav-search input")?.value.toLowerCase() || "";
    const selectedColors = checkedValues("colorOptions");
    const selectedSizes = checkedValues("sizeOptions");
    const sort = document.getElementById("sortSelect").value;

    let list = allProducts.filter(p => (p.category || "").toLowerCase() === selectedSeason.toLowerCase());

    if (search) list = list.filter(p => (p.name || "").toLowerCase().includes(search));
    if (selectedColors.length) list = list.filter(p => selectedColors.includes(p.color));
    if (selectedSizes.length) list = list.filter(p => selectedSizes.includes(p.size));

    if (sort === "low-high") list.sort((a,b) => Number(a.price) - Number(b.price));
    if (sort === "high-low") list.sort((a,b) => Number(b.price) - Number(a.price));

    document.getElementById("seasonBadge").textContent = selectedSeason;
    document.getElementById("seasonTitle").textContent = selectedSeason + " collection";
    document.getElementById("catalogTitle").textContent = selectedSeason + " Collection";
    document.getElementById("catalogCount").textContent = list.length;

    const grid = document.getElementById("catalogGrid");
    if (!list.length) {
        grid.innerHTML = `<div class="empty-state">No products found. Add products from the admin page.</div>`;
        return;
    }

    grid.innerHTML = list.map(product => `
        <div class="product-card">
            <a href="product.html?id=${product.id}"><img src="${productImage(product)}" alt="${product.name}"></a>
            <h3>${product.name}</h3>
            <p>${product.color} • ${product.size}</p>
            <p><b>${money(product.price)}</b></p>
            <button type="button" onclick='addToCart(${JSON.stringify(product)})'>Add to Cart</button>
        </div>
    `).join("");
}

function addToCart(product) {
    let cart = JSON.parse(localStorage.getItem("morveniCart") || "[]");
    const found = cart.find(item => Number(item.id) === Number(product.id));
    if (found) {
        found.quantity = Number(found.quantity || 1) + 1;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: Number(product.price),
            quantity: 1,
            size: product.size,
            color: product.color,
            image: product.image
        });
    }
    localStorage.setItem("morveniCart", JSON.stringify(cart));
    alert("Added to cart");
}

document.querySelectorAll('input[name="season"]').forEach(input => {
    input.addEventListener("change", function() {
        selectedSeason = this.id.charAt(0).toUpperCase() + this.id.slice(1);
        renderCatalog();
    });
});

document.querySelector(".nav-search button")?.addEventListener("click", renderCatalog);
document.querySelector(".nav-search input")?.addEventListener("input", renderCatalog);
document.getElementById("sortSelect").addEventListener("change", renderCatalog);
document.getElementById("colorOptions").addEventListener("change", renderCatalog);
document.getElementById("sizeOptions").addEventListener("change", renderCatalog);
document.getElementById("clearFilters").addEventListener("click", function() {
    document.querySelectorAll('#colorOptions input, #sizeOptions input').forEach(input => input.checked = false);
    document.getElementById("sortSelect").value = "none";
    renderCatalog();
});

document.getElementById("filterBtn").addEventListener("click", () => {
    document.getElementById("filterPanel").classList.add("open");
    document.getElementById("filterBackdrop").hidden = false;
});
document.getElementById("closeFilters").addEventListener("click", () => {
    document.getElementById("filterPanel").classList.remove("open");
    document.getElementById("filterBackdrop").hidden = true;
});

loadCatalog();
