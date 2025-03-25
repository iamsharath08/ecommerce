const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();
console.log("Loaded ENV Variables:", process.env);

const app = express();
app.use(express.json());

// Enable CORS for your frontend origin only
app.use(cors({
	origin: 'http://172.18.0.4:3000',  // Only allow frontend origin
    methods: "GET,POST,PUT,DELETE",
    allowedHeaders: "Content-Type, Authorization",
}));

// MySQL Connection Using Environment Variables
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

db.connect((err) => {
    if (err) {
        console.error("Database Connection Error:", err);
        process.exit(1);
    }
    console.log("MySQL Connected...");
});

// Middleware to verify token
const authenticateToken = (req, res, next) => {
    const token = req.headers["authorization"];
    console.log("Received Token:", token);  // Log the token here

    if (!token) return res.status(403).json({ message: "Token required" });

    // Remove the 'Bearer ' prefix from the token if it exists
    const actualToken = token.split(' ')[1];

    jwt.verify(actualToken, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ message: "Invalid token" });
        req.user = user;
        next();
    });
};

// **User Login API**
app.post("/login", (req, res) => {
    const { email, password } = req.body;
    db.query("SELECT * FROM users WHERE email = ?", [email], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });

        if (results.length === 0) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        const user = results[0];
        bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err) return res.status(500).json({ error: err.message });

            if (!isMatch) {
                return res.status(401).json({ message: "Invalid email or password" });
            }

            const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });

            res.json({
                token,
                userId: user.id,
                firstName: user.first_name,
                lastName: user.last_name,
                email: user.email,
                phoneNumber: user.phone_number || "",
                address: user.address || "Not available"
            });
        });
    });
});

// **User Signup API**
app.post("/signup", (req, res) => {
    const { firstName, lastName, email, phoneNumber, address, password } = req.body;

    // Check if all fields are provided
    if (!firstName || !lastName || !email || !phoneNumber || !address || !password) {
        return res.status(400).json({ message: "All fields are required" });
    }

    // Check if the email already exists
    db.query("SELECT * FROM users WHERE email = ?", [email], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });

        if (results.length > 0) {
            return res.status(400).json({ message: "Email already in use" });
        }

        // Hash the password before storing it
        bcrypt.hash(password, 10, (err, hashedPassword) => {
            if (err) return res.status(500).json({ error: err.message });

            // Insert the new user into the database
            db.query(
                "INSERT INTO users (first_name, last_name, email, phone_number, address, password) VALUES (?, ?, ?, ?, ?, ?)",
                [firstName, lastName, email, phoneNumber, address, hashedPassword],
                (err, result) => {
                    if (err) return res.status(500).json({ error: err.message });

                    // Send a success response
                    res.status(201).json({
                        message: "User created successfully",
                        userId: result.insertId,
                    });
                }
            );
        });
    });
});

// **Get User Profile**
app.get("/profile", authenticateToken, (req, res) => {
    console.log("User ID from token:", req.user.userId);  // Log user ID from token
    db.query("SELECT * FROM users WHERE id = ?", [req.user.userId], (err, result) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ error: err.message });
        }
        if (result.length === 0) {
            console.log("User not found in DB");
            return res.status(404).json({ message: "User not found" });
        }

        const user = result[0];
        console.log("Fetched User:", user);  // Log fetched user data

        res.json({
            id: user.id,
            firstName: user.first_name,
            lastName: user.last_name,
            email: user.email,
            phoneNumber: user.phone_number || "",
            address: user.address || "Not available"
        });
    });
});


// **Save NEW Address**
app.post("/add-address", authenticateToken, (req, res) => {
    const { C_name, mobile, pincode, locality, D_Address, city, state, landmark, Alter_mobile } = req.body;

    if (!req.user || !req.user.userId) {
        return res.status(401).json({ error: "Unauthorized user" });
    }

    const userId = req.user.userId;

    db.query(
        "INSERT INTO address (id, C_name, mobile, pincode, locality, D_Address, city, state, landmark, Alter_mobile) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [userId, C_name, mobile, pincode, locality, D_Address, city, state, landmark, Alter_mobile],
        (err, result) => {
            if (err) {
                console.error("Error adding address:", err);
                return res.status(500).json({ error: err.message });
            }
            res.json({ message: "Address added successfully", A_id: result.insertId });
        }
    );
});

// DELETING ADDRESS
app.delete("/delete-address/:A_id", authenticateToken, (req, res) => {
    const { A_id } = req.params;

    if (!A_id || A_id === "undefined") {
        return res.status(400).json({ error: "Invalid address ID" });
    }

    db.query(
        "DELETE FROM address WHERE A_id = ?",
        [A_id],
        (err, result) => {
            if (err) {
                console.error("Error deleting address:", err);
                return res.status(500).json({ error: err.message });
            }
            res.json({ message: "Address deleted successfully" }); 
         
          
        }
    );

    
});

//delete address

  

