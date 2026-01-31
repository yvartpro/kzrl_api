const { sequelize, Stock, StockMovement, Product } = require('../models');

class StockService {

  /**
   * Get current stock for a product in a specific store
   */
  static async getStock(productId, storeId) {
    if (!storeId) throw new Error('storeId est requis pour consulter le stock');

    let stock = await Stock.findOne({ where: { ProductId: productId, StoreId: storeId } });
    if (!stock) {
      // Lazy create stock entry if missing for this store
      stock = await Stock.create({ ProductId: productId, StoreId: storeId, quantity: 0 });
    }
    return stock;
  }

  /**
   * Handle generic stock movement for a specific store.
   * MUST be called inside a transaction.
   */
  static async createMovement({ productId, storeId, type, reason, quantityChange, referenceId, description, transaction }) {
    if (!transaction) {
      throw new Error('Tout mouvement doit etre effectué dans une transaction');
    }
    if (!storeId) {
      throw new Error('storeId est requis pour tout mouvement de stock');
    }

    const stock = await Stock.findOne({
      where: { ProductId: productId, StoreId: storeId },
      lock: transaction.LOCK.UPDATE, // Lock row to prevent race conditions
      transaction
    });

    if (!stock) {
      // Create it if it doesn't exist (e.g. first movement in this store)
      await Stock.create({ ProductId: productId, StoreId: storeId, quantity: 0 }, { transaction });
      // Re-fetch with lock
      return await this.createMovement({ productId, storeId, type, reason, quantityChange, referenceId, description, transaction });
    }

    const previousQuantity = stock.quantity;
    const newQuantity = previousQuantity + quantityChange;

    // Business Rule: No negative stock
    if (newQuantity < 0) {
      const product = await Product.findByPk(productId, { transaction });
      throw new Error(`Stock insuffisant au dépôt sélectionné pour ${product ? product.name : productId}. Actuel: ${previousQuantity}, Demandé: ${Math.abs(quantityChange)}`);
    }

    // Update Stock
    stock.quantity = newQuantity;
    await stock.save({ transaction });

    // Record Movement
    await StockMovement.create({
      StockId: stock.id,
      StoreId: storeId,
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
   * Initialize stock record when a product is created - for a specific store
   */
  static async initStock(productId, storeId, transaction) {
    return await Stock.create({ ProductId: productId, StoreId: storeId, quantity: 0 }, { transaction });
  }

  /**
   * Adjust stock manually (for losses, free items, or corrections)
   */
  static async adjustStock(productId, storeId, quantityChange, reason, notes, userId) {
    const transaction = await sequelize.transaction();

    try {
      const type = quantityChange > 0 ? 'IN' : 'OUT';

      await this.createMovement({
        productId,
        storeId,
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
        where: { ProductId: productId, StoreId: storeId },
        include: [Product]
      });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Get stock movement history for a product in a specific store
   */
  static async getStockMovements(productId, storeId, limit = 50) {
    const where = { ProductId: productId };
    if (storeId) where.StoreId = storeId;

    const stocks = await Stock.findAll({ where });
    if (!stocks || stocks.length === 0) {
      return [];
    }

    const stockIds = stocks.map(s => s.id);

    return await StockMovement.findAll({
      where: { StockId: stockIds },
      order: [['createdAt', 'DESC']],
      limit
    });
  }

  /**
   * Initialize stock for a product (Opening Stock) in a specific store
   */
  static async initializeStock(productId, storeId, quantity, userId) {
    const transaction = await sequelize.transaction();
    try {
      const stock = await this.getStock(productId, storeId);
      const currentQuantity = stock.quantity;
      const difference = quantity - currentQuantity;

      if (difference !== 0) {
        await this.createMovement({
          productId,
          storeId,
          type: difference > 0 ? 'IN' : 'OUT',
          reason: 'INITIAL',
          quantityChange: difference,
          referenceId: userId,
          description: `Initialisation du stock (Ouverture)`,
          transaction
        });
      }

      await transaction.commit();
      return await this.getStock(productId, storeId);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Transfer stock between stores
   */
  static async transferStock(productId, fromStoreId, toStoreId, quantity, userId, notes) {
    const transaction = await sequelize.transaction();
    try {
      // 1. Move OUT from origin
      await this.createMovement({
        productId,
        storeId: fromStoreId,
        type: 'OUT',
        reason: 'TRANSFER',
        quantityChange: -quantity,
        referenceId: userId,
        description: `Transfert vers magasin contextuel. ${notes || ''}`,
        transaction
      });

      // 2. Move IN to destination
      await this.createMovement({
        productId,
        storeId: toStoreId,
        type: 'IN',
        reason: 'TRANSFER',
        quantityChange: quantity,
        referenceId: userId,
        description: `Transfert depuis magasin contextuel. ${notes || ''}`,
        transaction
      });

      await transaction.commit();
      return true;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}

module.exports = StockService;
