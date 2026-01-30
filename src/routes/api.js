const express = require('express');
const router = express.Router();
const { ProductController, PurchaseController, SaleController, ReportController, AuthController, UserController, SystemController } = require('../controllers');
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
router.get('/categories', simpleCrud(Category).list);
router.post('/categories', simpleCrud(Category).create);

// Suppliers
router.get('/suppliers', simpleCrud(Supplier).list);
router.post('/suppliers', simpleCrud(Supplier).create);

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

// User Management (Admin Only)
router.get('/users', authorize('ADMIN'), UserController.listUsers);
router.post('/users', authorize('ADMIN'), UserController.createUser);
router.patch('/users/:id/toggle', authorize('ADMIN'), UserController.toggleUserStatus);
router.get('/roles', authorize('ADMIN'), UserController.listRoles);

// System Initialization
router.post('/system/initialize-cash', authorize('ADMIN'), SystemController.initializeCash);
router.post('/system/initialize-stock', authorize('ADMIN'), SystemController.initializeStock);

module.exports = router;
