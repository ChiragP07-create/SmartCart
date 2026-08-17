const API = "https://awake-tenderness-production.up.railway.app";
let products = [];

let cart = [];


// LOAD PRODUCTS

async function loadProducts() {

    try {

        const response =
            await fetch(`${API}/api/products`);

        products =
            await response.json();

        displayProducts();

    } catch (error) {

        console.error(error);

        document.getElementById("productsContainer").innerHTML =
            `<p>Unable to load products. Make sure the backend is running.</p>`;
    }
}


// DISPLAY PRODUCTS

function displayProducts() {

    const container =
        document.getElementById("productsContainer");

    container.innerHTML = "";

    products.forEach(product => {

        const card =
            document.createElement("div");

        card.className =
            "product-card";

        card.innerHTML = `

            <div class="product-image">
                ${getProductIcon(product.category_name)}
            </div>

            <span class="category">
                ${product.category_name}
            </span>

            <h3>
                ${product.product_name}
            </h3>
            <div class="product-price">

    ₹${Number(product.price).toLocaleString("en-IN")}
</div>
    >
        −
    </button>

</div>
            </div>

            <div class="rating">
                ⭐ ${product.rating}
            </div>

            <div class="stock">
                ${product.stock > 0
                ? `${product.stock} in stock`
                : "Out of stock"}
            </div>

            <button
                class="add-btn"
                onclick="addToCart(${product.product_id})"
                ${product.stock === 0 ? "disabled" : ""}>

                Add to Cart

            </button>
        `;

        container.appendChild(card);

    });
}


// PRODUCT ICON

function getProductIcon(category) {

    const icons = {

        "Electronics": "🎧",

        "Gaming": "🎮",

        "Accessories": "🔌",

        "Wearables": "⌚",

        "Home & Office": "🪑"

    };

    return icons[category] || "📦";
}


// ADD TO CART

async function addToCart(productId) {

    const product = products.find(
        p => p.product_id === productId
    );

    if (!product) return;

    try {

        const response = await fetch(
            `${API}/api/cart`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    customer_id: 1,
                    product_id: productId,
                    quantity: 1
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error);
        }

        // Keep the item in the browser cart
        cart.push({
            ...product,
            quantity: 1
        });

        updateCartCount();

        alert(
            `${product.product_name} added to cart and saved to MySQL!`
        );

    } catch (error) {

        console.error(error);

        alert("Could not add product to cart.");

    }
}

// CART COUNT

function updateCartCount() {

    document.getElementById("cartCount")
        .textContent = cart.length;
}

