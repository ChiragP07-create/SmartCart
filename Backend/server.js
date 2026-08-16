const express = require("express");
const cors = require("cors");

const db = require("./db");

const app = express();

app.use(cors());
app.use(express.json());


// TEST ROUTE
app.get("/", (req, res) => {
    res.json({
        message: "SmartCart Backend is running!"
    });
});


// GET ALL PRODUCTS
app.get("/api/products", (req, res) => {

    const sql = `
        SELECT
            p.product_id,
            p.product_name,
            p.price,
            p.stock,
            p.rating,
            c.category_name
        FROM products p
        JOIN categories c
        ON p.category_id = c.category_id
        ORDER BY p.product_id;
    `;

    db.query(sql, (err, results) => {

        if (err) {
            console.error(err);
            return res.status(500).json({
                error: "Database query failed"
            });
        }

        res.json(results);
    });
});


// GET CUSTOMER ORDERS
app.get("/api/orders/:customerId", (req, res) => {

    const customerId = req.params.customerId;

    const sql = `
    SELECT
        o.order_id,
        o.order_date,
        o.status,
        o.total_amount,

        c.customer_id,
        c.name AS customer_name,
        c.email,
        c.phone,
        c.city

    FROM orders o

    JOIN customers c
        ON o.customer_id = c.customer_id

    WHERE o.customer_id = ?

    ORDER BY o.order_date DESC;
`;

    db.query(sql, [customerId], (err, results) => {

        if (err) {
            console.error(err);
            return res.status(500).json({
                error: "Database query failed"
            });
        }

        res.json(results);
    });
});


// ANALYTICS
app.get("/api/analytics", (req, res) => {

    const sql = `
        SELECT
            COUNT(DISTINCT c.customer_id) AS customers,
            COUNT(DISTINCT o.order_id) AS orders,
            COALESCE(SUM(o.total_amount), 0) AS revenue
        FROM customers c
        LEFT JOIN orders o
        ON c.customer_id = o.customer_id;
    `;

    db.query(sql, (err, results) => {

        if (err) {
            console.error(err);
            return res.status(500).json({
                error: "Analytics query failed"
            });
        }

        res.json(results[0]);
    });
});


// your existing routes above...


/* ADD TO CART */

// ADD TO CART
app.post("/api/cart", (req, res) => {

    const { customer_id, product_id, quantity } = req.body;

    if (!customer_id || !product_id || !quantity) {
        return res.status(400).json({
            error: "Missing cart information"
        });
    }

    // Check if this product is already in the customer's cart
    const checkSql = `
        SELECT cart_id, quantity
        FROM cart
        WHERE customer_id = ?
        AND product_id = ?
    `;

    db.query(
        checkSql,
        [customer_id, product_id],
        (err, results) => {

            if (err) {
                console.error(err);

                return res.status(500).json({
                    error: "Could not check cart"
                });
            }

            // Product already exists → increase quantity
            if (results.length > 0) {

                const newQuantity =
                    results[0].quantity + quantity;

                const updateSql = `
                    UPDATE cart
                    SET quantity = ?
                    WHERE cart_id = ?
                `;

                db.query(
                    updateSql,
                    [newQuantity, results[0].cart_id],
                    (err) => {

                        if (err) {
                            console.error(err);

                            return res.status(500).json({
                                error: "Could not update cart"
                            });
                        }

                        res.json({
                            success: true,
                            message: "Cart quantity updated",
                            quantity: newQuantity
                        });

                    }
                );

            }

            // Product doesn't exist → create new cart row
            else {

                const insertSql = `
                    INSERT INTO cart
                    (customer_id, product_id, quantity)
                    VALUES (?, ?, ?)
                `;

                db.query(
                    insertSql,
                    [customer_id, product_id, quantity],
                    (err, result) => {

                        if (err) {
                            console.error(err);

                            return res.status(500).json({
                                error: "Could not add item to cart"
                            });
                        }

                        res.json({
                            success: true,
                            message: "Product added to cart",
                            cart_id: result.insertId,
                            quantity: quantity
                        });

                    }
                );

            }

        }
    );
});

