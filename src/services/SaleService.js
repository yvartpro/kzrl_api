const { sequelize, Sale, SaleItem, Product, User, ProductComposition } = require('../models');
const StockService = require('./StockService');
const CashService = require('./CashService');

class SaleService {

  static async createSale({ items, paymentMethod, userId, storeId }) {
    if (!storeId) throw new Error('storeId est requis pour effectuer une vente');

    const transaction = await sequelize.transaction();

    try {
      const sale = await Sale.create({
        UserId: userId,
        StoreId: storeId,
        paymentMethod,
        status: 'COMPLETED',
        totalAmount: 0 // Will update
      }, { transaction });

      let totalAmount = 0;

      for (const item of items) {
        const { productId, quantity, isBulk } = item;

        const product = await Product.findByPk(productId, {
          include: [{ model: ProductComposition, as: 'compositions' }],
          transaction
        });
        if (!product) throw new Error(`Product ${productId} not found`);

        // Sale price and cost logic
        const conversionFactor = isBulk ? Number(product.unitsPerBox) : 1;
        const totalBaseUnits = Number(quantity) * conversionFactor;

        const unitPrice = isBulk ? parseFloat(product.sellingPrice) * conversionFactor : parseFloat(product.sellingPrice);
        const subTotal = unitPrice * quantity;
        totalAmount += subTotal;

        const unitCost = Number(product.purchasePrice) / Number(product.unitsPerBox);

        await SaleItem.create({
          SaleId: sale.id,
          ProductId: productId,
          quantity,
          unitPrice,
          subTotal,
          unitCostSnapshot: unitCost,
          isBulk: !!isBulk
        }, { transaction });

        // Stock Deduction Logic
        if (product.compositions && product.compositions.length > 0) {
          // Deduct Ingredients (Composition is always in BASE UNITS of ingredients)
          for (const comp of product.compositions) {
            await StockService.createMovement({
              productId: comp.componentProductId,
              storeId,
              type: 'OUT',
              reason: 'SALE',
              quantityChange: -(Number(comp.quantity) * totalBaseUnits),
              referenceId: sale.id,
              description: `Consommation pour ${product.name} (Vente #${sale.id.slice(0, 8)})`,
              transaction
            });
          }
        } else {
          // Deduct Product itself (standard behavior for Bar/Retail)
          await StockService.createMovement({
            productId,
            storeId,
            type: 'OUT',
            reason: 'SALE',
            quantityChange: -totalBaseUnits,
            referenceId: sale.id,
            description: `Vente POS (${isBulk ? 'Gros' : 'Détail'})`,
            transaction
          });
        }
      }

      sale.totalAmount = totalAmount;
      await sale.save({ transaction });

      // Record Cash Movement if payment is CASH - tied to Store's Register
      if (paymentMethod === 'CASH') {
        await CashService.recordMovement({
          storeId,
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
