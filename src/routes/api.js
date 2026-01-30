const express = require('express');
const router = express.Router();
const { ProductController, PurchaseController, SaleController, ReportController } = require('../controllers');
const CashController = require('../controllers/CashController');
const { Category, Supplier } = require('../models');

// Helpers for simple CRUD
const simpleCrud = (Model) => ({
  list: async (req, res) => res.json(await Model.findAll()),
  create: async (req, res) => res.status(201).json(await Model.create(req.body))
});

// Products & Categories
router.get('/products', ProductController.list);
router.post('/products', ProductController.create);
router.get('/categories', simpleCrud(Category).list);
router.post('/categories', simpleCrud(Category).create);

// Suppliers
router.get('/suppliers', simpleCrud(Supplier).list);
router.post('/suppliers', simpleCrud(Supplier).create);

// Operations
router.post('/purchases', PurchaseController.create);
router.get('/purchases', PurchaseController.list);

router.post('/sales', SaleController.create);
router.get('/sales', SaleController.list);

// Cash Management
router.get('/cash/balance', CashController.getBalance);
router.get('/cash/movements', CashController.getMovements);
router.post('/cash/expenses', CashController.recordExpense);

// Reports
router.get('/reports/daily', ReportController.getDaily);
router.get('/reports/stock-value', ReportController.getStockValue);

module.exports = router;
