const { ProductInventory, ProductInventoryItem, Product, Stock, sequelize } = require('../models');
const StockService = require('../services/StockService');

const InventoryController = {
  /**
   * List all product inventory sessions for a store
   */
  async list(req, res) {
    try {
      const { storeId } = req.query;
      const inventories = await ProductInventory.findAll({
        where: storeId ? { StoreId: storeId } : {},
        order: [['date', 'DESC']]
      });
      res.json(inventories);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },

  /**
   * Get details of a single inventory session
   */
  async getOne(req, res) {
    try {
      const { id } = req.params;
      const inventory = await ProductInventory.findByPk(id, {
        include: [{
          model: ProductInventoryItem,
          include: [Product]
        }]
      });
      if (!inventory) return res.status(404).json({ error: 'Inventaire non trouvé' });
      res.json(inventory);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },

  /**
   * Start a new inventory session
   * Snapshots current stock and pricing for all products in the store
   */
  async start(req, res) {
    const transaction = await sequelize.transaction();
    try {
      const { storeId, notes, categoryId } = req.body;
      const userId = req.user.id;

      // Check for existing open inventory in this store
      const existingOpen = await ProductInventory.findOne({
        where: { StoreId: storeId, status: 'OPEN' },
        transaction
      });

      if (existingOpen) {
        throw new Error('Un inventaire est déjà en cours dans ce magasin. Veuillez le clôturer avant d\'en commencer un nouveau.');
      }

      const inventory = await ProductInventory.create({
        StoreId: storeId,
        UserId: userId,
        notes,
        status: 'OPEN'
      }, { transaction });

      // Fetch all products that have stock in this store or belong to the category
      const productWhere = {};
      if (categoryId) productWhere.CategoryId = categoryId;

      const stocks = await Stock.findAll({
        where: { StoreId: storeId },
        include: [{
          model: Product,
          where: productWhere
        }],
        transaction
      });

      const inventoryItems = stocks.map(s => ({
        ProductInventoryId: inventory.id,
        ProductId: s.ProductId,
        expectedQuantity: s.quantity,
        actualCrates: 0,
        actualBottles: 0,
        purchasePriceSnapshot: s.Product.purchasePrice,
        unitsPerBoxSnapshot: s.Product.unitsPerBox
      }));

      await ProductInventoryItem.bulkCreate(inventoryItems, { transaction });

      await transaction.commit();
      res.status(201).json(inventory);
    } catch (e) {
      await transaction.rollback();
      res.status(400).json({ error: e.message });
    }
  },

  /**
   * Update a specific item in an open inventory
   */
  async updateItem(req, res) {
    try {
      const { id } = req.params;
      const { actualCrates, actualBottles } = req.body;

      const item = await ProductInventoryItem.findByPk(id, {
        include: [ProductInventory]
      });

      if (!item) return res.status(404).json({ error: 'Ligne d\'inventaire non trouvée' });
      if (item.ProductInventory.status === 'CLOSED') {
        return res.status(400).json({ error: 'Impossible de modifier un inventaire clôturé' });
      }

      await item.update({
        actualCrates: actualCrates !== undefined ? actualCrates : item.actualCrates,
        actualBottles: actualBottles !== undefined ? actualBottles : item.actualBottles
      });

      res.json(item);
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  },

  /**
   * Close inventory and adjust stock
   */
  async close(req, res) {
    const transaction = await sequelize.transaction();
    try {
      const { id } = req.params;
      const inventory = await ProductInventory.findByPk(id, {
        include: [ProductInventoryItem],
        transaction
      });

      if (!inventory) throw new Error('Inventaire non trouvé');
      if (inventory.status === 'CLOSED') throw new Error('Inventaire déjà clôturé');

      for (const item of inventory.ProductInventoryItems) {
        const actualTotal = (Number(item.actualCrates) * Number(item.unitsPerBoxSnapshot)) + Number(item.actualBottles);
        const difference = actualTotal - Number(item.expectedQuantity);

        if (difference !== 0) {
          await StockService.createMovement({
            productId: item.ProductId,
            storeId: inventory.StoreId,
            type: difference > 0 ? 'IN' : 'OUT',
            reason: 'ADJUSTMENT',
            quantityChange: difference,
            referenceId: inventory.id,
            description: `Ajustement d'inventaire session #${inventory.id.substring(0, 8)}`,
            transaction
          });
        }
      }

      await inventory.update({ status: 'CLOSED' }, { transaction });

      await transaction.commit();
      res.json({ message: 'Inventaire clôturé et stock mis à jour' });
    } catch (e) {
      await transaction.rollback();
      res.status(400).json({ error: e.message });
    }
  }
};

module.exports = InventoryController;
