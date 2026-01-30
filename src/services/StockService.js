const { sequelize, Stock, StockMovement, Product } = require('../models');

class StockService {

  /**
   * Get current stock for a product
   */
  static async getStock(productId) {
    let stock = await Stock.findOne({ where: { ProductId: productId } });
    if (!stock) {
      // Lazy create stock entry if missing
      stock = await Stock.create({ ProductId: productId, quantity: 0 });
    }
    return stock;
  }

  /**
   * Handle generic stock movement.
   * MUST be called inside a transaction.
   */
  static async createMovement({ productId, type, reason, quantityChange, referenceId, description, transaction }) {
    if (!transaction) {
      throw new Error('Stock movements must be executed within a transaction');
    }

    const stock = await Stock.findOne({
      where: { ProductId: productId },
      lock: transaction.LOCK.UPDATE, // Lock row to prevent race conditions
      transaction
    });

    if (!stock) {
      throw new Error(`Stock record not found for Product ${productId}`);
    }

    const previousQuantity = stock.quantity;
    const newQuantity = previousQuantity + quantityChange;

    // Business Rule: No negative stock
    if (newQuantity < 0) {
      const product = await Product.findByPk(productId, { transaction });
      throw new Error(`Insufficient stock for ${product ? product.name : productId}. Current: ${previousQuantity}, Requested: ${Math.abs(quantityChange)}`);
    }

    // Update Stock
    stock.quantity = newQuantity;
    await stock.save({ transaction });

    // Record Movement
    await StockMovement.create({
      StockId: stock.id,
      type,
      reason,
      quantityChange,
      previousQuantity,
      newQuantity,
      referenceId,
      description
    }, { transaction });

    return stock;
  }

  /**
   * Initialize stock record when a product is created
   */
  static async initStock(productId, transaction) {
    return await Stock.create({ ProductId: productId, quantity: 0 }, { transaction });
  }
}

module.exports = StockService;
