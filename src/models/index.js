const sequelize = require('../config/database');
const { User, Role } = require('./User');
const Store = require('./Store');
const { Category, Product } = require('./Product');
const { Stock, StockMovement } = require('./Stock');
const { Supplier, Purchase, PurchaseItem } = require('./Purchase');
const { Sale, SaleItem } = require('./Sale');
const { CashRegister, CashMovement, Expense, SalaryPayment } = require('./Cash');
const { EquipmentCategory, Equipment, EquipmentInventory, EquipmentInventoryItem } = require('./Equipment');

// User, Role & Store
Role.hasMany(User);
User.belongsTo(Role);

User.belongsToMany(Store, { through: 'kzrl_user_stores' });
Store.belongsToMany(User, { through: 'kzrl_user_stores' });

// Product & Category
Category.hasMany(Product);
Product.belongsTo(Category);

Store.hasMany(Category);
Category.belongsTo(Store);
// Equipment & Category
Store.hasMany(EquipmentCategory);
EquipmentCategory.belongsTo(Store);

EquipmentCategory.hasMany(Equipment);
Equipment.belongsTo(EquipmentCategory);

Store.hasMany(Equipment);
Equipment.belongsTo(Store);

// Equipment Inventories
Store.hasMany(EquipmentInventory);
EquipmentInventory.belongsTo(Store);

User.hasMany(EquipmentInventory);
EquipmentInventory.belongsTo(User);

EquipmentInventory.hasMany(EquipmentInventoryItem);
EquipmentInventoryItem.belongsTo(EquipmentInventory);

Equipment.hasMany(EquipmentInventoryItem);
EquipmentInventoryItem.belongsTo(Equipment);

// Product & Supplier
Supplier.hasMany(Product);
Product.belongsTo(Supplier);

// Store & Stock
Store.hasMany(Stock);
Stock.belongsTo(Store);

Product.hasMany(Stock); // A product can be in multiple stocks (stores)
Stock.belongsTo(Product);

Store.hasMany(StockMovement);
StockMovement.belongsTo(Store);

Stock.hasMany(StockMovement);
StockMovement.belongsTo(Stock);

// Transactions (Sale & Purchase) per Store
Store.hasMany(Sale);
Sale.belongsTo(Store);

Store.hasMany(Purchase);
Purchase.belongsTo(Store);

Store.hasMany(Expense);
Expense.belongsTo(Store);

// Purchases Details
Supplier.hasMany(Purchase);
Purchase.belongsTo(Supplier);

Purchase.hasMany(PurchaseItem);
PurchaseItem.belongsTo(Purchase);

Product.hasMany(PurchaseItem);
PurchaseItem.belongsTo(Product);

// Sales Details
Sale.hasMany(SaleItem);
SaleItem.belongsTo(Sale);

Product.hasMany(SaleItem);
SaleItem.belongsTo(Product);

User.hasMany(Sale); // Who made the sale
Sale.belongsTo(User);

// Cash & Salaries
Store.hasOne(CashRegister);
CashRegister.belongsTo(Store);

CashRegister.hasMany(CashMovement);
CashMovement.belongsTo(CashRegister);

User.hasMany(SalaryPayment);
SalaryPayment.belongsTo(User);

CashRegister.hasMany(SalaryPayment);
SalaryPayment.belongsTo(CashRegister);

// Sync Function
const syncDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log('La connexion à la base de données a été établie avec succès.');
    // Force sync for dev; in prod use migrations
    // await sequelize.sync({ force: true }); 
    await sequelize.sync({ alter: true });
    console.log('La base de données a été synchronisée avec succès.');
  } catch (error) {
    console.error('La connexion à la base de données a échouée:', error);
  }
};

module.exports = {
  sequelize,
  syncDatabase,
  User, Role, Store,
  Category, Product,
  Stock, StockMovement,
  Supplier, Purchase, PurchaseItem,
  Sale, SaleItem,
  CashRegister, CashMovement, Expense, SalaryPayment,
  EquipmentCategory, Equipment, EquipmentInventory, EquipmentInventoryItem
};
