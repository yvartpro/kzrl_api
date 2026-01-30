const express = require('express');
const StockService = require('../services/StockService');
const CashService = require('../services/CashService');
const PurchaseService = require('../services/PurchaseService');
const SaleService = require('../services/SaleService');
const ReportService = require('../services/ReportService');
const AuthService = require('../services/AuthService');
const UserController = require('./UserController');
const { Product, Category, Stock, Supplier, Sale, Purchase } = require('../models');

// Breaking down into sub-controllers or keeping simple dependent on size
// For now, simple object based controllers to export

const ProductController = {
  async list(req, res) {
    try {
      const products = await Product.findAll({
        include: [
          Category,
          Stock,
          { model: Supplier, required: false }
        ]
      });
      res.json(products);
    } catch (e) { res.status(500).json({ error: e.message }); }
  },

  async create(req, res) {
    try {
      const product = await Product.create(req.body);
      await StockService.initStock(product.id); // Init stock
      res.status(201).json(product);
    } catch (e) { res.status(400).json({ error: e.message }); }
  },

  async updateProduct(req, res) {
    try {
      const { id } = req.params;
      const { name, categoryId, supplierId, boxQuantity, unitsPerBox, unitCost, sellingPrice } = req.body;

      const product = await Product.findByPk(id);
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }

      // Update only provided fields
      const updates = {};
      if (name !== undefined) updates.name = name;
      if (categoryId !== undefined) updates.CategoryId = categoryId;
      if (supplierId !== undefined) updates.SupplierId = supplierId;
      if (boxQuantity !== undefined) updates.boxQuantity = boxQuantity;
      if (unitsPerBox !== undefined) updates.unitsPerBox = unitsPerBox;

      // Calculate purchasePrice from unitCost if provided
      if (unitCost !== undefined) {
        const conversion = unitsPerBox !== undefined ? unitsPerBox : product.unitsPerBox;
        updates.purchasePrice = parseFloat(unitCost) * parseFloat(conversion);
      }

      if (sellingPrice !== undefined) updates.sellingPrice = sellingPrice;

      await product.update(updates);

      // Fetch updated product with associations
      const updatedProduct = await Product.findByPk(id, {
        include: [
          { model: Category, attributes: ['id', 'name'] },
          { model: Supplier, attributes: ['id', 'name'] },
          { model: Stock, attributes: ['quantity'] }
        ]
      });

      res.json(updatedProduct);
    } catch (error) {
      console.error('Update product error:', error);
      res.status(500).json({ error: error.message });
    }
  },

  async deleteProduct(req, res) {
    try {
      const { id } = req.params;

      const product = await Product.findByPk(id);
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }

      // Soft delete (paranoid is enabled in model)
      await product.destroy();

      res.json({ message: 'Product deleted successfully' });
    } catch (error) {
      console.error('Delete product error:', error);
      res.status(500).json({ error: error.message });
    }
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
  },

  async createBulkSales(req, res) {
    try {
      const salesData = req.body; // Array of sales

      if (!Array.isArray(salesData) || salesData.length === 0) {
        return res.status(400).json({ error: 'Sales data must be a non-empty array' });
      }

      const results = [];
      const errors = [];

      // Process each sale
      for (let i = 0; i < salesData.length; i++) {
        const saleData = salesData[i];
        try {
          // Use existing SaleService for each sale
          const sale = await SaleService.createSale({
            items: [{
              productId: saleData.productId,
              quantity: saleData.quantity
            }],
            paymentMethod: saleData.paymentMethod,
            notes: saleData.notes || `Bulk entry ${i + 1}`
          });

          results.push({ index: i, saleId: sale.id, success: true });
        } catch (err) {
          errors.push({ index: i, error: err.message });
        }
      }

      res.status(errors.length > 0 ? 207 : 201).json({
        message: `Processed ${results.length} sales successfully`,
        results,
        errors: errors.length > 0 ? errors : undefined
      });
    } catch (error) {
      console.error('Bulk sales error:', error);
      res.status(500).json({ error: error.message });
    }
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
  async getJournal(req, res) {
    try {
      const { date, page, limit, search } = req.query;
      const report = await ReportService.getJournal({ date, page, limit, search });
      res.json(report);
    } catch (e) { res.status(500).json({ error: e.message }); }
  },

  async getStockValue(req, res) {
    try {
      const { date, page, limit, search } = req.query;
      const report = await ReportService.getStockValuation({ date, page, limit, search });
      res.json(report);
    } catch (e) { res.status(500).json({ error: e.message }); }
  },

  async getStockHealth(req, res) {
    try {
      const products = await Product.findAll({
        include: [
          { model: Stock, attributes: ['quantity'] },
          { model: Category, attributes: ['name'] },
          { model: Supplier, attributes: ['name'] }
        ],
        order: [['name', 'ASC']]
      });

      const stockHealth = products.map(product => {
        const quantity = product.Stock?.quantity || 0;
        const unitCost = parseFloat(product.unitCost) || 0;
        const totalValue = quantity * unitCost;
        const sellingPrice = parseFloat(product.sellingPrice) || 0;
        const potentialRevenue = quantity * sellingPrice;
        const margin = sellingPrice - unitCost;
        const marginPercent = unitCost > 0 ? ((margin / unitCost) * 100).toFixed(2) : 0;

        // Determine status
        let status = 'OK';
        if (quantity === 0) {
          status = 'OUT';
        } else if (quantity <= 10) {
          status = 'LOW';
        }

        return {
          id: product.id,
          name: product.name,
          category: product.Category?.name || 'N/A',
          supplier: product.Supplier?.name || 'N/A',
          quantity,
          unitCost,
          totalValue,
          sellingPrice,
          potentialRevenue,
          margin,
          marginPercent,
          status
        };
      });

      // Calculate totals
      const totals = {
        totalStockValue: stockHealth.reduce((sum, item) => sum + item.totalValue, 0),
        totalPotentialRevenue: stockHealth.reduce((sum, item) => sum + item.potentialRevenue, 0),
        totalProducts: stockHealth.length,
        outOfStock: stockHealth.filter(item => item.status === 'OUT').length,
        lowStock: stockHealth.filter(item => item.status === 'LOW').length
      };

      res.json({
        stockHealth,
        totals
      });
    } catch (error) {
      console.error('Stock health error:', error);
      res.status(500).json({ error: error.message });
    }
  },

  async getGlobalCapital(req, res) {
    try {
      const capital = await ReportService.getGlobalCapital();
      res.json(capital);
    } catch (e) { res.status(500).json({ error: e.message }); }
  }
};

const AuthController = {
  async login(req, res) {
    try {
      const { username, password } = req.body;
      const result = await AuthService.login(username, password);
      res.json(result);
    } catch (e) {
      res.status(401).json({ error: e.message });
    }
  },

  async me(req, res) {
    try {
      res.json({ user: req.user });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  }
};

const SystemController = {
  async initializeCash(req, res) {
    try {
      const { amount } = req.body;
      const result = await CashService.initializeBalance(amount, req.user.id);
      res.json(result);
    } catch (e) { res.status(500).json({ error: e.message }); }
  },

  async initializeStock(req, res) {
    try {
      const { productId, quantity } = req.body;
      const result = await StockService.initializeStock(productId, quantity, req.user.id);
      res.json(result);
    } catch (e) { res.status(500).json({ error: e.message }); }
  }
};

module.exports = {
  ProductController,
  PurchaseController,
  SaleController,
  ReportController,
  AuthController,
  UserController,
  SystemController
};
