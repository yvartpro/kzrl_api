const express = require('express');
const router = express.Router();
const {
  ProductController, CategoryController, PurchaseController, SaleController, ReportController,
  AuthController, UserController, SystemController, StoreController, EquipmentController
} = require('../controllers');
const CashController = require('../controllers/CashController');
const StockController = require('../controllers/StockController');
const { Category, Supplier } = require('../models');
const { authenticate, authorize } = require('../middlewares/authMiddleware');

// Helpers for simple CRUD
const simpleCrud = (Model) => ({
  list: async (req, res) => res.json(await Model.findAll()),
  create: async (req, res) => res.status(201).json(await Model.create(req.body))
});

// Auth Routes
router.post('/auth/login', AuthController.login);
router.get('/auth/me', authenticate, AuthController.me);
router.post('/auth/change-password', authenticate, UserController.changePassword);

// Protected Routes
router.use(authenticate);

// Products & Categories
router.get('/products', ProductController.list);
router.post('/products', authorize('ADMIN', 'MANAGER'), ProductController.create);
router.patch('/products/:id', authorize('ADMIN', 'MANAGER'), ProductController.updateProduct);
router.delete('/products/:id', authorize('ADMIN'), ProductController.deleteProduct);
router.get('/categories', CategoryController.list);
router.post('/categories', CategoryController.create);

// Suppliers
router.get('/suppliers', simpleCrud(Supplier).list);
router.post('/suppliers', authorize('ADMIN', 'MANAGER'), simpleCrud(Supplier).create);

// Stock Management
router.post('/stock/adjust', StockController.adjust);
router.get('/stock/movements/:productId', StockController.getMovements);

// Operations
router.post('/purchases', authorize('ADMIN', 'MANAGER'), PurchaseController.create);
router.get('/purchases', PurchaseController.list);

router.post('/sales', SaleController.create);
router.post('/sales/bulk', SaleController.createBulkSales);
router.get('/sales', SaleController.list);

// Cash Management
router.get('/cash/balance', CashController.getBalance);
router.get('/cash/movements', CashController.getMovements);
router.post('/cash/expenses', CashController.recordExpense);
router.get('/cash/expenses', CashController.getExpenses);

// Reports
router.get('/reports/daily', authorize('ADMIN', 'MANAGER'), ReportController.getDaily);
router.get('/reports/journal', authorize('ADMIN', 'MANAGER'), ReportController.getJournal);
router.get('/reports/stock-value', authorize('ADMIN', 'MANAGER'), ReportController.getStockValue);
router.get('/reports/stock-health', authorize('ADMIN', 'MANAGER'), ReportController.getStockHealth);
router.get('/reports/global-capital', authorize('ADMIN', 'MANAGER'), ReportController.getGlobalCapital);

// User Management
router.get('/users', authorize('ADMIN', 'MANAGER'), UserController.listUsers);
router.post('/users', authorize('ADMIN', 'MANAGER'), UserController.createUser);
router.patch('/users/:id', authorize('ADMIN', 'MANAGER'), UserController.updateUser);
router.patch('/users/:id/toggle', authorize('ADMIN'), UserController.toggleUserStatus);
router.get('/roles', authorize('ADMIN', 'MANAGER'), UserController.listRoles);

// Store Management
router.get('/stores', StoreController.list);
router.post('/stores', authorize('ADMIN'), StoreController.create);
router.patch('/stores/:id', authorize('ADMIN'), StoreController.update);
router.post('/stores/assign', authorize('ADMIN'), StoreController.assignUser);

// Equipment & Inventory Management
router.get('/equipment/categories', EquipmentController.listCategories);
router.post('/equipment/categories', authorize('ADMIN', 'MANAGER'), EquipmentController.createCategory);
router.get('/equipment', EquipmentController.listEquipment);
router.post('/equipment', authorize('ADMIN', 'MANAGER'), EquipmentController.createEquipment);
router.patch('/equipment/:id', authorize('ADMIN', 'MANAGER'), EquipmentController.updateEquipment);

router.get('/equipment/inventories', EquipmentController.listInventories);
router.get('/equipment/inventories/:id', EquipmentController.getInventory);
router.post('/equipment/inventories', authorize('ADMIN', 'MANAGER'), EquipmentController.startInventory);
router.patch('/equipment/inventories/items/:id', authorize('ADMIN', 'MANAGER'), EquipmentController.updateInventoryItem);
router.post('/equipment/inventories/:id/close', authorize('ADMIN', 'MANAGER'), EquipmentController.closeInventory);

// System Initialization
router.post('/system/initialize-cash', authorize('ADMIN'), SystemController.initializeCash);
router.post('/system/initialize-stock', authorize('ADMIN'), SystemController.initializeStock);
router.post('/system/pay-staff', authorize('ADMIN', 'MANAGER'), SystemController.payStaff);

module.exports = router;
