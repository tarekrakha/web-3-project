function money(value){ return "$" + Number(value || 0).toFixed(2); }
async function loadAnalytics(){
    const res = await fetch("analytics_api.php");
    const data = await res.json();
    if(!data.success) return;
    const cards = document.querySelectorAll(".stat-card p");
    cards[0].textContent = money(data.total_sales);
    cards[1].textContent = data.orders;
    cards[2].textContent = data.customers;
    cards[3].textContent = data.products;
    const body = document.querySelector(".card tbody");
    if(data.top.length){
        body.innerHTML = data.top.map(p => `<tr><td>${p.product_name}</td><td>${p.sales}</td><td>${money(p.revenue)}</td></tr>`).join("");
    }
}
loadAnalytics();
