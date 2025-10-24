DROP DATABASE IF EXISTS shiplink_db;
CREATE DATABASE shiplink_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE shiplink_db;

CREATE TABLE Customer (
  CustomerID INT AUTO_INCREMENT PRIMARY KEY,
  CustomerName VARCHAR(255) NOT NULL,
  CustomerPhone VARCHAR(32) NOT NULL UNIQUE,
  CustomerAddress TEXT NOT NULL
);

CREATE TABLE Wallet (
  WalletID INT AUTO_INCREMENT PRIMARY KEY,
  Balance DECIMAL(12,2) NOT NULL DEFAULT 0
);

CREATE TABLE Branch (
  BranchID INT AUTO_INCREMENT PRIMARY KEY,
  BranchName VARCHAR(255) NOT NULL,
  BranchAddress TEXT NOT NULL,
  WalletID INT NOT NULL,
  FOREIGN KEY (WalletID) REFERENCES Wallet(WalletID)
);

CREATE TABLE Employee (
  EmployeeID INT AUTO_INCREMENT PRIMARY KEY,
  EmployeeName VARCHAR(255) NOT NULL,
  EmployeePhone VARCHAR(32) NOT NULL,
  EmployeePassword VARCHAR(255) NOT NULL,
  EmployeePosition ENUM('Manager','Staff') NOT NULL DEFAULT 'Staff',
  BranchID INT NOT NULL,
  FOREIGN KEY (BranchID) REFERENCES Branch(BranchID),
  UNIQUE (EmployeePhone)
);

CREATE TABLE ShippingCompany (
  CompanyID INT AUTO_INCREMENT PRIMARY KEY,
  CompanyName VARCHAR(255) NOT NULL,
  CompanyPhone VARCHAR(32) NOT NULL,
  CompanyPassword VARCHAR(255) NOT NULL,
  ShippingRate DECIMAL(10,2) NOT NULL DEFAULT 15.00,
  SharePercent DECIMAL(5,2) NOT NULL DEFAULT 10.00,
  WalletID INT NOT NULL,
  FOREIGN KEY (WalletID) REFERENCES Wallet(WalletID),
  UNIQUE (CompanyPhone)
);

CREATE TABLE PickupRequest (
  RequestID INT AUTO_INCREMENT PRIMARY KEY,
  RequestStatus VARCHAR(64) NOT NULL,
  ScheduledPickupTime DATETIME NULL,
  ActualPickupTime DATETIME NULL,
  PickupStaffName VARCHAR(255) NULL,
  PickupStaffPhone VARCHAR(32) NULL,
  CreatedDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  EmployeeID INT NOT NULL,
  CompanyID INT NOT NULL,
  FOREIGN KEY (EmployeeID) REFERENCES Employee(EmployeeID),
  FOREIGN KEY (CompanyID) REFERENCES ShippingCompany(CompanyID)
);

CREATE TABLE `Order` (
  OrderID INT AUTO_INCREMENT PRIMARY KEY,
  TrackingNumber VARCHAR(64) NULL,
  OrderStatus VARCHAR(64) NOT NULL DEFAULT 'Pending',
  OrderDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ParcelType VARCHAR(64) NOT NULL,
  Width DECIMAL(8,2) NOT NULL DEFAULT 0,
  Weight DECIMAL(8,2) NOT NULL DEFAULT 0,
  Height DECIMAL(8,2) NOT NULL DEFAULT 0,
  Length DECIMAL(8,2) NOT NULL DEFAULT 0,
  ShipCost DECIMAL(10,2) NOT NULL DEFAULT 0,
  AddOnCost DECIMAL(10,2) NOT NULL DEFAULT 0,
  UpdatedAt DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
  IsReturnContacted BOOLEAN NULL,
  SenderID INT NOT NULL,
  ReceiverID INT NOT NULL,
  EmployeeID INT NOT NULL,
  RequestID INT NULL,
  CompanyID INT NOT NULL,
  BranchID INT NOT NULL,  -- <<<<<< เพิ่มคอลัมน์ BranchID
  FOREIGN KEY (SenderID) REFERENCES Customer(CustomerID),
  FOREIGN KEY (ReceiverID) REFERENCES Customer(CustomerID),
  FOREIGN KEY (EmployeeID) REFERENCES Employee(EmployeeID),
  FOREIGN KEY (RequestID) REFERENCES PickupRequest(RequestID),
  FOREIGN KEY (CompanyID) REFERENCES ShippingCompany(CompanyID),
  FOREIGN KEY (BranchID) REFERENCES Branch(BranchID)  -- <<<<<< FK
);

CREATE TABLE TransactionHist (
  TransactionID INT AUTO_INCREMENT PRIMARY KEY,
  TransactionAmount DECIMAL(12,2) NOT NULL,
  TransactionType VARCHAR(64) NOT NULL,
  TransactionDateTime DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  WalletID INT NOT NULL,
  EmployeeID INT NOT NULL,
  BranchID INT NOT NULL,
  CompanyID INT NULL,
  FOREIGN KEY (WalletID) REFERENCES Wallet(WalletID),
  FOREIGN KEY (EmployeeID) REFERENCES Employee(EmployeeID),
  FOREIGN KEY (BranchID) REFERENCES Branch(BranchID),
  FOREIGN KEY (CompanyID) REFERENCES ShippingCompany(CompanyID)
);

-- ---- Seed ----
INSERT INTO Wallet (Balance) VALUES (1000.00);
INSERT INTO Branch (BranchName, BranchAddress, WalletID)
VALUES ('Main Branch', '123 Main Rd', 1);

INSERT INTO Employee (EmployeeName,EmployeePhone,EmployeePassword,EmployeePosition,BranchID)
VALUES ('Santi','0800000000','hash','Manager',1);

INSERT INTO Wallet (Balance) VALUES (0.00);
INSERT INTO ShippingCompany (CompanyName, CompanyPhone, CompanyPassword, ShippingRate, WalletID)
VALUES ('TH01','020000000','hash',15.00,2), ('TH0x','020000001','hash',15.00,2);

INSERT INTO Customer (CustomerName,CustomerPhone,CustomerAddress)
VALUES ('Nunthaporn Leryotpornchai','0933329164','123 Bangbuathong Nonthaburi 11110');

INSERT INTO Wallet (Balance) VALUES (0.00);
INSERT INTO ShippingCompany (CompanyName, CompanyPhone, CompanyPassword, ShippingRate, SharePercent, WalletID)
VALUES
('TH01','020000000','hash',15.00,10.00,2),
('TH0x','020000001','hash',18.00,12.50,2),
('THPST','020000002','hash',14.00, 8.00,2);
