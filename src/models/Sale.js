const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Sale = sequelize.define('Sale', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true, },
  status: { type: DataTypes.ENUM('COMPLETED', 'CANCELLED'), defaultValue: 'COMPLETED', },
  paymentMethod: { type: DataTypes.ENUM('CASH', 'MOBILE_MONEY'), allowNull: false, },
  totalAmount: { type: DataTypes.DECIMAL(10, 2), allowNull: false, },
}, {
  tableName: 'kzrl_sales'
});

const SaleItem = sequelize.define('SaleItem', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true, },
  quantity: { type: DataTypes.DECIMAL(10, 4), allowNull: false, },
  unitPrice: { type: DataTypes.DECIMAL(10, 2), allowNull: false, },
  subTotal: { type: DataTypes.DECIMAL(10, 2), allowNull: false, },
  unitCostSnapshot: { type: DataTypes.DECIMAL(10, 2), allowNull: false, },
  isBulk: { type: DataTypes.BOOLEAN, defaultValue: false },
}, {
  tableName: 'kzrl_sale_items'
});

module.exports = { Sale, SaleItem };
