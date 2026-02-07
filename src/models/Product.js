const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Category = sequelize.define('Category', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true, },
  name: { type: DataTypes.STRING, allowNull: false },
}, {
  timestamps: true,
  tableName: 'kzrl_categories'
});

const Product = sequelize.define('Product', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true, },
  name: { type: DataTypes.STRING, allowNull: false, },
  description: { type: DataTypes.TEXT, },
  // Classification
  type: { type: DataTypes.ENUM('BAR', 'RESTAURANT', 'GENERAL'), defaultValue: 'GENERAL', allowNull: false },
  nature: { type: DataTypes.ENUM('RAW_MATERIAL', 'FINISHED_GOOD', 'SERVICE'), defaultValue: 'FINISHED_GOOD', allowNull: false },
  // Unit Logic
  purchaseUnit: { type: DataTypes.ENUM('BOX', 'UNIT', 'KG', 'L'), defaultValue: 'BOX', allowNull: false, comment: 'L\'unité utilisée lors de l\'achat auprès du fournisseur', },
  baseUnit: { type: DataTypes.ENUM('UNIT', 'KG', 'G', 'L', 'ML'), defaultValue: 'UNIT', allowNull: false, comment: 'La plus petite unité vendable ou ingrédient', },
  unitsPerBox: { type: DataTypes.DECIMAL(10, 4), defaultValue: 1, allowNull: false, comment: 'Facteur de conversion: Combien de baseUnits dans une purchaseUnit', },
  // Pricing
  purchasePrice: { type: DataTypes.DECIMAL(10, 2), allowNull: false, comment: 'Coût d\'une unité d\'achat (par exemple, le prix d\'une boîte)', },
  sellingPrice: { type: DataTypes.DECIMAL(10, 2), allowNull: false, comment: 'Prix d\'une unité de base (par exemple, le prix d\'une bouteille)', },
}, {
  tableName: 'kzrl_products'
});

module.exports = { Category, Product };
