const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ProductInventory = sequelize.define('ProductInventory', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  date: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  status: { type: DataTypes.ENUM('OPEN', 'CLOSED'), defaultValue: 'OPEN' },
  notes: { type: DataTypes.TEXT },
}, {
  tableName: 'kzrl_product_inventories'
});

const ProductInventoryItem = sequelize.define('ProductInventoryItem', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  // Snapshot of theoretical stock at start
  expectedQuantity: { type: DataTypes.DECIMAL(12, 4), allowNull: false, comment: 'Theoretical stock in BASE UNITS' },

  // Physical count
  actualCrates: { type: DataTypes.INTEGER, defaultValue: 0, comment: 'Counted full crates' },
  actualBottles: { type: DataTypes.INTEGER, defaultValue: 0, comment: 'Counted loose bottles' },

  // Snapshots for historical accuracy
  purchasePriceSnapshot: { type: DataTypes.DECIMAL(10, 2), comment: 'Price per purchase unit (crate)' },
  unitsPerBoxSnapshot: { type: DataTypes.DECIMAL(10, 4), comment: 'Conversion factor at time of inventory' },
}, {
  tableName: 'kzrl_product_inventory_items'
});

module.exports = { ProductInventory, ProductInventoryItem };
