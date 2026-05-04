function money(value){ return "$" + Number(value || 0).toFixed(2); }

async function loadOrders(){
    const res = await fetch("orders_api.php");
    const data = await res.json();
    const body = document.getElementById("ordersBody");
    const orders = data.orders || [];

    if (!orders.length) {
        body.innerHTML = '<tr><td colspan="8" style="text-align:center">No orders yet.</td></tr>';
        return;
    }

    body.innerHTML = orders.map(order => {
        const statusClass = (order.status || "pending").toLowerCase();
        return `
        <tr>
            <td>#${order.id}</td>
            <td>${order.customer_name}</td>
            <td>${order.products || "Order items"}</td>
            <td>-</td>
            <td>-</td>
            <td>${money(order.total)}</td>
            <td><span class="badge ${statusClass}">${order.status}</span></td>
            <td>
                <button class="btn btn-success" onclick="setStatus(${order.id}, 'Delivered')">Approve</button>
                <button class="btn btn-delete" onclick="setStatus(${order.id}, 'Cancelled')">Cancel</button>
            </td>
        </tr>`;
    }).join("");
}

async function setStatus(id, status){
    const data = new FormData();
    data.append("id", id);
    data.append("status", status);
    await fetch("orders_api.php", { method:"POST", body:data });
    loadOrders();
}

loadOrders();
