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
  purchaseUnit: { type: DataTypes.ENUM('BOX', 'UNIT'), defaultValue: 'BOX', allowNull: false, comment: 'L\'unité utilisée lors de l\'achat auprès du fournisseur', },
  baseUnit: { type: DataTypes.ENUM('UNIT'), defaultValue: 'UNIT', allowNull: false, comment: 'La plus petite unité vendable', },
  unitsPerBox: { type: DataTypes.INTEGER, defaultValue: 1, allowNull: false, comment: 'Facteur de conversion: Combien d\'unités dans une boîte', },
  // Pricing
  purchasePrice: { type: DataTypes.DECIMAL(10, 2), allowNull: false, comment: 'Coût d\'une unité d\'achat (par exemple, le prix d\'une boîte)', },
  sellingPrice: { type: DataTypes.DECIMAL(10, 2), allowNull: false, comment: 'Prix d\'une unité de base (par exemple, le prix d\'une bouteille)', },
}, {
  tableName: 'kzrl_products'
});

module.exports = { Category, Product };
