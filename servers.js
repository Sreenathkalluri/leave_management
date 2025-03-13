require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');

const app = express();
app.use(express.json());
app.use(express.static('public')); // Serve static files

// Database Connection
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

db.connect(err => {
    if (err) console.error("Database connection failed:", err);
    else console.log(" Connected to MySQL");
});

// Get Leave Balance (Formatted Output)
app.get('/leave-balance/:name', (req, res) => {
    const query = "SELECT leave_type, available_days FROM users WHERE name = ?";
    
    db.query(query, [req.params.name], (err, results) => {
        if (err) return res.send(" Error fetching data.");
        if (!results.length) return res.send(` No leave records found for ${req.params.name}.`);

        let response = ` **Leave Balance for ${req.params.name}**:\n\n`;
        results.forEach(row => {
            response += ` **${row.leave_type.toUpperCase()} Leave**: ${row.available_days} days left\n`;
        });

        res.send(response.replace(/\n/g, "<br>")); // Convert newlines to HTML <br> for display
    });
});

// Apply for Leave (Formatted Output)
app.post('/apply-leave', (req, res) => {
    const { name, leave_type, days } = req.body;

    const checkQuery = "SELECT available_days FROM users WHERE name = ? AND leave_type = ?";
    db.query(checkQuery, [name, leave_type], (err, result) => {
        if (err) return res.send(" Error processing request.");
        if (!result.length) return res.send(` User '${name}' or leave type '${leave_type}' not found.`);
        if (result[0].available_days < days) return res.send(`⚠️ Not enough leave available. Only ${result[0].available_days} days left.`);

        const updateQuery = "UPDATE users SET available_days = available_days - ? WHERE name = ? AND leave_type = ?";
        db.query(updateQuery, [days, name, leave_type], () => {
            res.send(` **Leave Applied Successfully!**\n\n **Remaining ${leave_type.toUpperCase()} Leave**: ${result[0].available_days - days} days`.replace(/\n/g, "<br>"));
        });
    });
});

// Start Server
app.listen(5000, () => console.log(" Server running on http://localhost:5000"));
