const StockService = require('../services/StockService');
const { Product, Stock } = require('../models');

const StockController = {
  /**
   * Adjust stock manually with reason tracking
   * POST /api/stock/adjust
   * Body: { productId, quantity, reason, notes }
   * Reason: LOSS | FREE | ADJUSTMENT
   */
  async adjust(req, res) {
    try {
      const { productId, quantity, reason, notes } = req.body;

      // Validation
      if (!productId || quantity === undefined || !reason) {
        return res.status(400).json({
          error: 'Champs requis manquants: productId, quantity, reason'
        });
      }

      const validReasons = ['LOSS', 'FREE', 'ADJUSTMENT'];
      if (!validReasons.includes(reason)) {
        return res.status(400).json({
          error: `Raison invalide. Doit être l'un des : ${validReasons.join(', ')}`
        });
      }

      // Check if product exists
      const product = await Product.findByPk(productId);
      if (!product) {
        return res.status(404).json({ error: 'Produit non trouvé' });
      }

      // Get current stock
      const stock = await Stock.findOne({ where: { ProductId: productId } });
      if (!stock) {
        return res.status(404).json({ error: 'Enregistrement du stock non trouvé pour le produit' });
      }

      // Check if adjustment would result in negative stock
      const newQuantity = stock.quantity + quantity;
      if (newQuantity < 0) {
        return res.status(400).json({
          error: `Stock insuffisant. Actuel: ${stock.quantity}, Ajustement: ${quantity}`
        });
      }

      // Perform adjustment
      const userId = req.user ? req.user.id : null;
      const movement = await StockService.adjustStock(
        productId,
        quantity,
        reason,
        notes,
        userId
      );

      res.status(200).json({
        message: 'Stock ajusté avec succès',
        movement,
        newQuantity
      });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },

  /**
   * Get stock movements for a product
   * GET /api/stock/movements/:productId
   */
  async getMovements(req, res) {
    try {
      const { productId } = req.params;
      const movements = await StockService.getStockMovements(productId);
      res.json(movements);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  }
};

module.exports = StockController;
