const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Category = sequelize.define('Category', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true, },
  name: { type: DataTypes.STRING, allowNull: false, unique: true, },
}, {
  timestamps: true,
  tableName: 'kzrl_categories'
});

const Product = sequelize.define('Product', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true, },
  name: { type: DataTypes.STRING, allowNull: false, },
  description: { type: DataTypes.TEXT, },
  // Unit Logic
  purchaseUnit: { type: DataTypes.ENUM('BOX', 'UNIT'), defaultValue: 'BOX', allowNull: false, comment: 'The unit used when purchasing from supplier', },
  baseUnit: { type: DataTypes.ENUM('UNIT'), defaultValue: 'UNIT', allowNull: false, comment: 'The smallest sellable unit', },
  unitsPerBox: { type: DataTypes.INTEGER, defaultValue: 1, allowNull: false, comment: 'Conversion factor: How many units in a box', },
  // Pricing
  purchasePrice: { type: DataTypes.DECIMAL(10, 2), allowNull: false, comment: 'Cost of one purchaseUnit (e.g. Price of a Box)', },
  sellingPrice: { type: DataTypes.DECIMAL(10, 2), allowNull: false, comment: 'Price of one baseUnit (e.g. Price of a Bottle)', },
}, {
  tableName: 'kzrl_products'
});

module.exports = { Category, Product };
