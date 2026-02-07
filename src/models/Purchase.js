const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Supplier = sequelize.define('Supplier', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true, },
  name: { type: DataTypes.STRING, allowNull: false, },
  contact: { type: DataTypes.STRING, },
}, {
  tableName: 'kzrl_suppliers'
});

const Purchase = sequelize.define('Purchase', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true, },
  status: { type: DataTypes.ENUM('PENDING', 'COMPLETED', 'CANCELLED'), defaultValue: 'PENDING', },
  totalCost: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.00, },
  notes: { type: DataTypes.TEXT, }
}, {
  tableName: 'kzrl_purchases'
});

const PurchaseItem = sequelize.define('PurchaseItem', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true, },
  quantityPurchased: { type: DataTypes.DECIMAL(12, 4), allowNull: false, comment: 'Nombre de lots achetés', },
  unitPrice: { type: DataTypes.DECIMAL(10, 2), allowNull: false, comment: 'Prix unitaire', },
  totalPrice: { type: DataTypes.DECIMAL(10, 2), allowNull: false, },
}, {
  tableName: 'kzrl_purchase_items'
});

module.exports = { Supplier, Purchase, PurchaseItem };
