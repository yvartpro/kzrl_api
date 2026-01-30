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
  // Linked to Sale and Product
  quantity: { type: DataTypes.INTEGER, allowNull: false, comment: 'Quantité en BASE UNITS (e.g. bouteilles) vendues', },
  unitPrice: { type: DataTypes.DECIMAL(10, 2), allowNull: false, comment: 'Prix unitaire', },
  subTotal: { type: DataTypes.DECIMAL(10, 2), allowNull: false, },
  // Profit tracking
  unitCostSnapshot: { type: DataTypes.DECIMAL(10, 2), allowNull: false, comment: 'Prix unitaire au moment de la vente (pour les rapports de profit)', },
}, {
  tableName: 'kzrl_sale_items'
});

module.exports = { Sale, SaleItem };
