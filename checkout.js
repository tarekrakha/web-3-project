const shippingBox = document.getElementById("shippingBox");
const paymentBox = document.getElementById("paymentBox");
const stepShipping = document.getElementById("stepShipping");
const stepPayment = document.getElementById("stepPayment");
const message = document.getElementById("checkoutMessage");
const shippingCost = 5;

let cart = JSON.parse(localStorage.getItem("morveniCart") || "[]");
if (cart.length === 0) {
    cart = [
        { id: null, name: "White Shirt", quantity: 1, price: 30, size: "", color: "" },
        { id: null, name: "Blue Jeans", quantity: 1, price: 50, size: "", color: "" }
    ];
}

function money(value) {
    return "$" + Number(value || 0).toFixed(2);
}

function totals() {
    const subtotal = cart.reduce((sum, item) => sum + (Number(item.price) * Number(item.quantity || 1)), 0);
    return { subtotal, shipping: shippingCost, total: subtotal + shippingCost };
}

function renderSummary() {
    const list = document.getElementById("summaryItems");
    list.innerHTML = cart.map(item => `
        <div class="summary-line item-line">
            <span>${item.name} × ${item.quantity || 1}</span>
            <span>${money(Number(item.price) * Number(item.quantity || 1))}</span>
        </div>`).join("");

    const t = totals();
    document.getElementById("subtotal").textContent = money(t.subtotal);
    document.getElementById("shipping").textContent = money(t.shipping);
    document.getElementById("total").textContent = money(t.total);
}

function setStep(payment) {
    shippingBox.classList.toggle("hidden", payment);
    paymentBox.classList.toggle("hidden", !payment);
    stepShipping.classList.toggle("active", !payment);
    stepPayment.classList.toggle("active", payment);
}

function savedAddressValue() {
    const selected = document.querySelector('input[name="address"]:checked')?.value;
    if (selected === "home") {
        return { name: "john xxx", phone: "+9618188888", city: "Zgharta", street: "Lebanon" };
    }
    return { name: "Office Address", phone: "+96170000000", city: "Beirut", street: "Lebanon" };
}

function getAddress() {
    const typed = {
        name: document.getElementById("fullName").value.trim(),
        phone: document.getElementById("phone").value.trim(),
        city: document.getElementById("city").value.trim(),
        street: document.getElementById("street").value.trim()
    };

    if (typed.name || typed.phone || typed.city || typed.street) {
        return typed;
    }

    return savedAddressValue();
}

function selectedPayment() {
    return document.querySelector('input[name="pay"]:checked')?.value || "Credit / Debit Card";
}

function toggleCardInfo() {
    document.getElementById("cardInfo").style.display = selectedPayment() === "Credit / Debit Card" ? "block" : "none";
}

document.querySelectorAll('input[name="pay"]').forEach(radio => radio.addEventListener("change", toggleCardInfo));

document.getElementById("continuePayment").addEventListener("click", function() {
    const address = getAddress();
    if (!address.name || !address.phone || !address.city || !address.street) {
        alert("Please complete your shipping address.");
        return;
    }
    setStep(true);
});

document.getElementById("backShipping").addEventListener("click", function() {
    setStep(false);
});

document.getElementById("placeOrder").addEventListener("click", async function() {
    const address = getAddress();
    const payment = selectedPayment();
    const t = totals();

    if (payment === "Credit / Debit Card") {
        if (!document.getElementById("cardNumber").value || !document.getElementById("expiry").value || !document.getElementById("cvv").value) {
            message.textContent = "Please complete card details.";
            message.className = "checkout-message error";
            return;
        }
    }

    const payload = {
        ...address,
        payment_method: payment,
        items: cart,
        subtotal: t.subtotal,
        shipping: t.shipping,
        total: t.total
    };

    const res = await fetch("checkout_api.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });

    const result = await res.json();
    message.textContent = result.success ? `Order #${result.order_id} placed successfully.` : result.message;
    message.className = result.success ? "checkout-message success" : "checkout-message error";

    if (result.success) {
        localStorage.removeItem("morveniCart");
    }
});

renderSummary();
toggleCardInfo();
