const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ProductComposition = sequelize.define('ProductComposition', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true, },
  quantity: { type: DataTypes.DECIMAL(12, 4), allowNull: false, comment: 'Quantity of ingredient needed for 1 unit of parent product', },
}, {
  tableName: 'kzrl_product_compositions'
});

module.exports = ProductComposition;
