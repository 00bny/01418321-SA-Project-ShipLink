const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'db',
  user: process.env.DB_USER || 'shiplink',
  password: process.env.DB_PASSWORD || 'shiplink_pw',
  database: process.env.DB_NAME || 'shiplink_db',
  waitForConnections: true,
  connectionLimit: 10
});

module.exports = pool;
