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
  BranchID INT NOT NULL,
  FOREIGN KEY (EmployeeID) REFERENCES Employee(EmployeeID),
  FOREIGN KEY (CompanyID) REFERENCES ShippingCompany(CompanyID),
  FOREIGN KEY (BranchID) REFERENCES Branch(BranchID)
);

CREATE TABLE `Order` (
  OrderID INT AUTO_INCREMENT PRIMARY KEY,
  TrackingNumber VARCHAR(64) NULL,
  OrderStatus VARCHAR(64) NOT NULL DEFAULT 'Pending', -- รอชำระเงิน (Pending) > ชำระเงินแล้ว (Paid) > รอเข้ารับ (RequestedPickup) > เข้ารับพัสดุแล้ว (Pickup) > อยู่ระหว่างจัดส่ง (In Transit) > จัดส่งเสร็จสิน (Success) / จัดส่งไม่สำเร็จ (Fail) / ตีกลับ (Return)
  OrderDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ParcelType VARCHAR(64) NOT NULL,
  Width DECIMAL(8,2) NOT NULL DEFAULT 0,
  Weight DECIMAL(8,2) NOT NULL DEFAULT 0,
  Height DECIMAL(8,2) NOT NULL DEFAULT 0,
  Length DECIMAL(8,2) NOT NULL DEFAULT 0,
  ShipCost DECIMAL(10,2) NOT NULL DEFAULT 0,
  AddOnCost DECIMAL(10,2) NOT NULL DEFAULT 0,
  UpdatedAt DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  IsReturnContacted BOOLEAN NULL,
  SenderID INT NOT NULL,
  ReceiverID INT NOT NULL,
  EmployeeID INT NOT NULL,
  RequestID INT NULL,
  CompanyID INT NOT NULL,
  BranchID INT NOT NULL,
  FOREIGN KEY (SenderID) REFERENCES Customer(CustomerID),
  FOREIGN KEY (ReceiverID) REFERENCES Customer(CustomerID),
  FOREIGN KEY (EmployeeID) REFERENCES Employee(EmployeeID),
  FOREIGN KEY (RequestID) REFERENCES PickupRequest(RequestID),
  FOREIGN KEY (CompanyID) REFERENCES ShippingCompany(CompanyID),
  FOREIGN KEY (BranchID) REFERENCES Branch(BranchID)
);

CREATE TABLE TransactionHist (
  TransactionID INT AUTO_INCREMENT PRIMARY KEY,
  TransactionAmount DECIMAL(12,2) NOT NULL,
  TransactionType VARCHAR(64) NOT NULL,
  TransactionDateTime DATETIME NOT NULL DEFAULT (CURRENT_TIMESTAMP + INTERVAL 7 HOUR),
  WalletID INT NOT NULL,
  EmployeeID INT NULL,
  BranchID INT NULL,
  CompanyID INT NULL,
  FOREIGN KEY (WalletID) REFERENCES Wallet(WalletID),
  FOREIGN KEY (EmployeeID) REFERENCES Employee(EmployeeID),
  FOREIGN KEY (BranchID) REFERENCES Branch(BranchID),
  FOREIGN KEY (CompanyID) REFERENCES ShippingCompany(CompanyID)
);

ALTER TABLE `Order`
ADD COLUMN FailReason TEXT NULL;

ALTER TABLE `Order`
ADD COLUMN ReturnCount INT NOT NULL DEFAULT 0;

-- ---- Seed ----
INSERT INTO Wallet (Balance) VALUES (1000.00);
INSERT INTO Branch (BranchName, BranchAddress, WalletID)
VALUES ('ShipLink Bangkhen', '123 Main Rd', 1);

-- รหัสผ่านคือ 1 --
INSERT INTO Employee (EmployeeName,EmployeePhone,EmployeePassword,EmployeePosition,BranchID)
VALUES ('Santi','0800000000','$2a$10$T1B58WgXY3I6E88/2wdH5u6ghn/YKFGo3iitUpt47LuveRXFJ1je.','Manager',1);

