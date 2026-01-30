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
      throw new Error('Tout mouvement doit etre effectué dans une transaction');
    }

    const stock = await Stock.findOne({
      where: { ProductId: productId },
      lock: transaction.LOCK.UPDATE, // Lock row to prevent race conditions
      transaction
    });

    if (!stock) {
      throw new Error(`Enregistre non trouvé pour le produit ${productId}`);
    }

    const previousQuantity = stock.quantity;
    const newQuantity = previousQuantity + quantityChange;

    // Business Rule: No negative stock
    if (newQuantity < 0) {
      const product = await Product.findByPk(productId, { transaction });
      throw new Error(`Stock insuffisant pour ${product ? product.name : productId}. Actuel: ${previousQuantity}, Demandé: ${Math.abs(quantityChange)}`);
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

  /**
   * Adjust stock manually (for losses, free items, or corrections)
   * Reason: LOSS | FREE | ADJUSTMENT
   */
  static async adjustStock(productId, quantityChange, reason, notes, userId) {
    const transaction = await sequelize.transaction();

    try {
      const type = quantityChange > 0 ? 'IN' : 'OUT';

      await this.createMovement({
        productId,
        type,
        reason,
        quantityChange,
        referenceId: userId,
        description: notes || `Manuel ${reason.toLowerCase()}: ${Math.abs(quantityChange)} unités`,
        transaction
      });

      await transaction.commit();

      // Return updated stock
      return await Stock.findOne({
        where: { ProductId: productId },
        include: [Product]
      });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Get stock movement history for a product
   */
  static async getStockMovements(productId, limit = 50) {
    const stock = await Stock.findOne({ where: { ProductId: productId } });
    if (!stock) {
      throw new Error('Enregistrement du stock non trouvé pour le produit');
    }

    return await StockMovement.findAll({
      where: { StockId: stock.id },
      order: [['createdAt', 'DESC']],
      limit
    });
  }
}

module.exports = StockService;
