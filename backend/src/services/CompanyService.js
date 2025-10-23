const DB = require('../config/DBConnector');
class CompanyService {
  static async list() {
    return DB.query('SELECT CompanyID, CompanyName, ShippingRate, SharePercent FROM ShippingCompany ORDER BY CompanyID');
  }
}
module.exports = CompanyService;