function showCart() {

    const modal = document.getElementById("cartModal");
    const container = document.getElementById("cartItems");

    if (cart.length === 0) {

        container.innerHTML = `
            <div style="text-align:center; padding:30px;">
                <h3>Your cart is empty</h3>
                <p>Add some products to your cart.</p>
            </div>
        `;

    } else {

        container.innerHTML = cart.map(item => {

            const quantity = Number(item.quantity || 1);
            const price = Number(item.price);
            const total = price * quantity;

            return `
                <div style="
                    padding:16px;
                    margin-bottom:12px;
                    border:1px solid #34405a;
                    border-radius:10px;
                ">

                    <div style="
                        display:flex;
                        justify-content:space-between;
                        align-items:center;
                    ">

                        <div>
                            <strong style="
                                color:white;
                                font-size:16px;
                            ">
                                ${item.product_name}
                            </strong>

                            <div style="
                                color:#8996aa;
                                margin-top:5px;
                            ">
                                ₹${price.toLocaleString("en-IN")} each
                            </div>
                        </div>

                        <strong style="color:white;">
                            ₹${total.toLocaleString("en-IN")}
                        </strong>

                    </div>

                    <div style="
                        display:flex;
                        align-items:center;
                        gap:10px;
                        margin-top:12px;
                    ">

                        <button
                            type="button"
                            onclick="window.changeCartQuantity(${item.product_id}, -1)"
                            style="
                                width:32px;
                                height:32px;
                                border:1px solid #34405a;
                                background:#182235;
                                color:white;
                                border-radius:6px;
                                cursor:pointer;
                                font-size:18px;
                            "
                        >−</button>

                        <span style="
                            min-width:30px;
                            text-align:center;
                            color:white;
                            font-weight:bold;
                        ">
                            ${quantity}
                        </span>

                        <button
                            type="button"
                            onclick="window.changeCartQuantity(${item.product_id}, 1)"
                            style="
                                width:32px;
                                height:32px;
                                border:1px solid #34405a;
                                background:#182235;
                                color:white;
                                border-radius:6px;
                                cursor:pointer;
                                font-size:18px;
                            "
                        >+</button>

                        <button
                            type="button"
                            onclick="window.removeFromCart(${item.product_id})"
                            style="
                                margin-left:10px;
                                padding:7px 12px;
                                border:none;
                                background:#d9534f;
                                color:white;
                                border-radius:6px;
                                cursor:pointer;
                            "
                        >
                            Remove
                        </button>

                    </div>

                </div>
            `;

        }).join("");
    }

    modal.classList.remove("hidden");

    // UPDATE ORDER SUMMARY
    const summaryItems =
        document.getElementById("summaryItems");

    const summarySubtotal =
        document.getElementById("checkoutSubtotal");

    const summaryTotal =
        document.getElementById("checkoutTotal");

    if (cart.length === 0) {

        summaryItems.textContent = "No items";
        summarySubtotal.textContent = "₹0";
        summaryTotal.textContent = "₹0";

    } else {

        let subtotal = 0;

        cart.forEach(item => {
            subtotal +=
                Number(item.price) *
                Number(item.quantity || 1);
        });

        summaryItems.innerHTML =
            cart.map(item => `
                <div class="summary-product">
                    <span>
                        ${item.product_name} × ${item.quantity || 1}
                    </span>

                    <strong>
                        ₹${(
                    Number(item.price) *
                    Number(item.quantity || 1)
                ).toLocaleString("en-IN")}
                    </strong>
                </div>
            `).join("");

        summarySubtotal.textContent =
            `₹${subtotal.toLocaleString("en-IN")}`;

        summaryTotal.textContent =
            `₹${subtotal.toLocaleString("en-IN")}`;
    }
}
function closeCart() {

    document
        .getElementById("cartModal")
        .classList.add("hidden");
}


// ANALYTICS

async function loadAnalytics() {

    try {

        const response =
            await fetch(`${API}/api/analytics`);

        const data =
            await response.json();

        document.getElementById("customerStat")
            .textContent = data.customers;

        document.getElementById("orderStat")
            .textContent = data.orders;

        document.getElementById("revenueStat")
            .textContent =
            "₹" +
            Number(data.revenue)
                .toLocaleString("en-IN");

    } catch (error) {

        console.error(error);

    }
}

// ==========================================
// SMARTCART SQL INTELLIGENCE
// ==========================================

// LOW STOCK
async function showLowStock() {

    const modal =
        document.getElementById("insightModal");

    const title =
        document.getElementById("insightTitle");

    const content =
        document.getElementById("insightContent");

    title.textContent = "Inventory Alerts";

    content.innerHTML =
        "<p>Loading inventory data...</p>";

    modal.classList.remove("hidden");

    try {

        const response =
            await fetch(`${API}/api/insights/low-stock`);

        const data =
            await response.json();

        if (!response.ok) {
            throw new Error(data.error);
        }

        if (data.length === 0) {

            content.innerHTML = `
                <div class="empty-insight">

                    <div>✅</div>

                    <h3>Inventory looks healthy</h3>

                    <p>
                        No products are currently
                        low in stock.
                    </p>

                </div>
            `;

            return;
        }

        content.innerHTML = `

            <div class="insight-summary">

                ⚠️ ${data.length}
                product${data.length > 1 ? "s" : ""}
                need${data.length === 1 ? "s" : ""}
                attention

            </div>

            <div class="stock-list">

                ${data.map(item => {

            let level = "medium";

            if (item.stock <= 3) {
                level = "critical";
            }

            return `

                        <div class="stock-item ${level}">

                            <div>

                                <strong>
                                    ${item.product_name}
                                </strong>

                                <span>
                                    ${item.category_name}
                                </span>

                            </div>

                            <div class="stock-number">

                                ${item.stock}

                                <small>
                                    left
                                </small>

                            </div>

                        </div>

                    `;

        }).join("")}

            </div>

            <div class="sql-note">

                <strong>SQL Logic</strong>

                <code>
                    WHERE stock &lt;= 8
                    ORDER BY stock ASC
                </code>

            </div>
        `;

    } catch (error) {

        console.error(error);

        content.innerHTML = `
            <div class="empty-insight">
                ❌ Unable to load inventory data.
            </div>
        `;
    }
}

