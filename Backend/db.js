const mysql = require("mysql2");

const db = mysql.createConnection({
    host: process.env.MYSQLHOST,
    port: Number(process.env.MYSQLPORT || 4000),
    user: process.env.MYSQLUSER,
    password: process.env.MYSQLPASSWORD,
    database: process.env.MYSQL_DATABASE || "smartcart",

    ssl: process.env.MYSQL_SSL === "true"
        ? { minVersion: "TLSv1.2" }
        : undefined
});

db.connect((err) => {
    if (err) {
        console.error("MySQL connection failed:", err.message);
        return;
    }

    console.log("MySQL connected successfully!");
});

module.exports = db;