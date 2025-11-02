DROP DATABASE IF EXISTS shiplink_db;
CREATE DATABASE shiplink_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE shiplink_db;
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

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
VALUES ('Chip & Dale Express','0987654322','$2a$10$T1B58WgXY3I6E88/2wdH5u6ghn/YKFGo3iitUpt47LuveRXFJ1je.',13.00,12.00,3);

INSERT INTO Wallet (Balance) VALUES (645.00);
INSERT INTO ShippingCompany (CompanyName, CompanyPhone, CompanyPassword, ShippingRate, WalletID)
VALUES ('Anaconda Express','0987654323','$2a$10$T1B58WgXY3I6E88/2wdH5u6ghn/YKFGo3iitUpt47LuveRXFJ1je.',14.50,4);

INSERT INTO Wallet (Balance) VALUES (1000.00);
INSERT INTO ShippingCompany (CompanyName, CompanyPhone, CompanyPassword, ShippingRate, WalletID)
VALUES ('RICH Express','0987654324','$2a$10$T1B58WgXY3I6E88/2wdH5u6ghn/YKFGo3iitUpt47LuveRXFJ1je.',13.25,5);

-- INSERT INTO Customer (CustomerName,CustomerPhone,CustomerAddress)
-- VALUES ('Warali Foochareon','0999999999','123 Somewhere In Bangkok 99999');

INSERT INTO Customer (CustomerName, CustomerPhone, CustomerAddress) VALUES
('Natnicha Woraset',        '0891110001', 'Ratchayothin, Bangkok 10900'),
('Phurit Kasemsan',         '0891110002', 'Bangna-Trad Rd, Bangkok 10260'),
('Kanyarat Srisuwan',       '0891110003', 'Sukhumvit 81, Bangkok 10250'),
('Thanawat Meesiri',        '0891110004', 'The Mall Ngamwongwan, Nonthaburi 11000'),
('Pimchanok Limsakul',      '0891110005', 'Future Park Rangsit, Pathum Thani 12130'),
('Nattapong Siriphan',      '0891110006', 'Don Mueang, Bangkok 10210'),
('Suphawadee Charoensuk',   '0891110007', 'Hua Mak, Bangkok 10240'),
('Jirawat Thongchai',       '0891110008', 'Samut Prakan 10270'),
('Pattarawadee Nimitmai',   '0891110009', 'Yaek Kor Por Aor, Ladkrabang, Bangkok 10520'),
('Chananan Kachornchai',    '0891110010', 'Muang Thong Thani, Nonthaburi 11120');

-- PR1: RequestedPickup (วันนี้ บ่าย 2 โมง)
INSERT INTO PickupRequest (
  RequestStatus, ScheduledPickupTime, ActualPickupTime, PickupStaffName, PickupStaffPhone,
  CreatedDate, EmployeeID, CompanyID, BranchID
) VALUES (
  'RequestedPickup',
  NULL,
  NULL,
  NULL,
  NULL,
  CURRENT_TIMESTAMP,
  2, 1, 1
);

-- PR2: PickingUp (นัดตอนนี้ และเริ่มเข้ารับแล้ว)
INSERT INTO PickupRequest (
  RequestStatus, ScheduledPickupTime, ActualPickupTime, PickupStaffName, PickupStaffPhone,
  CreatedDate, EmployeeID, CompanyID, BranchID
) VALUES (
  'PickingUp',
  CURRENT_TIMESTAMP,
  Null,
  'Somchai Rider',
  '0912345678',
  CURRENT_TIMESTAMP - INTERVAL 1 HOUR,
  2, 1, 1
);

-- PR3: PickedUp (รับเสร็จเมื่อวาน)
INSERT INTO PickupRequest (
  RequestStatus, ScheduledPickupTime, ActualPickupTime, PickupStaffName, PickupStaffPhone,
  CreatedDate, EmployeeID, CompanyID, BranchID
) VALUES (
  'PickedUp',
  CURRENT_TIMESTAMP - INTERVAL 1 DAY + INTERVAL 3 HOUR,
  CURRENT_TIMESTAMP - INTERVAL 1 DAY + INTERVAL 4 HOUR,
  'Anan Courier',
  '0901112233',
  CURRENT_TIMESTAMP - INTERVAL 1 DAY,
  2, 1, 1
);

