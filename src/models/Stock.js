const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Stock = sequelize.define('Stock', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true, },
  quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, comment: 'Stock actuel en base UNITS', },
}, {
  tableName: 'kzrl_stocks',
  indexes: [
    {
      unique: true,
      fields: ['ProductId', 'StoreId']
    }
  ]
});

const StockMovement = sequelize.define('StockMovement', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true, },
  type: { type: DataTypes.ENUM('IN', 'OUT', 'ADJUSTMENT'), allowNull: false, },
  reason: { type: DataTypes.ENUM('PURCHASE', 'SALE', 'LOSS', 'FREE', 'ADJUSTMENT', 'INITIAL', 'TRANSFER'), allowNull: false, },
  quantityChange: { type: DataTypes.INTEGER, allowNull: false, comment: 'Positive for IN, Negative for OUT. Always in BASE UNITS.', },
  previousQuantity: { type: DataTypes.INTEGER, allowNull: false, comment: 'Snapshot of stock before movement for audit', },
  newQuantity: { type: DataTypes.INTEGER, allowNull: false, comment: 'Snapshot of stock after movement for audit', },
  description: { type: DataTypes.STRING, },
  referenceId: { type: DataTypes.UUID, allowNull: true, comment: 'ID of the Purchase or Sale that caused this movement', },
}, {
  tableName: 'kzrl_stock_movements'
});

module.exports = { Stock, StockMovement };
