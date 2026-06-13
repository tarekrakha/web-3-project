function money(v){ return "$" + Number(v||0).toFixed(2); }

async function loadOrders(){
    const res  = await fetch("orders_api.php");
    const data = await res.json();
    const body = document.getElementById("ordersBody");
    const orders = data.orders || [];

    if (!orders.length){
        body.innerHTML = '<tr><td colspan="10" style="text-align:center">No orders yet.</td></tr>';
        return;
    }

    body.innerHTML = orders.map(o => {
        const sc = (o.status||"pending").toLowerCase();

        // Build address column: city + street, plus front/back if present
        let addrParts = [o.city, o.street];
        if (o.address_front) addrParts.push("Front: " + o.address_front);
        if (o.address_back)  addrParts.push("Back: "  + o.address_back);
        const addrHtml = addrParts.filter(Boolean).join("<br>");

        return `
        <tr>
            <td>#${o.id}</td>
            <td>${o.customer_name}</td>
            <td>${o.products || "—"}</td>
            <td>${o.sizes  || "—"}</td>
            <td>${o.colors || "—"}</td>
            <td>${addrHtml}</td>
            <td>${money(o.total)}</td>
            <td><span class="badge ${sc}">${o.status}</span></td>
            <td>${o.tracking_code || "—"}</td>
            <td>
                <select onchange="setStatus(${o.id}, this.value)" class="status-select">
                    <option value="">— Change —</option>
                    <option value="Pending">Pending</option>
                    <option value="Preparing">Preparing</option>
                    <option value="Shipped">Shipped</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Cancelled">Cancelled</option>
                </select>
            </td>
        </tr>`;
    }).join("");
}

async function setStatus(id, status){
    if (!status) return;
    const data = new FormData();
    data.append("id",     id);
    data.append("status", status);
    await fetch("orders_api.php", { method:"POST", body:data });
    loadOrders();
}

loadOrders();