async function showTopCustomers() {

    const modal =
        document.getElementById("insightModal");

    const title =
        document.getElementById("insightTitle");

    const content =
        document.getElementById("insightContent");

    title.textContent = "Top Customers";

    content.innerHTML =
        "<p>Loading customer analytics...</p>";

    modal.classList.remove("hidden");

    try {

        const response =
            await fetch(
                `${API}/api/insights/top-customers`
            );

        const data =
            await response.json();

        if (!response.ok) {
            throw new Error(data.error);
        }

        if (data.length === 0) {

            content.innerHTML = `
                <div class="empty-insight">

                    <div>📊</div>

                    <h3>No customer data yet</h3>

                    <p>
                        Place some orders to generate
                        customer insights.
                    </p>

                </div>
            `;

            return;
        }

        content.innerHTML = `

            <div class="insight-summary">

                🏆 Top ${data.length}
                customers by spending

            </div>

            <div class="stock-list">

                ${data.map((customer, index) => `

                    <div class="stock-item">

                        <div>

                            <strong>
                                ${index + 1}.
                                ${customer.name}
                            </strong>

                            <span>
                                ${customer.total_orders}
                                order${customer.total_orders == 1 ? "" : "s"}
                            </span>

                        </div>

                        <div class="stock-number">

                            ₹${Number(
            customer.total_spent
        ).toLocaleString("en-IN")}

                        </div>

                    </div>

                `).join("")}

            </div>

            <div class="sql-note">

                <strong>SQL Logic</strong>

                <code>
                    GROUP BY customer
                    ORDER BY SUM(total_amount) DESC
                </code>

            </div>
        `;

    } catch (error) {

        console.error(error);

        content.innerHTML = `
            <div class="empty-insight">
                ❌ Unable to load customer data.
            </div>
        `;
    }
}

// TOP SELLING PRODUCTS
async function showRecommendations() {

    const modal =
        document.getElementById("insightModal");

    const title =
        document.getElementById("insightTitle");

    const content =
        document.getElementById("insightContent");

    title.textContent = "Top Selling Products";

    content.innerHTML =
        "<p>Loading product analytics...</p>";

    modal.classList.remove("hidden");

    try {

        const response =
            await fetch(
                `${API}/api/insights/top-products`
            );

        const data =
            await response.json();

        if (!response.ok) {
            throw new Error(data.error);
        }

        if (data.length === 0) {

            content.innerHTML = `
                <div class="empty-insight">

                    <div>📦</div>

                    <h3>No sales data yet</h3>

                    <p>
                        Place some orders to generate
                        product insights.
                    </p>

                </div>
            `;

            return;
        }

        content.innerHTML = `

            <div class="insight-summary">

                🔥 Top ${data.length}
                selling products

            </div>


            <div class="stock-list">

                ${data.map((product, index) => `

                    <div class="stock-item">

                        <div>

                            <strong>
                                ${index + 1}.
                                ${product.product_name}
                            </strong>

                            <span>
                                Best-selling product
                            </span>

                        </div>


                        <div class="stock-number">

                            ${product.units_sold}

                            <small>
                                sold
                            </small>

                        </div>

                    </div>

                `).join("")}

            </div>


            <div class="sql-note">

                <strong>SQL Logic</strong>

                <code>
                    GROUP BY product
                    ORDER BY SUM(quantity) DESC
                </code>

            </div>
        `;

    } catch (error) {

        console.error(error);

        content.innerHTML = `
            <div class="empty-insight">

                ❌ Unable to load product data.

            </div>
        `;
    }
}
// INITIAL LOAD

