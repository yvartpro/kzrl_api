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
        const { productId, quantity, unitPrice, isBulk } = item;

        // Fetch product for conversion info
        const product = await Product.findByPk(productId, { transaction });
        if (!product) throw new Error(`Product ${productId} not found`);

        // If isBulk is true, quantity is in purchaseUnits (e.g. crates/kg). 
        // If false, quantity is in baseUnits (e.g. bottles/units).
        const conversionFactor = isBulk ? Number(product.unitsPerBox) : 1;
        const totalBaseUnits = Number(quantity) * conversionFactor;
        const totalPrice = Number(quantity) * Number(unitPrice);
        totalCost += totalPrice;

        await PurchaseItem.create({
          PurchaseId: purchase.id,
          ProductId: productId,
          quantityPurchased: quantity,
          unitPrice: unitPrice,
          totalPrice: totalPrice,
          isBulk: !!isBulk // Useful for audit
        }, { transaction });

        await StockService.createMovement({
          productId,
          storeId,
          type: 'IN',
          reason: 'PURCHASE',
          quantityChange: totalBaseUnits,
          referenceId: purchase.id,
          description: `Achat de ${quantity} ${isBulk ? product.purchaseUnit : product.baseUnit}`,
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
