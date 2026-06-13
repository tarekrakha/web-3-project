/**
 * checkout.js — wired to checkout_api.php
 * - Loads saved addresses from address_api.php if user is logged in
 * - Blocks checkout if not logged in
 * - Passes address_front, address_back, save_address flag
 *
 * CHANGES (v2):
 * - Add New Address form now opens in a modal/popup instead of inline
 * - Saved addresses displayed as selectable cards for easy picking
 * - Order summary shows each item individually (name, qty, unit price, subtotal)
 */

const shippingBox  = document.getElementById("shippingBox");
const paymentBox   = document.getElementById("paymentBox");
const stepShipping = document.getElementById("stepShipping");
const stepPayment  = document.getElementById("stepPayment");
const message      = document.getElementById("checkoutMessage");
const shippingCost = 5;

let cart = JSON.parse(localStorage.getItem("morveniCart") || "[]");

// Holds the address that will be submitted (either saved id or form data)
let pendingAddress = null;

// ── Helpers ───────────────────────────────────────────────────────────────────
function money(v){ return "$" + Number(v || 0).toFixed(2); }

function totals(){
    const subtotal = cart.reduce((s, i) => s + Number(i.price) * Number(i.quantity || 1), 0);
    return { subtotal, shipping: shippingCost, total: subtotal + shippingCost };
}

// ── Order Summary — one row per item ─────────────────────────────────────────
function renderSummary(){
    const itemsHtml = cart.map(item => {
        const qty      = Number(item.quantity || 1);
        const unitPrice = Number(item.price);
        const itemTotal = unitPrice * qty;

        return `
        <div class="summary-item">
            <div class="summary-item-name">${item.name}</div>
            <div class="summary-item-details">
                <span class="summary-item-meta">Qty: ${qty}</span>
                <span class="summary-item-meta">Unit: ${money(unitPrice)}</span>
                <span class="summary-item-subtotal">Subtotal: ${money(itemTotal)}</span>
            </div>
        </div>`;
    }).join("");

    document.getElementById("summaryItems").innerHTML = itemsHtml;

    const t = totals();
    document.getElementById("subtotal").textContent = money(t.subtotal);
    document.getElementById("shipping").textContent  = money(t.shipping);
    document.getElementById("total").textContent     = money(t.total);
}

// ── Step switching ────────────────────────────────────────────────────────────
function setStep(payment){
    shippingBox.classList.toggle("hidden",  payment);
    paymentBox.classList.toggle("hidden",  !payment);
    stepShipping.classList.toggle("active", !payment);
    stepPayment.classList.toggle("active",   payment);
}

// ── Modal logic ───────────────────────────────────────────────────────────────
const modalOverlay = document.getElementById("addressModalOverlay");

function openModal(){
    modalOverlay.classList.remove("hidden");
    document.body.classList.add("modal-open");
}

function closeModal(){
    modalOverlay.classList.add("hidden");
    document.body.classList.remove("modal-open");
}

document.getElementById("openAddressModal").addEventListener("click", openModal);
document.getElementById("closeAddressModal").addEventListener("click", closeModal);
document.getElementById("cancelAddressModal").addEventListener("click", closeModal);

// Close when clicking the dark overlay behind the modal
modalOverlay.addEventListener("click", function(e){
    if (e.target === modalOverlay) closeModal();
});

// "Use This Address" inside modal — validate & store as pending
document.getElementById("confirmNewAddress").addEventListener("click", function(){
    const name   = document.getElementById("fullName").value.trim();
    const phone  = document.getElementById("phone").value.trim();
    const city   = document.getElementById("city").value.trim();
    const street = document.getElementById("street").value.trim();

    if (!name || !phone || !city || !street){
        alert("Please fill in at least: Full Name, Phone, City, and Street Address.");
        return;
    }

    pendingAddress = {
        name,
        phone,
        city,
        street,
        address_front: document.getElementById("addressFront").value.trim(),
        address_back:  document.getElementById("addressBack").value.trim(),
        save_address:  document.getElementById("saveAddress").checked,
        address_label: document.getElementById("addressLabel").value.trim() || "Home"
    };

    // Show confirmation card in the shipping box
    showPendingAddressCard(pendingAddress);

    // Deselect any saved address radio
    document.querySelectorAll('input[name="address"]').forEach(r => r.checked = false);

    closeModal();
});

// Display a "selected new address" confirmation card
function showPendingAddressCard(addr){
    let card = document.getElementById("pendingAddressCard");
    if (!card){
        card = document.createElement("div");
        card.id = "pendingAddressCard";
        card.className = "address-option address-option--selected";
        // Insert before the Add New Address button
        const btn = document.getElementById("openAddressModal");
        btn.parentNode.insertBefore(card, btn);
    }
    card.innerHTML = `
        <div class="address-selected-badge">✓ New Address Selected</div>
        <div class="address-card-body">
            <strong>${addr.name}</strong><br>
            ${addr.city}, ${addr.street}<br>
            ${addr.phone}
        </div>`;
}