-- PR4: Rejected (ปฏิเสธรอบรับช่วงเช้า)
INSERT INTO PickupRequest (
  RequestStatus, ScheduledPickupTime, ActualPickupTime, PickupStaffName, PickupStaffPhone,
  CreatedDate, EmployeeID, CompanyID, BranchID
) VALUES (
  'Rejected',
  NULL,
  NULL,
  NULL,
  NULL,
  CURRENT_TIMESTAMP - INTERVAL 4 HOUR,
  2, 1, 1
);

-- INSERT INTO `Order` (TrackingNumber,OrderStatus,OrderDate,ParcelType,Width,Weight,Height,Length,ShipCost,AddOnCost,UpdatedAt,SenderID,ReceiverID,EmployeeID,CompanyID,BranchID)
-- VALUES ('TH5396441','Paid',CURRENT_TIMESTAMP,'-',1,1.00,1,1,30.00,0.00,CURRENT_TIMESTAMP,1,1,2,1,1);

-- INSERT INTO `Order` (TrackingNumber,OrderStatus,OrderDate,ParcelType,Width,Weight,Height,Length,ShipCost,AddOnCost,UpdatedAt,SenderID,ReceiverID,EmployeeID,CompanyID,BranchID)
-- VALUES ('TH5396442','In Transit',CURRENT_TIMESTAMP,'-',1,1.00,1,1,30.00,0.00,CURRENT_TIMESTAMP,1,1,2,3,1);

-- INSERT INTO `Order` (TrackingNumber,OrderStatus,OrderDate,ParcelType,Width,Weight,Height,Length,ShipCost,AddOnCost,UpdatedAt,IsReturnContacted,SenderID,ReceiverID,EmployeeID,CompanyID,BranchID)
-- VALUES ('TH5396443','Return',CURRENT_TIMESTAMP,'Document',1,1.00,1,1,30.00,0.00,CURRENT_TIMESTAMP,FALSE,1,1,2,2,1);

-- 1) Pending (ยังไม่ชำระ, ไม่มี RequestID)
INSERT INTO `Order` (
  TrackingNumber, OrderStatus, OrderDate, ParcelType, Width, Weight, Height, Length,
  ShipCost, AddOnCost, UpdatedAt, IsReturnContacted,
  SenderID, ReceiverID, EmployeeID, RequestID, CompanyID, BranchID, FailReason, ReturnCount
) VALUES
('TH7000001','Pending',CURRENT_TIMESTAMP,'เสื้อผ้า',30,0.50,5,25,40.00,0.00,CURRENT_TIMESTAMP,NULL, 2,4,2,NULL,1,1,NULL,0);

-- 2) Paid (ชำระแล้ว, ยังไม่เรียกเข้ารับ, ไม่มี RequestID)
INSERT INTO `Order` (
  TrackingNumber, OrderStatus, OrderDate, ParcelType, Width, Weight, Height, Length,
  ShipCost, AddOnCost, UpdatedAt, IsReturnContacted,
  SenderID, ReceiverID, EmployeeID, RequestID, CompanyID, BranchID, FailReason, ReturnCount
) VALUES
('TH7000002','Paid',CURRENT_TIMESTAMP,'อาหารแห้ง',20,1.20,15,20,55.00,5.00,CURRENT_TIMESTAMP,NULL, 3,5,2,NULL,1,1,NULL,0);

-- 3) RequestedPickup (เพิ่งกดเรียกเข้ารับ → ผูกกับ PR1)
INSERT INTO `Order` (
  TrackingNumber, OrderStatus, OrderDate, ParcelType, Width, Weight, Height, Length,
  ShipCost, AddOnCost, UpdatedAt, IsReturnContacted,
  SenderID, ReceiverID, EmployeeID, RequestID, CompanyID, BranchID, FailReason, ReturnCount
) VALUES
('TH7000003','RequestedPickup',CURRENT_TIMESTAMP,'เอกสาร',22,0.30,3,15,25.00,0.00,CURRENT_TIMESTAMP,NULL, 6,7,2, 1, 1,1,NULL,0),
('TH7000004','RequestedPickup',CURRENT_TIMESTAMP,'อุปกรณ์ไอที',18,0.80,10,18,65.00,10.00,CURRENT_TIMESTAMP,NULL, 2,8,2, 1, 1,1,NULL,0);

