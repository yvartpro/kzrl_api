const express = require('express');
const router = express.Router();
const { ProductController, PurchaseController, SaleController, ReportController } = require('../controllers');
const CashController = require('../controllers/CashController');
const StockController = require('../controllers/StockController');
const { Category, Supplier } = require('../models');

// Helpers for simple CRUD
const simpleCrud = (Model) => ({
  list: async (req, res) => res.json(await Model.findAll()),
  create: async (req, res) => res.status(201).json(await Model.create(req.body))
});

// Products & Categories
router.get('/products', ProductController.list);
router.post('/products', ProductController.create);
router.patch('/products/:id', ProductController.updateProduct);
router.delete('/products/:id', ProductController.deleteProduct);
router.get('/categories', simpleCrud(Category).list);
router.post('/categories', simpleCrud(Category).create);

// Suppliers
router.get('/suppliers', simpleCrud(Supplier).list);
router.post('/suppliers', simpleCrud(Supplier).create);

// Stock Management
router.post('/stock/adjust', StockController.adjust);
router.get('/stock/movements/:productId', StockController.getMovements);

// Operations
router.post('/purchases', PurchaseController.create);
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
router.get('/reports/daily', ReportController.getDaily);
router.get('/reports/journal', ReportController.getJournal);
router.get('/reports/stock-value', ReportController.getStockValue);
router.get('/reports/stock-health', ReportController.getStockHealth);

module.exports = router;
