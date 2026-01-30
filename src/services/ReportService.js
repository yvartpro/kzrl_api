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
   * Get Current Stock Valuation for a specific date
   */
  static async getStockValuation(date = new Date()) {
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const products = await Product.findAll();

    let totalValuation = 0;
    let totalPotentialRevenue = 0;

    const items = [];

    for (const product of products) {
      // Find the last stock movement for this product before endOfDay
      const stock = await Stock.findOne({ where: { ProductId: product.id } });
      let quantity = 0;

      if (stock) {
        // Find latest movement before or on the target date
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
          // If no movement yet, check if stock was created before endOfDay
          if (stock.createdAt > endOfDay) {
            continue; // Product didn't exist yet
          }
          quantity = 0; // Existed but no movements
        }
      }

      const unitCost = product.purchasePrice / product.unitsPerBox || 0;
      const unitValue = product.sellingPrice || 0;

      const costValue = quantity * unitCost;
      const salesValue = quantity * unitValue;

      totalValuation += costValue;
      totalPotentialRevenue += salesValue;

      items.push({
        productId: product.id,
        productName: product.name,
        quantity,
        unitCost,
        totalValue: costValue,
        potentialRevenue: salesValue
      });
    }

    return {
      totalValue: totalValuation,
      totalPotentialRevenue,
      date: endOfDay,
      items
    };
  }
}

module.exports = ReportService;
