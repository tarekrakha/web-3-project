let products = [];
let selectedColors = new Set();
let selectedSizes  = new Set();

// ── Chip toggle logic ─────────────────────────────────────────────────────────
document.getElementById("colorChips").addEventListener("click", function(e){
    const chip = e.target.closest(".color-chip");
    if (!chip) return;
    const color = chip.dataset.color;
    if (selectedColors.has(color)) { selectedColors.delete(color); chip.classList.remove("selected"); }
    else                           { selectedColors.add(color);    chip.classList.add("selected"); }
    updateSummary();
});

document.getElementById("sizeChips").addEventListener("click", function(e){
    const chip = e.target.closest(".size-chip");
    if (!chip) return;
    const size = chip.dataset.size;
    if (selectedSizes.has(size)) { selectedSizes.delete(size); chip.classList.remove("selected"); }
    else                         { selectedSizes.add(size);    chip.classList.add("selected"); }
    updateSummary();
});

function addCustomColor(){
    const input = document.getElementById("customColor");
    const val   = input.value.trim();
    if (!val) return;
    if (![...document.querySelectorAll(".color-chip")].some(c => c.dataset.color === val)) {
        const chip = document.createElement("span");
        chip.className = "color-chip selected";
        chip.dataset.color = val;
        chip.textContent   = val;
        document.getElementById("colorChips").appendChild(chip);
    }
    selectedColors.add(val);
    input.value = "";
    updateSummary();
}

function addCustomSize(){
    const input = document.getElementById("customSize");
    const val   = input.value.trim();
    if (!val) return;
    if (![...document.querySelectorAll(".size-chip")].some(s => s.dataset.size === val)) {
        const chip = document.createElement("span");
        chip.className = "size-chip selected";
        chip.dataset.size = val;
        chip.textContent  = val;
        document.getElementById("sizeChips").appendChild(chip);
    }
    selectedSizes.add(val);
    input.value = "";
    updateSummary();
}

function updateSummary(){
    const cs = [...selectedColors];
    const ss = [...selectedSizes];
    document.getElementById("colorSummary").textContent =
        cs.length ? "Selected: " + cs.join(", ") : "No colors selected";
    document.getElementById("sizeSummary").textContent =
        ss.length ? "Selected: " + ss.join(", ") : "No sizes selected";
}

function money(v){ return "$" + Number(v||0).toFixed(2); }

function showMessage(text, ok=true){
    const msg = document.getElementById("message");
    msg.textContent = text;
    msg.className   = ok ? "message success" : "message error";
}

function clearForm(){
    document.getElementById("productForm").reset();
    document.getElementById("productId").value = "";
    document.getElementById("preview").style.display = "none";
    selectedColors.clear();
    selectedSizes.clear();
    document.querySelectorAll(".color-chip, .size-chip").forEach(c => c.classList.remove("selected"));
    updateSummary();
    showMessage("");
}

// ── Load products table ───────────────────────────────────────────────────────
async function loadProducts(){
    const res  = await fetch("products_api.php");
    const data = await res.json();
    products   = data.products || [];
    renderProducts();
}

function renderProducts(){
    const body = document.getElementById("productsBody");
    if (!products.length){
        body.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:20px">No products yet.</td></tr>';
        return;
    }
    body.innerHTML = products.map(p => {
        const img    = p.image ? `<img src="${p.image}" style="width:50px;height:50px;object-fit:cover;border-radius:6px">` : '<div style="width:50px;height:50px;background:#eee;border-radius:6px"></div>';
        const colors = Array.isArray(p.colors) ? p.colors.join(", ") : "—";
        const sizes  = Array.isArray(p.sizes)  ? p.sizes.join(", ")  : "—";
        return `
        <tr>
            <td>${img}</td>
            <td><b>${p.name}</b></td>
            <td>${p.category}</td>
            <td>${colors}</td>
            <td>${sizes}</td>
            <td>${money(p.price)}</td>
            <td>${p.total_stock ?? 0} in stock</td>
            <td>
                <button class="btn btn-edit"   onclick="editProduct(${p.id})">Edit</button>
                <button class="btn btn-delete" onclick="deleteProduct(${p.id})">Delete</button>
            </td>
        </tr>`;
    }).join("");
}

async function editProduct(id){
    const res  = await fetch("products_api.php?action=one&id=" + id);
    const data = await res.json();
    const p    = data.product;
    if (!p) return;

    document.getElementById("productId").value  = p.id;
    document.getElementById("name").value       = p.name;
    document.getElementById("category").value   = p.category;
    document.getElementById("price").value      = p.price;

    // Restore selected colors
    selectedColors.clear();
    selectedSizes.clear();
    document.querySelectorAll(".color-chip, .size-chip").forEach(c => c.classList.remove("selected"));

    (p.colors || []).forEach(color => {
        selectedColors.add(color);
        const chip = [...document.querySelectorAll(".color-chip")].find(c => c.dataset.color === color);
        if (chip) chip.classList.add("selected");
        else {
            const nc = document.createElement("span");
            nc.className = "color-chip selected";
            nc.dataset.color = color;
            nc.textContent   = color;
            document.getElementById("colorChips").appendChild(nc);
        }
    });

    (p.sizes || []).forEach(size => {
        selectedSizes.add(size);
        const chip = [...document.querySelectorAll(".size-chip")].find(s => s.dataset.size === size);
        if (chip) chip.classList.add("selected");
        else {
            const ns = document.createElement("span");
            ns.className = "size-chip selected";
            ns.dataset.size = size;
            ns.textContent  = size;
            document.getElementById("sizeChips").appendChild(ns);
        }
    });

    updateSummary();
    if (p.image){ document.getElementById("preview").src = p.image; document.getElementById("preview").style.display = "block"; }
    window.scrollTo({ top: 0, behavior: "smooth" });
}

async function deleteProduct(id){
    if (!confirm("Delete this product and all its variants?")) return;
    const data = new FormData();
    data.append("action", "delete");
    data.append("id", id);
    const res    = await fetch("products_api.php", { method:"POST", body:data });
    const result = await res.json();
    showMessage(result.message || "Deleted.");
    loadProducts();
}

// ── Form submit ───────────────────────────────────────────────────────────────
document.getElementById("productForm").addEventListener("submit", async function(e){
    e.preventDefault();

    if (selectedColors.size === 0){ showMessage("Please select at least one color.", false); return; }
    if (selectedSizes.size  === 0){ showMessage("Please select at least one size.",  false); return; }

    const stock = parseInt(document.getElementById("variantStock").value) || 0;
    const formData = new FormData(this);

    // Save product
    const res    = await fetch("products_api.php", { method:"POST", body:formData });
    const result = await res.json();
    if (!result.success){ showMessage(result.message, false); return; }

    const productId = result.id || document.getElementById("productId").value;

    // Save all color × size combinations as variants
    for (const color of selectedColors){
        for (const size of selectedSizes){
            const vd = new FormData();
            vd.append("action",     "add_variant");
            vd.append("product_id", productId);
            vd.append("color",      color);
            vd.append("size",       size);
            vd.append("stock",      stock);
            await fetch("products_api.php", { method:"POST", body:vd });
        }
    }

    showMessage(`Product saved with ${selectedColors.size} color(s) × ${selectedSizes.size} size(s) = ${selectedColors.size * selectedSizes.size} variants!`);
    clearForm();
    loadProducts();
});

document.getElementById("image").addEventListener("change", function(){
    const file = this.files[0];
    if (!file) return;
    const preview = document.getElementById("preview");
    preview.src = URL.createObjectURL(file);
    preview.style.display = "block";
});

loadProducts();
