class ShippingCompany {
  constructor({ CompanyID, CompanyName, CompanyPhone, CompanyPassword, ShippingRate, SharePercent, WalletID }) {
    this.CompanyID = CompanyID;
    this.CompanyName = CompanyName;
    this.CompanyPhone = CompanyPhone;
    this.CompanyPassword = CompanyPassword;
    this.ShippingRate = ShippingRate;
    this.SharePercent = SharePercent;
    this.WalletID = WalletID;
  }
}
module.exports = ShippingCompany;
