const { sequelize, Sale, SaleItem, Stock, Product, Expense, StockMovement } = require('../models');
const { Op } = require('sequelize');

class ReportService {

  /**
   * Get Daily Sales Report
   */
  static async getDailySales(date = new Date()) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const sales = await Sale.findAll({
      where: {
        createdAt: {
          [Op.between]: [startOfDay, endOfDay]
        },
        status: 'COMPLETED'
      },
      include: [{
        model: SaleItem,
        include: [Product]
      }]
    });

    let totalRevenue = 0;
    let totalProfit = 0;
    let itemsSold = 0;

    for (const sale of sales) {
      totalRevenue += parseFloat(sale.totalAmount);

      for (const item of sale.SaleItems) {
        itemsSold += item.quantity;
        // Profit = (Selling Price - Snapshot Cost) * Quantity
        const profit = (parseFloat(item.unitPrice) - parseFloat(item.unitCostSnapshot)) * item.quantity;
        totalProfit += profit;
      }
    }

    return {
      date: startOfDay,
      totalRevenue,
      totalDailySales: totalRevenue,
      totalProfit,
      transactionCount: sales.length,
      itemsSold
    };
  }

  /**
   * Get paginated and searchable Journal (Sales + Expenses)
   */
  static async getJournal({ date, page = 1, limit = 10, search = '' }) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const p = parseInt(page);
    const l = parseInt(limit);
    const offset = (p - 1) * l;


    // Fetch all sales for the day (to calculate totals and for combination)
    const sales = await Sale.findAll({
      where: {
        createdAt: { [Op.between]: [startOfDay, endOfDay] },
        status: 'COMPLETED'
      }
    });

    const expenses = await Expense.findAll({
      where: {
        createdAt: { [Op.between]: [startOfDay, endOfDay] }
      }
    });

    // Combine and format
    let entries = [];
    sales.forEach(sale => {
      entries.push({
        id: sale.id,
        date: sale.createdAt,
        description: `Vente - ${sale.paymentMethod}`,
        reference: `INV-${sale.id.toString().substring(0, 8).toUpperCase()}`,
        debit: parseFloat(sale.totalAmount),
        credit: 0,
        type: 'SALE'
      });
    });

    expenses.forEach(exp => {
      entries.push({
        id: exp.id,
        date: exp.createdAt,
        description: exp.description,
        reference: `EXP-${exp.id.toString().substring(0, 8).toUpperCase()}`,
        debit: 0,
        credit: parseFloat(exp.amount),
        type: 'EXPENSE'
      });
    });

    // Sort by date
    entries.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Calculate running balance for ALL entries
    let runningBalance = 0;
    entries.forEach(entry => {
      runningBalance += entry.debit - entry.credit;
      entry.balance = runningBalance;
    });

    // Apply search filter if present
    if (search) {
      const lowerSearch = search.toLowerCase();
      entries = entries.filter(e =>
        e.description.toLowerCase().includes(lowerSearch) ||
        e.reference.toLowerCase().includes(lowerSearch)
      );
    }

    const totalCount = entries.length;
    const paginatedEntries = entries.slice(offset, offset + l);

    return {
      entries: paginatedEntries,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: parseInt(page),
      totalDebit: sales.reduce((sum, s) => sum + parseFloat(s.totalAmount), 0),
      totalCredit: expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0)
    };
  }

  /**
   * Get Current Stock Valuation for a specific date with pagination and search
   */
  static async getStockValuation({ date = new Date(), page = 1, limit = 10, search = '' }) {
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const where = {};
    if (search) {
      where.name = { [Op.like]: `%${search}%` };
    }

    const products = await Product.findAll({ where });

    let totalValuation = 0;
    let totalPotentialRevenue = 0;
    const allItems = [];

    for (const product of products) {
      const stock = await Stock.findOne({ where: { ProductId: product.id } });
      let quantity = 0;

      if (stock) {
        const lastMovement = await StockMovement.findOne({
          where: {
            StockId: stock.id,
            createdAt: { [Op.lte]: endOfDay }
          },
          order: [['createdAt', 'DESC']]
        });

        if (lastMovement) {
          quantity = lastMovement.newQuantity;
        } else {
          if (stock.createdAt > endOfDay) continue;
          quantity = 0;
        }
      }

      const unitCost = parseFloat(product.purchasePrice) / (product.unitsPerBox || 1);
      const unitValue = parseFloat(product.sellingPrice) || 0;
      const costValue = quantity * unitCost;
      const salesValue = quantity * unitValue;

      totalValuation += costValue;
      totalPotentialRevenue += salesValue;

      allItems.push({
        productId: product.id,
        productName: product.name,
        quantity,
        unitCost,
        totalValue: costValue,
        potentialRevenue: salesValue
      });
    }

    const p = parseInt(page);
    const l = parseInt(limit);
    const offset = (p - 1) * l;
    const paginatedItems = allItems.slice(offset, offset + l);

    return {
      totalValue: totalValuation,
      totalPotentialRevenue,
      date: endOfDay,
      items: paginatedItems,
      totalCount: allItems.length,
      totalPages: Math.ceil(allItems.length / limit),
      currentPage: parseInt(page)
    };
  }

  /**
   * Get Global Capital (Cash + Stock Valuation)
   */
  static async getGlobalCapital() {
    const CashService = require('./CashService');
    const liquidAssets = await CashService.getBalance();

    // Calculate stock valuation (Cost Basis)
    const products = await Product.findAll();
    let stockValue = 0;

    for (const product of products) {
      const stock = await Stock.findOne({ where: { ProductId: product.id } });
      if (stock && stock.quantity > 0) {
        const unitCost = parseFloat(product.purchasePrice) / (product.unitsPerBox || 1);
        stockValue += stock.quantity * unitCost;
      }
    }

    return {
      liquidAssets,
      stockValue,
      globalCapital: liquidAssets + stockValue
    };
  }
}

module.exports = ReportService;