// UPDATE CART QUANTITY

app.put("/api/cart", (req, res) => {

    const { customer_id, product_id, quantity } = req.body;

    if (!customer_id || !product_id || quantity < 1) {
        return res.status(400).json({
            error: "Invalid cart information"
        });
    }

    const sql = `
        UPDATE cart
        SET quantity = ?
        WHERE customer_id = ?
        AND product_id = ?
    `;

    db.query(
        sql,
        [quantity, customer_id, product_id],
        (err, result) => {

            if (err) {

                console.error(err);

                return res.status(500).json({
                    error: "Failed to update cart"
                });
            }

            res.json({
                success: true,
                message: "Cart updated"
            });

        }
    );

});


// REMOVE FROM CART

app.delete("/api/cart", (req, res) => {

    const { customer_id, product_id } = req.body;

    if (!customer_id || !product_id) {
        return res.status(400).json({
            error: "Missing cart information"
        });
    }

    const sql = `
        DELETE FROM cart
        WHERE customer_id = ?
        AND product_id = ?
    `;

    db.query(
        sql,
        [customer_id, product_id],
        (err, result) => {

            if (err) {

                console.error(err);

                return res.status(500).json({
                    error: "Failed to remove item from cart"
                });
            }

            res.json({
                success: true,
                message: "Product removed from cart"
            });

        }
    );

});

// ADD / UPDATE CUSTOMER

app.post("/api/customers", (req, res) => {

    const { name, email, phone, city } = req.body;

    if (!name || !email) {
        return res.status(400).json({
            error: "Name and email are required"
        });
    }

    // Check whether customer already exists
    const checkSql = `
        SELECT customer_id
        FROM customers
        WHERE email = ?
    `;

    db.query(
        checkSql,
        [email],
        (err, results) => {

            if (err) {
                console.error(err);

                return res.status(500).json({
                    error: "Could not check customer"
                });
            }

            // Customer already exists
            if (results.length > 0) {

                const customerId =
                    results[0].customer_id;

                const updateSql = `
                    UPDATE customers
                    SET name = ?,
                        phone = ?,
                        city = ?
                    WHERE customer_id = ?
                `;

                db.query(
                    updateSql,
                    [
                        name,
                        phone || null,
                        city || null,
                        customerId
                    ],
                    (err) => {

                        if (err) {
                            console.error(err);

                            return res.status(500).json({
                                error: "Could not update customer"
                            });
                        }

                        res.json({
                            success: true,
                            customer_id: customerId
                        });

                    }
                );

                return;
            }

            // New customer
            const insertSql = `
                INSERT INTO customers
                (name, email, phone, city)
                VALUES (?, ?, ?, ?)
            `;

            db.query(
                insertSql,
                [
                    name,
                    email,
                    phone || null,
                    city || null
                ],
                (err, result) => {

                    if (err) {
                        console.error(err);

                        return res.status(500).json({
                            error: "Could not create customer"
                        });
                    }

                    res.json({
                        success: true,
                        customer_id: result.insertId
                    });

                }
            );

        }
    );

});

app.put("/api/customers/:customerId", (req, res) => {

    const customerId = req.params.customerId;

    const { name, email, phone, city } = req.body;

    if (!name || !email) {
        return res.status(400).json({
            error: "Name and email are required"
        });
    }

    const sql = `
        UPDATE customers
        SET
            name = ?,
            email = ?,
            phone = ?,
            city = ?
        WHERE customer_id = ?
    `;

    db.query(
        sql,
        [
            name,
            email,
            phone || null,
            city || null,
            customerId
        ],
        (err) => {

            if (err) {
                console.error(err);

                return res.status(500).json({
                    error: "Could not update customer"
                });
            }

            res.json({
                success: true,
                customer_id: Number(customerId)
            });

        }
    );

});

// KEEP THIS AT THE VERY BOTTOM

// ==========================================
// CHECKOUT / PLACE ORDER
// ==========================================

