const { sequelize, Purchase, PurchaseItem, Product, Expense } = require('../models');
const StockService = require('./StockService');
const CashService = require('./CashService');

class PurchaseService {

  static async createPurchase({ supplierId, items, notes, storeId }, userId) {
    if (!storeId) throw new Error('storeId est requis pour effectuer un achat');
    const transaction = await sequelize.transaction();

    try {
      const purchase = await Purchase.create({
        SupplierId: supplierId,
        StoreId: storeId,
        status: 'COMPLETED',
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
        const quantityInUnits = Number(quantityBoxes) * Number(product.unitsPerBox);

        await StockService.createMovement({
          productId,
          storeId,
          type: 'IN',
          reason: 'PURCHASE',
          quantityChange: quantityInUnits,
          referenceId: purchase.id,
          description: `Achat de ${quantityBoxes} cartons`,
          transaction
        });
      }

      purchase.totalCost = totalCost;
      await purchase.save({ transaction });

      // Record Cash Movement (handles balance check)
      await CashService.recordMovement({
        storeId,
        type: 'OUT',
        amount: totalCost,
        reason: 'PURCHASE',
        referenceId: purchase.id,
        transaction
      });

      // Create Expense record for journal visibility
      await Expense.create({
        StoreId: storeId,
        description: `Achat de boissons - Commande #${purchase.id.toString().substring(0, 8).toUpperCase()}`,
        amount: totalCost,
        date: new Date()
      }, { transaction });

      await transaction.commit();
      return purchase;

    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}

module.exports = PurchaseService;