-- รหัสผ่านคือ 1 --
INSERT INTO Employee (EmployeeName,EmployeePhone,EmployeePassword,EmployeePosition,BranchID)
VALUES ('Nunthaporn Leryotpornchai','0810000000','$2a$10$T1B58WgXY3I6E88/2wdH5u6ghn/YKFGo3iitUpt47LuveRXFJ1je.','Staff',1);

INSERT INTO Wallet (Balance) VALUES (645.00);
INSERT INTO ShippingCompany (CompanyName, CompanyPhone, CompanyPassword, ShippingRate, SharePercent, WalletID)
VALUES ('Unicorn Express','0987654321','$2a$10$T1B58WgXY3I6E88/2wdH5u6ghn/YKFGo3iitUpt47LuveRXFJ1je.',15.00,11.50,2);

INSERT INTO Wallet (Balance) VALUES (500.00);
INSERT INTO ShippingCompany (CompanyName, CompanyPhone, CompanyPassword, ShippingRate, SharePercent, WalletID)
VALUES ('Hell Express','0987654322','$2a$10$T1B58WgXY3I6E88/2wdH5u6ghn/YKFGo3iitUpt47LuveRXFJ1je.',13.00,12.00,3);

INSERT INTO Wallet (Balance) VALUES (645.00);
INSERT INTO ShippingCompany (CompanyName, CompanyPhone, CompanyPassword, ShippingRate, WalletID)
VALUES ('Anaconda Express','0987654323','$2a$10$T1B58WgXY3I6E88/2wdH5u6ghn/YKFGo3iitUpt47LuveRXFJ1je.',14.50,4);

INSERT INTO Wallet (Balance) VALUES (1000.00);
INSERT INTO ShippingCompany (CompanyName, CompanyPhone, CompanyPassword, ShippingRate, WalletID)
VALUES ('RICH Express','0987654324','$2a$10$T1B58WgXY3I6E88/2wdH5u6ghn/YKFGo3iitUpt47LuveRXFJ1je.',13.25,5);

INSERT INTO Customer (CustomerName,CustomerPhone,CustomerAddress)
VALUES ('Warali Foochareon','0999999999','123 Somewhere In Bangkok 99999');

INSERT INTO `Order` (OrderStatus,OrderDate,ParcelType,Width,Weight,Height,Length,ShipCost,AddOnCost,UpdatedAt,SenderID,ReceiverID,EmployeeID,CompanyID,BranchID)
VALUES ('Paid',CURRENT_TIMESTAMP,'-',1,1.00,1,1,30.00,0.00,CURRENT_TIMESTAMP,1,1,2,1,1);

INSERT INTO `Order` (TrackingNumber,OrderStatus,OrderDate,ParcelType,Width,Weight,Height,Length,ShipCost,AddOnCost,UpdatedAt,SenderID,ReceiverID,EmployeeID,CompanyID,BranchID)
VALUES ('TH42354353','In Transit',CURRENT_TIMESTAMP,'-',1,1.00,1,1,30.00,0.00,CURRENT_TIMESTAMP,1,1,2,3,1);

INSERT INTO `Order` (TrackingNumber,OrderStatus,OrderDate,ParcelType,Width,Weight,Height,Length,ShipCost,AddOnCost,UpdatedAt,IsReturnContacted,SenderID,ReceiverID,EmployeeID,CompanyID,BranchID)
VALUES ('TH34234231','Return',CURRENT_TIMESTAMP,'Document',1,1.00,1,1,30.00,0.00,CURRENT_TIMESTAMP,FALSE,1,1,2,2,1);

INSERT INTO Wallet (Balance) VALUES (1234.00);
INSERT INTO Branch (BranchName, BranchAddress, WalletID)
VALUES ('ShipLink Bangbuathong', '123 Main Rd', 6);