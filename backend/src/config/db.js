const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'db',
  user: process.env.DB_USER || 'shiplink',
  password: process.env.DB_PASSWORD || 'shiplink_pw',
  database: process.env.DB_NAME || 'shiplink_db',
  waitForConnections: true,
  connectionLimit: 10,
  connectTimeout: 15000,
  acquireTimeout: 15000,
  charset: 'utf8mb4'
});

module.exports = pool;