// ── Load saved addresses ──────────────────────────────────────────────────────
async function loadSavedAddresses(){
    try {
        const res  = await fetch("address_api.php");
        const data = await res.json();
        if (!data.success || !data.addresses.length) return;

        const container = document.getElementById("savedAddressContainer");
        if (!container) return;

        container.innerHTML =
            `<p class="section-label">Saved Addresses</p>` +
            data.addresses.map(a => `
            <label class="address-option">
                <input type="radio" name="address" value="${a.id}" ${a.is_default ? "checked" : ""}
                    onchange="onSavedAddressPick()">
                <div class="address-card-body">
                    <strong>${a.label}</strong><br>
                    ${a.full_name}<br>
                    ${a.city}, ${a.street}<br>
                    ${a.phone}
                </div>
            </label>`).join("");

        // Pre-select default
        if (data.addresses.some(a => a.is_default)){
            const def = data.addresses.find(a => a.is_default);
            pendingAddress = { saved_address_id: String(def.id) };
        }
    } catch(e) { /* not logged in or no addresses */ }
}

// Called when user picks a saved address — clears any pending new address card
window.onSavedAddressPick = function(){
    const selected = document.querySelector('input[name="address"]:checked')?.value;
    if (selected) {
        pendingAddress = { saved_address_id: selected };
        // Remove new-address confirmation card if present
        const card = document.getElementById("pendingAddressCard");
        if (card) card.remove();
    }
};

// ── Resolve which address to submit ──────────────────────────────────────────
function getAddress(){
    // 1. If a saved address radio is checked, use it
    const selected = document.querySelector('input[name="address"]:checked')?.value;
    if (selected) return { saved_address_id: selected };

    // 2. If user filled in a new address via modal, use it
    if (pendingAddress && !pendingAddress.saved_address_id) return pendingAddress;

    // 3. Nothing selected — return empty so validation catches it
    return null;
}

// ── Payment helpers ───────────────────────────────────────────────────────────
function selectedPayment(){
    return document.querySelector('input[name="pay"]:checked')?.value || "Cash on Delivery";
}

function toggleCardInfo(){
    const show = selectedPayment() === "Credit / Debit Card";
    const ci   = document.getElementById("cardInfo");
    if (ci) ci.style.display = show ? "block" : "none";
}

document.querySelectorAll('input[name="pay"]')
        .forEach(r => r.addEventListener("change", toggleCardInfo));

// ── Step navigation ───────────────────────────────────────────────────────────
document.getElementById("continuePayment").addEventListener("click", function(){
    const addr = getAddress();
    if (!addr){
        alert("Please select a saved address or add a new one.");
        return;
    }
    setStep(true);
});

document.getElementById("backShipping").addEventListener("click", () => setStep(false));

// ── Place Order ───────────────────────────────────────────────────────────────
document.getElementById("placeOrder").addEventListener("click", async function(){
    const addr    = getAddress();
    const payment = selectedPayment();
    const t       = totals();

    if (!addr){
        message.textContent = "No shipping address selected.";
        message.className   = "checkout-message error";
        return;
    }

    if (payment === "Credit / Debit Card"){
        if (!document.getElementById("cardNumber")?.value ||
            !document.getElementById("expiry")?.value    ||
            !document.getElementById("cvv")?.value){
            message.textContent = "Please complete card details.";
            message.className   = "checkout-message error";
            return;
        }
    }

    const payload = {
        name:             addr.name            || "",
        phone:            addr.phone           || "",
        city:             addr.city            || "",
        street:           addr.street          || "",
        address_front:    addr.address_front   || "",
        address_back:     addr.address_back    || "",
        save_address:     addr.save_address    || false,
        address_label:    addr.address_label   || "Home",
        saved_address_id: addr.saved_address_id || null,
        payment_method:   payment,
        items:            cart,
        subtotal:         t.subtotal,
        shipping:         t.shipping,
        total:            t.total
    };

    const res    = await fetch("checkout_api.php", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload)
    });
    const result = await res.json();

    if (res.status === 401){
        message.textContent = result.message;
        message.className   = "checkout-message error";
        setTimeout(() => window.location.href = result.redirect || "login.html", 1500);
        return;
    }

    message.textContent = result.success
        ? `Order #${result.order_id} placed! Tracking: ${result.tracking}`
        : result.message;
    message.className = result.success ? "checkout-message success" : "checkout-message error";

    if (result.success) localStorage.removeItem("morveniCart");
});

// ── Init ──────────────────────────────────────────────────────────────────────
// Redirect back to cart if there is nothing to check out
if (cart.length === 0) {
    window.location.href = "cart.html";
} else {
    renderSummary();
    toggleCardInfo();
    loadSavedAddresses();
}