-- 4) Pickup (บริษัทกำลังเข้ารับ → ผูกกับ PR2 ที่กำลัง PickingUp)
INSERT INTO `Order` (
  TrackingNumber, OrderStatus, OrderDate, ParcelType, Width, Weight, Height, Length,
  ShipCost, AddOnCost, UpdatedAt, IsReturnContacted,
  SenderID, ReceiverID, EmployeeID, RequestID, CompanyID, BranchID, FailReason, ReturnCount
) VALUES
('TH7000005','Pickup',CURRENT_TIMESTAMP,'รองเท้า กระเป๋า',25,1.00,12,28,70.00,0.00,CURRENT_TIMESTAMP,NULL, 7,4,2, 2, 1,1,NULL,0);

-- 5) In Transit (รับไปแล้วและกำลังจัดส่ง → ผูกกับ PR3 ที่ PickedUp)
INSERT INTO `Order` (
  TrackingNumber, OrderStatus, OrderDate, ParcelType, Width, Weight, Height, Length,
  ShipCost, AddOnCost, UpdatedAt, IsReturnContacted,
  SenderID, ReceiverID, EmployeeID, RequestID, CompanyID, BranchID, FailReason, ReturnCount
) VALUES
('TH7000006','In Transit',CURRENT_TIMESTAMP - INTERVAL 1 DAY,'เครื่องสำอางค์',15,0.60,8,20,45.00,0.00,CURRENT_TIMESTAMP,NULL, 5,3,2, 3, 1,1,NULL,0);

-- 6) Success (จัดส่งสำเร็จ → ผูกกับ PR3)
INSERT INTO `Order` (
  TrackingNumber, OrderStatus, OrderDate, ParcelType, Width, Weight, Height, Length,
  ShipCost, AddOnCost, UpdatedAt, IsReturnContacted,
  SenderID, ReceiverID, EmployeeID, RequestID, CompanyID, BranchID, FailReason, ReturnCount
) VALUES
('TH7000007','Success',CURRENT_TIMESTAMP - INTERVAL 1 DAY,'ของใช้',28,0.90,10,25,60.00,0.00,CURRENT_TIMESTAMP,NULL, 2,5,2, 3, 1,1,NULL,0);

-- 7) Fail (จัดส่งไม่สำเร็จ → ผูกกับ PR3 และมี FailReason)
INSERT INTO `Order` (
  TrackingNumber, OrderStatus, OrderDate, ParcelType, Width, Weight, Height, Length,
  ShipCost, AddOnCost, UpdatedAt, IsReturnContacted,
  SenderID, ReceiverID, EmployeeID, RequestID, CompanyID, BranchID, FailReason, ReturnCount
) VALUES
('TH7000008','Fail',CURRENT_TIMESTAMP - INTERVAL 1 DAY,'สื่อบันเทิง',20,0.70,6,22,35.00,0.00,CURRENT_TIMESTAMP,NULL, 6,4,2, 3, 1,1,'ปลายทางปิดบ้าน/ติดต่อไม่ได้',0);

-- 8) Return (ตีกลับ → ผูกกับ PR3 และเพิ่ม ReturnCount, ติดต่อผู้ส่งแล้ว)
INSERT INTO `Order` (
  TrackingNumber, OrderStatus, OrderDate, ParcelType, Width, Weight, Height, Length,
  ShipCost, AddOnCost, UpdatedAt, IsReturnContacted,
  SenderID, ReceiverID, EmployeeID, RequestID, CompanyID, BranchID, FailReason, ReturnCount
) VALUES
('TH7000009','Return',CURRENT_TIMESTAMP - INTERVAL 2 DAY,'อะไหล่รถยนต์',35,2.50,20,40,120.00,15.00,CURRENT_TIMESTAMP,TRUE, 3,2,2, 3, 1,1,'ผู้รับปฏิเสธพัสดุ',1);

-- (ออปชัน) เคสคำขอถูก Rejected: ออเดอร์กลับไปเป็น Paid และตัด RequestID ออก
INSERT INTO `Order` (
  TrackingNumber, OrderStatus, OrderDate, ParcelType, Width, Weight, Height, Length,
  ShipCost, AddOnCost, UpdatedAt, IsReturnContacted,
  SenderID, ReceiverID, EmployeeID, RequestID, CompanyID, BranchID, FailReason, ReturnCount
) VALUES
('TH7000010','Paid',CURRENT_TIMESTAMP,'เฟอร์นิเจอร์',40,4.20,30,60,250.00,20.00,CURRENT_TIMESTAMP,NULL, 7,8,2, NULL, 1,1, NULL,0);

INSERT INTO Wallet (Balance) VALUES (1234.00);
INSERT INTO Branch (BranchName, BranchAddress, WalletID)
VALUES ('ShipLink Bangbuathong', '123 Main Rd', 6);