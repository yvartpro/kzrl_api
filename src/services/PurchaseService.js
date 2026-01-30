const { sequelize, Purchase, PurchaseItem, Product } = require('../models');
const StockService = require('./StockService');

class PurchaseService {

  static async createPurchase({ supplierId, items, notes }, userId) {
    const transaction = await sequelize.transaction();

    try {
      const purchase = await Purchase.create({
        SupplierId: supplierId,
        status: 'COMPLETED', // Use Pending/Completed logic if needed, simplifed here for IN move
        notes,
        totalCost: 0
      }, { transaction });

      let totalCost = 0;

      for (const item of items) {
        const { productId, quantityBoxes, unitPriceBox } = item;

        // Fetch product for conversion info
        const product = await Product.findByPk(productId, { transaction });
        if (!product) throw new Error(`Product ${productId} not found`);

        // Create Purchase Item
        const lineTotal = quantityBoxes * unitPriceBox;
        totalCost += lineTotal;

        await PurchaseItem.create({
          PurchaseId: purchase.id,
          ProductId: productId,
          quantityPurchased: quantityBoxes,
          unitPrice: unitPriceBox,
          totalPrice: lineTotal
        }, { transaction });

        // Update Stock (Convert BOX -> UNITS)
        const quantityInUnits = quantityBoxes * product.unitsPerBox;

        await StockService.createMovement({
          productId,
          type: 'IN',
          reason: 'PURCHASE',
          quantityChange: quantityInUnits,
          referenceId: purchase.id,
          description: `Purchase of ${quantityBoxes} boxes`,
          transaction
        });

        // Optional: Update Product Purchase Price if changed?
        // product.purchasePrice = unitPriceBox;
        // await product.save({ transaction });
      }

      purchase.totalCost = totalCost;
      await purchase.save({ transaction });

      await transaction.commit();
      return purchase;

    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}

module.exports = PurchaseService;
