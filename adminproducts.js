let products = [];

const form = document.getElementById("productForm");
const message = document.getElementById("message");
const preview = document.getElementById("preview");

function money(value) {
    return "$" + Number(value || 0).toFixed(2);
}

function showMessage(text, ok = true) {
    message.textContent = text;
    message.className = ok ? "message success" : "message error";
}

function clearForm() {
    form.reset();
    document.getElementById("productId").value = "";
    preview.style.display = "none";
    preview.src = "";
    showMessage("");
}

async function loadProducts() {
    const res = await fetch("products_api.php");
    const data = await res.json();
    products = data.products || [];
    renderProducts();
}

function renderProducts() {
    const body = document.getElementById("productsBody");
    body.innerHTML = "";

    if (products.length === 0) {
        body.innerHTML = '<tr><td colspan="8" class="empty">No products yet.</td></tr>';
        return;
    }

    products.forEach(product => {
        const img = product.image ? `<img class="product-img" src="${product.image}" alt="${product.name}">` : '<div class="product-img empty-img"></div>';
        body.innerHTML += `
            <tr>
                <td>${img}</td>
                <td><b>${product.name}</b></td>
                <td>${product.category}</td>
                <td>${product.color}</td>
                <td>${product.size}</td>
                <td>${money(product.price)}</td>
                <td><span class="badge">${product.stock} in stock</span></td>
                <td class="actions">
                    <button class="btn btn-edit" type="button" onclick="editProduct(${product.id})">Edit</button>
                    <button class="btn btn-delete" type="button" onclick="deleteProduct(${product.id})">Delete</button>
                </td>
            </tr>`;
    });
}

function editProduct(id) {
    const product = products.find(p => Number(p.id) === Number(id));
    if (!product) return;

    document.getElementById("productId").value = product.id;
    document.getElementById("name").value = product.name;
    document.getElementById("category").value = product.category;
    document.getElementById("color").value = product.color;
    document.getElementById("size").value = product.size;
    document.getElementById("price").value = product.price;
    document.getElementById("stock").value = product.stock;

    if (product.image) {
        preview.src = product.image;
        preview.style.display = "block";
    } else {
        preview.style.display = "none";
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
}

async function deleteProduct(id) {
    if (!confirm("Delete this product?")) return;

    const data = new FormData();
    data.append("action", "delete");
    data.append("id", id);

    const res = await fetch("products_api.php", { method: "POST", body: data });
    const result = await res.json();
    showMessage(result.message || "Product deleted.", result.success);
    loadProducts();
}

form.addEventListener("submit", async function(e) {
    e.preventDefault();
    const data = new FormData(form);

    const res = await fetch("products_api.php", { method: "POST", body: data });
    const result = await res.json();
    showMessage(result.message || "Saved.", result.success);

    if (result.success) {
        clearForm();
        loadProducts();
    }
});

document.getElementById("image").addEventListener("change", function() {
    const file = this.files[0];
    if (!file) return;
    preview.src = URL.createObjectURL(file);
    preview.style.display = "block";
});

loadProducts();
