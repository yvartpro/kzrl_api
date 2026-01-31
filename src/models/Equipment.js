const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const EquipmentCategory = sequelize.define('EquipmentCategory', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false }
}, {
  tableName: 'kzrl_equipment_categories'
});

const Equipment = sequelize.define('Equipment', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT },
  quantity: { type: DataTypes.INTEGER, defaultValue: 0, allowNull: false, comment: 'Current available quantity' }
}, {
  tableName: 'kzrl_equipments'
});

const EquipmentInventory = sequelize.define('EquipmentInventory', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  date: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  status: { type: DataTypes.ENUM('OPEN', 'CLOSED'), defaultValue: 'OPEN' },
  notes: { type: DataTypes.TEXT }
}, {
  tableName: 'kzrl_equipment_inventories'
});

const EquipmentInventoryItem = sequelize.define('EquipmentInventoryItem', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  expectedQuantity: { type: DataTypes.INTEGER, allowNull: false },
  actualQuantity: { type: DataTypes.INTEGER, allowNull: false },
  condition: { type: DataTypes.ENUM('GOOD', 'DAMAGED', 'LOST'), defaultValue: 'GOOD' },
  notes: { type: DataTypes.TEXT }
}, {
  tableName: 'kzrl_equipment_inventory_items'
});

module.exports = { EquipmentCategory, Equipment, EquipmentInventory, EquipmentInventoryItem };
