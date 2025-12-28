const pool = require('./db');

class DBConnector {
  static async query(sql, params = []) {
    const [rows] = await pool.execute(sql, params);
    return rows;
  }
  static async getConnection() {
    return pool.getConnection(); // สำหรับทรานแซกชัน
  }
}

module.exports = DBConnector;