//fetching address
app.get("/addresses", authenticateToken, (req, res) => {
    console.log("User ID from token:", req.user.userId);  

    db.query("SELECT * FROM address WHERE id = ?", [req.user.userId], (err, results) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ error: err.message });
        }

     
        // Transform results into an array of addresses
        const addresses = results.map(address => ({
            id: address.id, 
            a_id: address.A_id, // Ensure lowercase a_id
            C_name: address.C_name, 
            mobile: address.mobile, 
            pincode: address.pincode,
            locality: address.locality,
            D_Address: address.D_Address,
            city: address.city,
            state: address.state,
            landmark: address.landmark,
            Alter_mobile: address.Alter_mobile
        }));

        res.json(addresses); // Send an array of addresses
    });
});

//api for order creation
app.post("/place-order", authenticateToken, (req, res) => {
    const { addressId, orderDate, paymentMode, products, totalAmount, transaction_id } = req.body;
    console.log("📥 Received Order Data:", req.body);

    if (!products || products.length === 0) {
        console.error("❌ Order Validation Failed: No Products in Order");
        return res.status(400).json({ success: false, message: "Order must contain at least one product." });
    }

    const userId = req.user?.userId || req.body.userId;
    const formattedOrderDate = new Date(orderDate).toISOString().slice(0, 19).replace("T", " ");

    const orderQuery = "INSERT INTO orders (user_id, address_id, total_amount, payment_mode, order_status, order_date) VALUES (?, ?, ?, ?, ?, ?)";

    db.query(orderQuery, [userId, addressId, totalAmount, paymentMode, "Pending", formattedOrderDate], (err, orderResult) => {
        if (err) {
            console.error("❌ Error inserting order:", err);
            return res.status(500).json({ success: false, error: "Error placing order." });
        }

        const orderId = orderResult.insertId;
        console.log("✅ Order Inserted with ID:", orderId);

        const itemQuery = "INSERT INTO order_items (order_id, product_name, quantity, price) VALUES ?";
        const itemValues = products.map(item => [orderId, item.productName, item.quantity, item.price]);

        db.query(itemQuery, [itemValues], (err) => {
            if (err) {
                console.error("❌ Error inserting order items:", err);
                return res.status(500).json({ success: false, error: "Error saving order items." });
            }

            const paymentQuery = "INSERT INTO payments (order_id, payment_mode, payment_status, transaction_id, payment_date) VALUES (?, ?, ?, ?, ?)";
            db.query(paymentQuery, [orderId, paymentMode, "Pending", transaction_id || null, new Date().toISOString().slice(0, 19).replace("T", " ")], (err) => {
                if (err) {
                    console.error("❌ Error inserting payment details:", err);
                    return res.status(500).json({ success: false, error: "Error saving payment details." });
                }

                console.log("✅ Order placed successfully! Sending response...");
                res.status(201).json({
                    success: true,
                    message: "Order placed successfully",
                    orderId: orderId
                });
            });
        });
    });
});
// New API routes added to the existing server.js

// **Get Orders for Logged-in User**
app.get("/orders", authenticateToken, (req, res) => {
    const userId = req.user.userId;
    
    db.query("SELECT * FROM orders WHERE user_id = ?", [userId], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

/**
 * 📦 Get order details (items & payment)
 * Endpoint: GET /orders/:orderId
 */
app.get("/orders", async (req, res) => {
    try {
        const [orders] = await db.query(`
            SELECT o.order_id, SUM(oi.price * oi.quantity) AS total_amount
            FROM orders o
            JOIN order_items oi ON o.order_id = oi.order_id
            GROUP BY o.order_id
        `);
        res.json(orders);
    } catch (error) {
        console.error("Error fetching orders:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});



app.get("/orders/:orderId", authenticateToken, (req, res) => {
    const { orderId } = req.params;

    // Fetch order items
    db.query(
        "SELECT product_name, quantity, price FROM order_items WHERE order_id = ?",
        [orderId],
        (err, items) => {
            if (err) {
                console.error("Database Query Error:", err);
                return res.status(500).json({ message: "Error fetching order items" });
            }

            // Fetch payment details
            db.query(
                "SELECT payment_mode, payment_status, transaction_id, payment_date FROM payments WHERE order_id = ?",
                [orderId],
                (err, payment) => {
                    if (err) {
                        console.error("Database Query Error:", err);
                        return res.status(500).json({ message: "Error fetching payment details" });
                    }

                    // Fetch address details
                    db.query(
                        `SELECT C_name, mobile, pincode, locality, D_Address, city, state, landmark, Alter_mobile
                         FROM Address 
                         WHERE A_id = (SELECT address_id FROM orders WHERE order_id = ?)`,
                        [orderId],
                        (err, address) => {
                            if (err) {
                                console.error("Database Query Error:", err);
                                return res.status(500).json({ message: "Error fetching address details" });
                            }

                            // Send the response
                            res.json({
                                items,
                                payment: payment.length > 0 ? payment[0] : {},
                                address: address.length > 0 ? address[0] : {}
                            });
                        }
                    );
                }
            );
        }
    );
});


// **Update User Profile**
app.put("/update-profile", authenticateToken, (req, res) => {
    const { firstName, lastName, phoneNumber, address } = req.body;
    const userId = req.user.userId;
    
    db.query("UPDATE users SET first_name = ?, last_name = ?, phone_number = ?, address = ? WHERE id = ?", [firstName, lastName, phoneNumber, address, userId], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Profile updated successfully" });
    });
});




// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${process.env.PORT}`));
