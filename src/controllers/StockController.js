const StockService = require('../services/StockService');
const { Product, Stock } = require('../models');

const StockController = {
  /**
   * Adjust stock manually with reason tracking
   * POST /api/stock/adjust
   * Body: { productId, storeId, quantity, reason, notes }
   */
  async adjust(req, res) {
    try {
      const { productId, storeId, quantity, reason, notes } = req.body;

      // Validation
      if (!productId || !storeId || quantity === undefined || !reason) {
        return res.status(400).json({
          error: 'Champs requis manquants: productId, storeId, quantity, reason'
        });
      }

      const validReasons = ['LOSS', 'FREE', 'ADJUSTMENT', 'TRANSFER'];
      if (!validReasons.includes(reason)) {
        return res.status(400).json({
          error: `Raison invalide. Doit être l'un des : ${validReasons.join(', ')}`
        });
      }

      // Perform adjustment
      const userId = req.user ? req.user.id : null;
      const updatedStock = await StockService.adjustStock(
        productId,
        storeId,
        quantity,
        reason,
        notes,
        userId
      );

      res.status(200).json({
        message: 'Stock ajusté avec succès',
        stock: updatedStock
      });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },

  /**
   * Get stock movements for a product
   * GET /api/stock/movements/:productId?storeId=...
   */
  async getMovements(req, res) {
    try {
      const { productId } = req.params;
      const { storeId } = req.query;
      const movements = await StockService.getStockMovements(productId, storeId);
      res.json(movements);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  }
};

module.exports = StockController;
