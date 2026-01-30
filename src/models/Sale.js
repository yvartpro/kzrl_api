const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Sale = sequelize.define('Sale', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  status: {
    type: DataTypes.ENUM('COMPLETED', 'CANCELLED'), // Sales are immediate in POS usually
    defaultValue: 'COMPLETED',
  },
  paymentMethod: {
    type: DataTypes.ENUM('CASH', 'MOBILE_MONEY'),
    allowNull: false,
  },
  totalAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
}, {
  tableName: 'kzrl_sales'
});

const SaleItem = sequelize.define('SaleItem', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  // Linked to Sale and Product
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Quantity in BASE UNITS (e.g. bottles) sold',
  },
  unitPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: 'Selling price per unit at moment of sale',
  },
  subTotal: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  // Profit tracking
  unitCostSnapshot: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: 'Calculated Cost per Unit at time of sale (for profit reports)',
  }
}, {
  tableName: 'kzrl_sale_items'
});

module.exports = { Sale, SaleItem };
