const mysql = require("mysql2");

const db = mysql.createConnection({
    host: process.env.MYSQLHOST || "localhost",
    port: process.env.MYSQLPORT || 3306,
    user: process.env.MYSQLUSER || "root",
    password: process.env.MYSQLPASSWORD || "SmartCart@123",
    database: process.env.MYSQLDATABASE || "smartcart"
});

db.connect((err) => {

    if (err) {
        console.error(
            "❌ MySQL connection failed:",
            err.message
        );
        return;
    }

    console.log(
        "✅ MySQL connected successfully!"
    );

});

module.exports = db;