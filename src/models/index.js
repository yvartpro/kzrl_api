const sequelize = require('../config/database');
const { User, Role } = require('./User');
const { Category, Product } = require('./Product');
const { Stock, StockMovement } = require('./Stock');
const { Supplier, Purchase, PurchaseItem } = require('./Purchase');
const { Sale, SaleItem } = require('./Sale');
const { CashRegister, CashMovement, Expense } = require('./Cash');

// User & Role
Role.hasMany(User);
User.belongsTo(Role);

// Product & Category
Category.hasMany(Product);
Product.belongsTo(Category);

// Product & Supplier
Supplier.hasMany(Product);
Product.belongsTo(Supplier);

// Stock
Product.hasOne(Stock);
Stock.belongsTo(Product);

Stock.hasMany(StockMovement);
StockMovement.belongsTo(Stock);

// Purchases
Supplier.hasMany(Purchase);
Purchase.belongsTo(Supplier);

Purchase.hasMany(PurchaseItem);
PurchaseItem.belongsTo(Purchase);

Product.hasMany(PurchaseItem);
PurchaseItem.belongsTo(Product);

// Sales
Sale.hasMany(SaleItem);
SaleItem.belongsTo(Sale);

Product.hasMany(SaleItem);
SaleItem.belongsTo(Product);

User.hasMany(Sale); // Who made the sale
Sale.belongsTo(User);

// Cash
CashRegister.hasMany(CashMovement);
CashMovement.belongsTo(CashRegister);

// Sync Function
const syncDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');
    // Force sync for dev; in prod use migrations
    // await sequelize.sync({ force: true }); 
    await sequelize.sync({ alter: true });
    console.log('Database synced successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
};

module.exports = {
  sequelize,
  syncDatabase,
  User, Role,
  Category, Product,
  Stock, StockMovement,
  Supplier, Purchase, PurchaseItem,
  Sale, SaleItem,
  CashRegister, CashMovement, Expense
};