app.post("/api/checkout", (req, res) => {

    const { customer_id } = req.body;

    if (!customer_id) {
        return res.status(400).json({
            error: "Customer ID is required"
        });
    }

    // Get customer's cart
    const cartSql = `
        SELECT
            c.cart_id,
            c.product_id,
            c.quantity,
            p.product_name,
            p.price,
            p.stock
        FROM cart c
        JOIN products p
            ON c.product_id = p.product_id
        WHERE c.customer_id = ?
    `;

    db.query(cartSql, [customer_id], (err, cartItems) => {

        if (err) {
            console.error(err);

            return res.status(500).json({
                error: "Could not read cart"
            });
        }

        if (cartItems.length === 0) {
            return res.status(400).json({
                error: "Cart is empty"
            });
        }

        // Check stock
        for (const item of cartItems) {

            if (item.stock < item.quantity) {

                return res.status(400).json({
                    error:
                        `${item.product_name} does not have enough stock`
                });

            }
        }

        // Calculate total
        let total = 0;

        cartItems.forEach(item => {

            total +=
                Number(item.price) * item.quantity;

        });

        // Create order
        const orderSql = `
            INSERT INTO orders
            (customer_id, status, total_amount)
            VALUES (?, 'Processing', ?)
        `;

        db.query(
            orderSql,
            [customer_id, total],
            (err, orderResult) => {

                if (err) {
                    console.error(err);

                    return res.status(500).json({
                        error: "Could not create order"
                    });
                }

                const orderId =
                    orderResult.insertId;


                // Insert order items
                const itemSql = `
                    INSERT INTO order_items
                    (order_id, product_id, quantity, price)
                    VALUES ?
                `;

                const values =
                    cartItems.map(item => [
                        orderId,
                        item.product_id,
                        item.quantity,
                        item.price
                    ]);


                db.query(
                    itemSql,
                    [values],
                    (err) => {

                        if (err) {
                            console.error(err);

                            return res.status(500).json({
                                error:
                                    "Could not create order items"
                            });
                        }


                        // Update stock
                        const stockUpdates =
                            cartItems.map(item => {

                                return new Promise(
                                    (resolve, reject) => {

                                        const stockSql = `
                                            UPDATE products
                                            SET stock = stock - ?
                                            WHERE product_id = ?
                                        `;

                                        db.query(
                                            stockSql,
                                            [
                                                item.quantity,
                                                item.product_id
                                            ],
                                            (err) => {

                                                if (err) {
                                                    reject(err);
                                                } else {
                                                    resolve();
                                                }

                                            }
                                        );

                                    }
                                );

                            });


                        Promise.all(stockUpdates)
                            .then(() => {

                                // Record payment
                                const paymentSql = `
                                    INSERT INTO payments
                                    (order_id,
                                     payment_method,
                                     payment_status,
                                     amount)
                                    VALUES (?, 'UPI',
                                            'Completed', ?)
                                `;

                                db.query(
                                    paymentSql,
                                    [orderId, total],
                                    (err) => {

                                        if (err) {
                                            console.error(err);

                                            return res.status(500).json({
                                                error:
                                                    "Could not record payment"
                                            });
                                        }


                                        // Clear cart
                                        const clearSql = `
                                            DELETE FROM cart
                                            WHERE customer_id = ?
                                        `;

                                        db.query(
                                            clearSql,
                                            [customer_id],
                                            (err) => {

                                                if (err) {
                                                    console.error(err);

                                                    return res.status(500).json({
                                                        error:
                                                            "Could not clear cart"
                                                    });
                                                }


                                                res.json({

                                                    success: true,

                                                    message:
                                                        "Order placed successfully!",

                                                    order_id:
                                                        orderId,

                                                    total:
                                                        total

                                                });

                                            }
                                        );

                                    }
                                );

                            })
                            .catch(error => {

                                console.error(error);

                                res.status(500).json({
                                    error:
                                        "Could not update stock"
                                });

                            });

                    }
                );

            }
        );

    });

});

// ==========================================
// SMARTCART SQL INTELLIGENCE APIs
// ==========================================

