const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Stock = sequelize.define('Stock', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  // We link to Product via association
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Current stock in BASE UNITS',
  },
  // Optional: location (if multiple warehouses, though bar is usually single)
}, {
  tableName: 'kzrl_stocks'
});

const StockMovement = sequelize.define('StockMovement', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  type: {
    type: DataTypes.ENUM('IN', 'OUT', 'ADJUSTMENT'),
    allowNull: false,
  },
  reason: {
    type: DataTypes.ENUM('PURCHASE', 'SALE', 'LOSS', 'FREE', 'ADJUSTMENT'),
    allowNull: false,
  },
  quantityChange: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Positive for IN, Negative for OUT. Always in BASE UNITS.',
  },
  previousQuantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Snapshot of stock before movement for audit',
  },
  newQuantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Snapshot of stock after movement for audit',
  },
  description: {
    type: DataTypes.STRING,
  },
  // References ID (e.g. PurchaseID or SaleID) will be added via associations or check fields
  referenceId: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: 'ID of the Purchase or Sale that caused this movement',
  }
}, {
  tableName: 'kzrl_stock_movements'
});

module.exports = { Stock, StockMovement };
