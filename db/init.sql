CREATE DATABASE IF NOT EXISTS shiplink_db;
USE shiplink_db;

CREATE TABLE IF NOT EXISTS parcels (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tracking_number VARCHAR(100) NOT NULL,
  sender VARCHAR(255),
  recipient VARCHAR(255),
  status VARCHAR(50) DEFAULT 'created',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO parcels (tracking_number, sender, recipient, status)
VALUES ('TRACK-0001', 'Alice', 'Bob', 'in_transit');
