class Employee {
  constructor({ EmployeeID, EmployeeName, EmployeePhone, EmployeePassword, EmployeePosition, BranchID }) {
    this.EmployeeID = EmployeeID;
    this.EmployeeName = EmployeeName;
    this.EmployeePhone = EmployeePhone;
    this.EmployeePassword = EmployeePassword;
    this.EmployeePosition = EmployeePosition; // Manager/Staff
    this.BranchID = BranchID;
  }
}
module.exports = Employee;