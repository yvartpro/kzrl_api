const { sequelize, Sale, SaleItem, Product, User } = require('../models');
const StockService = require('./StockService');
const CashService = require('./CashService');

class SaleService {

  static async createSale({ items, paymentMethod, userId }) {
    const transaction = await sequelize.transaction();

    try {
      const sale = await Sale.create({
        UserId: userId,
        paymentMethod,
        status: 'COMPLETED',
        totalAmount: 0 // Will update
      }, { transaction });

      let totalAmount = 0;

      for (const item of items) {
        const { productId, quantity } = item;

        const product = await Product.findByPk(productId, { transaction });
        if (!product) throw new Error(`Product ${productId} not found`);

        const unitPrice = parseFloat(product.sellingPrice);
        const subTotal = unitPrice * quantity;
        totalAmount += subTotal;

        // Calculate Cost Snapshot for Profit
        // Cost per Unit = Purchase Price (Box) / Units per Box
        const unitCost = product.purchasePrice / product.unitsPerBox;

        await SaleItem.create({
          SaleId: sale.id,
          ProductId: productId,
          quantity,
          unitPrice,
          subTotal,
          unitCostSnapshot: unitCost
        }, { transaction });

        // Update Stock (OUT)
        await StockService.createMovement({
          productId,
          type: 'OUT',
          reason: 'SALE',
          quantityChange: -quantity, // Negative for OUT
          referenceId: sale.id,
          description: `Sale POS`,
          transaction
        });
      }

      sale.totalAmount = totalAmount;
      await sale.save({ transaction });

      // Record Cash Movement if payment is CASH
      if (paymentMethod === 'CASH') {
        await CashService.recordMovement({
          type: 'IN',
          amount: totalAmount,
          reason: 'SALE',
          referenceId: sale.id,
          transaction
        });
      }

      await transaction.commit();
      return sale;

    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}

module.exports = SaleService;
