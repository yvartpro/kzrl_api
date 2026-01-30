-- Database Schema for Bar & Stock Management System
-- Generated from Sequelize Models

CREATE DATABASE IF NOT EXISTS bar_stock_db;
USE bar_stock_db;

-- 1. Roles table
CREATE TABLE IF NOT EXISTS `Roles` (
  `id` CHAR(36) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE (`name`)
) ENGINE=InnoDB;

-- 2. Users table
CREATE TABLE IF NOT EXISTS `Users` (
  `id` CHAR(36) NOT NULL,
  `username` VARCHAR(255) NOT NULL,
  `passwordHash` VARCHAR(255) NOT NULL,
  `isActive` TINYINT(1) DEFAULT 1,
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  `RoleId` CHAR(36),
  PRIMARY KEY (`id`),
  UNIQUE (`username`),
  FOREIGN KEY (`RoleId`) REFERENCES `Roles` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

-- 3. Categories table
CREATE TABLE IF NOT EXISTS `Categories` (
  `id` CHAR(36) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE (`name`)
) ENGINE=InnoDB;

-- 4. Suppliers table
CREATE TABLE IF NOT EXISTS `Suppliers` (
  `id` CHAR(36) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `contact` VARCHAR(255),
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB;

-- 5. Products table
CREATE TABLE IF NOT EXISTS `Products` (
  `id` CHAR(36) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `purchaseUnit` ENUM('BOX', 'UNIT') NOT NULL DEFAULT 'BOX',
  `baseUnit` ENUM('UNIT') NOT NULL DEFAULT 'UNIT',
  `unitsPerBox` INTEGER NOT NULL DEFAULT 1,
  `purchasePrice` DECIMAL(10, 2) NOT NULL,
  `sellingPrice` DECIMAL(10, 2) NOT NULL,
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  `CategoryId` CHAR(36),
  `SupplierId` CHAR(36),
  PRIMARY KEY (`id`),
  FOREIGN KEY (`CategoryId`) REFERENCES `Categories` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  FOREIGN KEY (`SupplierId`) REFERENCES `Suppliers` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

-- 6. Stocks table
CREATE TABLE IF NOT EXISTS `Stocks` (
  `id` CHAR(36) NOT NULL,
  `quantity` INTEGER NOT NULL DEFAULT 0,
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  `ProductId` CHAR(36),
  PRIMARY KEY (`id`),
  FOREIGN KEY (`ProductId`) REFERENCES `Products` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

-- 7. StockMovements table
CREATE TABLE IF NOT EXISTS `StockMovements` (
  `id` CHAR(36) NOT NULL,
  `type` ENUM('IN', 'OUT', 'ADJUSTMENT') NOT NULL,
  `reason` ENUM('PURCHASE', 'SALE', 'LOSS', 'FREE', 'ADJUSTMENT') NOT NULL,
  `quantityChange` INTEGER NOT NULL,
  `previousQuantity` INTEGER NOT NULL,
  `newQuantity` INTEGER NOT NULL,
  `description` VARCHAR(255),
  `referenceId` CHAR(36),
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  `StockId` CHAR(36),
  PRIMARY KEY (`id`),
  FOREIGN KEY (`StockId`) REFERENCES `Stocks` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

-- 8. Purchases table
CREATE TABLE IF NOT EXISTS `Purchases` (
  `id` CHAR(36) NOT NULL,
  `status` ENUM('PENDING', 'COMPLETED', 'CANCELLED') DEFAULT 'PENDING',
  `totalCost` DECIMAL(10, 2) DEFAULT 0.00,
  `notes` TEXT,
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  `SupplierId` CHAR(36),
  PRIMARY KEY (`id`),
  FOREIGN KEY (`SupplierId`) REFERENCES `Suppliers` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

-- 9. PurchaseItems table
CREATE TABLE IF NOT EXISTS `PurchaseItems` (
  `id` CHAR(36) NOT NULL,
  `quantityPurchased` INTEGER NOT NULL,
  `unitPrice` DECIMAL(10, 2) NOT NULL,
  `totalPrice` DECIMAL(10, 2) NOT NULL,
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  `PurchaseId` CHAR(36),
  `ProductId` CHAR(36),
  PRIMARY KEY (`id`),
  FOREIGN KEY (`PurchaseId`) REFERENCES `Purchases` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  FOREIGN KEY (`ProductId`) REFERENCES `Products` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

-- 10. Sales table
CREATE TABLE IF NOT EXISTS `Sales` (
  `id` CHAR(36) NOT NULL,
  `status` ENUM('COMPLETED', 'CANCELLED') DEFAULT 'COMPLETED',
  `paymentMethod` ENUM('CASH', 'MOBILE_MONEY') NOT NULL,
  `totalAmount` DECIMAL(10, 2) NOT NULL,
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  `UserId` CHAR(36),
  PRIMARY KEY (`id`),
  FOREIGN KEY (`UserId`) REFERENCES `Users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

-- 11. SaleItems table
CREATE TABLE IF NOT EXISTS `SaleItems` (
  `id` CHAR(36) NOT NULL,
  `quantity` INTEGER NOT NULL,
  `unitPrice` DECIMAL(10, 2) NOT NULL,
  `subTotal` DECIMAL(10, 2) NOT NULL,
  `unitCostSnapshot` DECIMAL(10, 2) NOT NULL,
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  `SaleId` CHAR(36),
  `ProductId` CHAR(36),
  PRIMARY KEY (`id`),
  FOREIGN KEY (`SaleId`) REFERENCES `Sales` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  FOREIGN KEY (`ProductId`) REFERENCES `Products` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

-- 12. CashRegisters table
CREATE TABLE IF NOT EXISTS `CashRegisters` (
  `id` CHAR(36) NOT NULL,
  `balance` DECIMAL(10, 2) DEFAULT 0.00,
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB;

-- 13. CashMovements table
CREATE TABLE IF NOT EXISTS `CashMovements` (
  `id` CHAR(36) NOT NULL,
  `type` ENUM('IN', 'OUT') NOT NULL,
  `amount` DECIMAL(10, 2) NOT NULL,
  `reason` VARCHAR(255),
  `referenceId` CHAR(36),
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  `CashRegisterId` CHAR(36),
  PRIMARY KEY (`id`),
  FOREIGN KEY (`CashRegisterId`) REFERENCES `CashRegisters` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

-- 14. Expenses table
CREATE TABLE IF NOT EXISTS `Expenses` (
  `id` CHAR(36) NOT NULL,
  `description` VARCHAR(255) NOT NULL,
  `amount` DECIMAL(10, 2) NOT NULL,
  `date` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB;