loadProducts();

loadAnalytics();
window.checkout = async function checkout() {

    try {

        const name =
            document.getElementById("customerName").value.trim();

        const email =
            document.getElementById("checkoutEmail").value.trim();

        const phone =
            document.getElementById("checkoutPhone").value.trim();

        const city =
            document.getElementById("checkoutCity").value.trim();


        if (!name || !email) {

            alert("Please enter your name and email.");

            return;
        }


        // UPDATE CUSTOMER #1
        const customerResponse = await fetch(
            `${API}/api/customers/1`,
            {
                method: "PUT",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    name: name,
                    email: email,
                    phone: phone,
                    city: city
                })
            }
        );


        const customerData =
            await customerResponse.json();


        if (!customerResponse.ok) {

            throw new Error(
                customerData.error ||
                "Could not save customer details"
            );

        }


        // CUSTOMER 1 OWNS THE CURRENT CART
        const customerId = 1;


        // PLACE ORDER
        const response = await fetch(
            `${API}/api/checkout`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    customer_id: customerId
                })
            }
        );


        const data =
            await response.json();


        if (!response.ok) {
            throw new Error(data.error);
        }


        alert(
            `✅ Order placed successfully!\n\n` +
            `Customer: ${name}\n` +
            `Order ID: ${data.order_id}\n` +
            `Total: ₹${Number(data.total).toLocaleString("en-IN")}`
        );


        // Empty browser cart
        cart = [];

        updateCartCount();

        closeCart();


    } catch (error) {

        console.error(error);

        alert(
            "Checkout failed: " +
            error.message
        );

    }

};



// ==========================================
// REVENUE ANALYTICS
// ==========================================

async function showRevenue() {

    const modal =
        document.getElementById("insightModal");

    const title =
        document.getElementById("insightTitle");

    const content =
        document.getElementById("insightContent");

    title.textContent = "Revenue Analytics";

    content.innerHTML =
        "<p>Loading revenue data...</p>";

    modal.classList.remove("hidden");

    try {

        const response =
            await fetch(
                `${API}/api/insights/revenue`
            );

        const data =
            await response.json();

        if (!response.ok) {
            throw new Error(data.error);
        }

        const revenue =
            Number(data.total_revenue);

        const orders =
            Number(data.total_orders);

        const average =
            Number(data.average_order_value);


        content.innerHTML = `

            <div class="insight-summary">

                💰 Business Performance

            </div>


            <div class="revenue-grid">

                <div class="revenue-card">

                    <span>💰 Total Revenue</span>

                    <strong>
                        ₹${revenue.toLocaleString("en-IN")}
                    </strong>

                </div>


                <div class="revenue-card">

                    <span>📦 Total Orders</span>

                    <strong>
                        ${orders}
                    </strong>

                </div>


                <div class="revenue-card">

                    <span>📊 Average Order</span>

                    <strong>
                        ₹${average.toLocaleString(
            "en-IN",
            {
                maximumFractionDigits: 0
            }
        )}
                    </strong>

                </div>

            </div>


            <div class="sql-note">

                <strong>SQL Logic</strong>

                <code>
                    SUM(total_amount)<br>
                    COUNT(order_id)<br>
                    AVG(total_amount)
                </code>

            </div>

        `;

    } catch (error) {

        console.error(error);

        content.innerHTML = `

            <div class="empty-insight">

                ❌ Unable to load revenue data.

            </div>

        `;

    }

}
// ==========================================
// ORDER HISTORY
// ==========================================

