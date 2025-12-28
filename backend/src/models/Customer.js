class Customer {
  constructor({ CustomerID, CustomerName, CustomerPhone, CustomerAddress }) {
    this.CustomerID = CustomerID;
    this.CustomerName = CustomerName;
    this.CustomerPhone = CustomerPhone;
    this.CustomerAddress = CustomerAddress;
  }
}
module.exports = Customer;