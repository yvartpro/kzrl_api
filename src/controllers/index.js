const express = require('express');
const StockService = require('../services/StockService');
const PurchaseService = require('../services/PurchaseService');
const SaleService = require('../services/SaleService');
const ReportService = require('../services/ReportService');
const { Product, Category, Stock, Supplier, Sale, Purchase } = require('../models');

// Breaking down into sub-controllers or keeping simple dependent on size
// For now, simple object based controllers to export

const ProductController = {
  async list(req, res) {
    try {
      const products = await Product.findAll({ include: [Category, Stock] });
      res.json(products);
    } catch (e) { res.status(500).json({ error: e.message }); }
  },

  async create(req, res) {
    try {
      const product = await Product.create(req.body);
      await StockService.initStock(product.id); // Init stock
      res.status(201).json(product);
    } catch (e) { res.status(400).json({ error: e.message }); }
  }
};

const PurchaseController = {
  async create(req, res) {
    try {
      // Body: { supplierId, items: [{ productId, quantityBoxes, unitPriceBox }], notes }
      const purchase = await PurchaseService.createPurchase(req.body, req.user ? req.user.id : null);
      res.status(201).json(purchase);
    } catch (e) { res.status(400).json({ error: e.message }); }
  },
  async list(req, res) {
    try {
      const purchases = await Purchase.findAll({ include: [Supplier], order: [['createdAt', 'DESC']] });
      res.json(purchases);
    } catch (e) { res.status(500).json({ error: e.message }); }
  }
};

const SaleController = {
  async create(req, res) {
    try {
      // Body: { items: [{ productId, quantity }], paymentMethod }
      const sale = await SaleService.createSale(req.body);
      res.status(201).json(sale);
    } catch (e) { res.status(400).json({ error: e.message }); }
  },
  async list(req, res) {
    try {
      const sales = await Sale.findAll({ order: [['createdAt', 'DESC']] });
      res.json(sales);
    } catch (e) { res.status(500).json({ error: e.message }); }
  }
};

const ReportController = {
  async getDaily(req, res) {
    try {
      const date = req.query.date ? new Date(req.query.date) : new Date();
      const report = await ReportService.getDailySales(date);
      res.json(report);
    } catch (e) { res.status(500).json({ error: e.message }); }
  },
  async getStockValue(req, res) {
    try {
      const report = await ReportService.getStockValuation();
      res.json(report);
    } catch (e) { res.status(500).json({ error: e.message }); }
  }
};

module.exports = {
  ProductController,
  PurchaseController,
  SaleController,
  ReportController
};