async function showOrderHistory() {

    const modal =
        document.getElementById("insightModal");

    const title =
        document.getElementById("insightTitle");

    const content =
        document.getElementById("insightContent");

    title.textContent = "Order History";

    content.innerHTML =
        "<p>Loading order history...</p>";

    modal.classList.remove("hidden");


    try {

        const response =
            await fetch(
                `${API}/api/insights/order-history`
            );

        const data =
            await response.json();


        if (!response.ok) {
            throw new Error(data.error);
        }


        if (data.length === 0) {

            content.innerHTML = `
                <div class="empty-insight">

                    <div>🧾</div>

                    <h3>No orders yet</h3>

                    <p>
                        Orders will appear here after checkout.
                    </p>

                </div>
            `;

            return;
        }


        // GROUP PRODUCTS BY ORDER

        const orders = {};

        data.forEach(item => {

            if (!orders[item.order_id]) {

                orders[item.order_id] = {

                    order_id: item.order_id,

                    order_date: item.order_date,

                    status: item.status,

                    customer_name:
                        item.customer_name,

                    email:
                        item.email,

                    phone:
                        item.phone,

                    city:
                        item.city,

                    total_amount:
                        item.total_amount,

                    products: []

                };

            }


            orders[item.order_id].products.push({

                product_name:
                    item.product_name,

                quantity:
                    item.quantity,

                item_total:
                    item.item_total

            });

        });


        const orderList =
            Object.values(orders);


        content.innerHTML = `

            <div class="insight-summary">

                🧾 Showing
                ${orderList.length}
                order${orderList.length > 1 ? "s" : ""}

            </div>


            <div class="order-history-list">

                ${orderList.map(order => `

                    <div class="order-history-item">


                        <div class="order-history-top">

                            <strong>
                                Order #${order.order_id}
                            </strong>

                            <span class="order-status">
                                ${order.status}
                            </span>

                        </div>


                        <div class="order-customer">

                            <strong>
                                👤 ${order.customer_name}
                            </strong>

                            <span>
                                📧 ${order.email}
                            </span>

                            <span>
                                📱 ${order.phone || "Not provided"}
                            </span>

                            <span>
                                📍 ${order.city || "Not provided"}
                            </span>

                        </div>


                        <div class="order-products">

                            ${order.products.map(product => `

                                <div class="order-product">

                                    <strong>
                                        ${product.product_name}
                                    </strong>

                                    <span>
                                        × ${product.quantity}
                                    </span>

                                    <strong>
                                        ₹${Number(
            product.item_total
        ).toLocaleString("en-IN")}
                                    </strong>

                                </div>

                            `).join("")}

                        </div>


                        <div class="order-history-bottom">

                            <span>
                                Order Total
                            </span>

                            <strong>
                                ₹${Number(
            order.total_amount
        ).toLocaleString("en-IN")}
                            </strong>

                        </div>


                    </div>

                `).join("")}

            </div>


            <div class="sql-note">

                <strong>SQL Logic</strong>

                <code>
                    JOIN customers<br>
                    JOIN orders<br>
                    JOIN order_items<br>
                    JOIN products<br>
                    ORDER BY order_id DESC
                </code>

            </div>

        `;


    } catch (error) {

        console.error(error);

        content.innerHTML = `

            <div class="empty-insight">

                ❌ Unable to load order history.

            </div>

        `;

    }

}
window.removeFromCart = async function (productId) {

    try {

        const response = await fetch(
            `${API}/api/cart`,
            {
                method: "DELETE",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    customer_id: 1,
                    product_id: productId
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error);
        }

        // Remove from browser cart
        cart = cart.filter(
            item =>
                Number(item.product_id) !== Number(productId)
        );

        updateCartCount();

        showCart();

    } catch (error) {

        console.error(error);

        alert("Unable to remove item from cart.");

    }

};

window.changeCartQuantity = async function (productId, change) {

    const item = cart.find(
        item =>
            Number(item.product_id) === Number(productId)
    );

    if (!item) {
        return;
    }

    const newQuantity =
        Number(item.quantity || 1) + change;


    // If quantity becomes 0, remove the product
    if (newQuantity <= 0) {

        window.removeFromCart(productId);

        return;
    }


    try {

        const response = await fetch(
            `${API}/api/cart`,
            {
                method: "PUT",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    customer_id: 1,
                    product_id: productId,
                    quantity: newQuantity
                })
            }
        );


        const data =
            await response.json();


        if (!response.ok) {
            throw new Error(
                data.error || "Failed to update cart"
            );
        }


        // Update browser cart
        item.quantity = newQuantity;


        updateCartCount();

        showCart();


    } catch (error) {

        console.error(
            "Quantity update failed:",
            error
        );

        alert(
            "Unable to update quantity."
        );

    }

};