const { sequelize, Sale, SaleItem, Stock, Product } = require('../models');
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
   * Get Current Stock Valuation
   */
  static async getStockValuation() {
    const stocks = await Stock.findAll({
      include: [Product]
    });

    let totalValuation = 0;
    let totalPotentialRevenue = 0;

    const details = stocks.map(stock => {
      const unitCost = stock.Product.purchasePrice / stock.Product.unitsPerBox;
      const unitValue = stock.Product.sellingPrice;

      const costValue = stock.quantity * unitCost;
      const salesValue = stock.quantity * unitValue;

      totalValuation += costValue;
      totalPotentialRevenue += salesValue;

      return {
        product: stock.Product.name,
        quantity: stock.quantity,
        unitCost,
        totalCostValue: costValue,
        potentialRevenue: salesValue
      };
    });

    return {
      totalValuation,
      totalPotentialRevenue,
      details
    };
  }
}

module.exports = ReportService;