// 1. LOW STOCK PRODUCTS
app.get("/api/insights/low-stock", (req, res) => {

    const sql = `
        SELECT
            p.product_name,
            p.stock,
            c.category_name
        FROM products p
        JOIN categories c
            ON p.category_id = c.category_id
        WHERE p.stock <= 8
        ORDER BY p.stock ASC
    `;

    db.query(sql, (err, results) => {

        if (err) {
            console.error(err);

            return res.status(500).json({
                error: "Failed to load low stock products"
            });
        }

        res.json(results);
    });
});


// 2. TOP CUSTOMERS
app.get("/api/insights/top-customers", (req, res) => {

    const sql = `
        SELECT
            c.name,
            COUNT(o.order_id) AS total_orders,
            SUM(o.total_amount) AS total_spent
        FROM customers c
        JOIN orders o
            ON c.customer_id = o.customer_id
        GROUP BY c.customer_id, c.name
        ORDER BY total_spent DESC
        LIMIT 5
    `;

    db.query(sql, (err, results) => {

        if (err) {
            console.error(err);

            return res.status(500).json({
                error: "Failed to load top customers"
            });
        }

        res.json(results);
    });
});


// 3. TOP SELLING PRODUCTS
app.get("/api/insights/top-products", (req, res) => {

    const sql = `
        SELECT
            p.product_name,
            SUM(oi.quantity) AS units_sold
        FROM products p
        JOIN order_items oi
            ON p.product_id = oi.product_id
        GROUP BY p.product_id, p.product_name
        ORDER BY units_sold DESC
        LIMIT 5
    `;

    db.query(sql, (err, results) => {

        if (err) {
            console.error(err);

            return res.status(500).json({
                error: "Failed to load top products"
            });
        }

        res.json(results);
    });
});
// ==========================================
// REVENUE ANALYTICS
// ==========================================

app.get("/api/insights/revenue", (req, res) => {

    const sql = `
        SELECT
            COALESCE(SUM(total_amount), 0) AS total_revenue,
            COUNT(order_id) AS total_orders,
            COALESCE(AVG(total_amount), 0) AS average_order_value
        FROM orders
    `;

    db.query(sql, (err, results) => {

        if (err) {

            console.error(err);

            return res.status(500).json({
                error: "Failed to load revenue analytics"
            });

        }

        res.json(results[0]);

    });

});

// ==========================================
// ORDER HISTORY
// ==========================================

app.get("/api/insights/order-history", (req, res) => {

    const sql = `
    SELECT
        o.order_id,
        o.customer_id,
        o.order_date,
        o.status,

        c.name AS customer_name,
        c.email,
        c.phone,
        c.city,

        p.product_name,
        oi.quantity,
        oi.price,
        (oi.quantity * oi.price) AS item_total,

        o.total_amount

    FROM orders o

    JOIN customers c
        ON o.customer_id = c.customer_id

    JOIN order_items oi
        ON o.order_id = oi.order_id

    JOIN products p
        ON oi.product_id = p.product_id

    ORDER BY o.order_id DESC

    LIMIT 20
`;

    db.query(sql, (err, results) => {

        if (err) {

            console.error(err);

            return res.status(500).json({
                error: "Failed to load order history"
            });

        }

        res.json(results);

    });

});

const PORT = 5000;

app.listen(PORT, () => {
    console.log(`🚀 SmartCart server running on http://localhost:${PORT}`);
});

// ==========================================
// REVENUE ANALYTICS
// ==========================================

app.get("/api/insights/revenue", (req, res) => {

    const sql = `
        SELECT
            COALESCE(SUM(total_amount), 0) AS total_revenue,
            COUNT(order_id) AS total_orders,
            COALESCE(AVG(total_amount), 0) AS average_order_value
        FROM orders
    `;

    db.query(sql, (err, results) => {

        if (err) {

            console.error(err);

            return res.status(500).json({
                error: "Failed to load revenue analytics"
            });

        }

        res.json(results[0]);

    });

});

