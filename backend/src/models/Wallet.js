class Wallet {
  constructor({ WalletID, Balance }) {
    this.WalletID = WalletID;
    this.Balance = Number(Balance);
  }
}
module.exports = Wallet;
