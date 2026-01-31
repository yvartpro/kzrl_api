const { EquipmentCategory, Equipment, EquipmentInventory, EquipmentInventoryItem, sequelize } = require('../models');

const EquipmentController = {
  // --- Category management ---
  async listCategories(req, res) {
    try {
      const { storeId } = req.query;
      const categories = await EquipmentCategory.findAll({
        where: storeId ? { StoreId: storeId } : {}
      });
      res.json(categories);
    } catch (e) { res.status(500).json({ error: e.message }); }
  },

  async createCategory(req, res) {
    try {
      const { name, storeId } = req.body;
      const category = await EquipmentCategory.create({ name, StoreId: storeId });
      res.status(201).json(category);
    } catch (e) { res.status(400).json({ error: e.message }); }
  },

  // --- Equipment management ---
  async listEquipment(req, res) {
    try {
      const { storeId, categoryId } = req.query;
      const where = {};
      if (storeId) where.StoreId = storeId;
      if (categoryId) where.EquipmentCategoryId = categoryId;

      const equipment = await Equipment.findAll({
        where,
        include: [EquipmentCategory]
      });
      res.json(equipment);
    } catch (e) { res.status(500).json({ error: e.message }); }
  },

  async createEquipment(req, res) {
    try {
      const { name, description, categoryId, storeId, quantity } = req.body;
      const equipment = await Equipment.create({
        name,
        description,
        EquipmentCategoryId: categoryId,
        StoreId: storeId,
        quantity: quantity || 0
      });
      res.status(201).json(equipment);
    } catch (e) { res.status(400).json({ error: e.message }); }
  },

  async updateEquipment(req, res) {
    try {
      const { id } = req.params;
      const { name, description, categoryId, quantity } = req.body;
      const equipment = await Equipment.findByPk(id);
      if (!equipment) return res.status(404).json({ error: 'Equipment not found' });

      await equipment.update({ name, description, EquipmentCategoryId: categoryId, quantity });
      res.json(equipment);
    } catch (e) { res.status(400).json({ error: e.message }); }
  },

  // --- Inventory Sessions ---
  async listInventories(req, res) {
    try {
      const { storeId } = req.query;
      const inventories = await EquipmentInventory.findAll({
        where: storeId ? { StoreId: storeId } : {},
        order: [['date', 'DESC']]
      });
      res.json(inventories);
    } catch (e) { res.status(500).json({ error: e.message }); }
  },

  async getInventory(req, res) {
    try {
      const { id } = req.params;
      const inventory = await EquipmentInventory.findByPk(id, {
        include: [{
          model: EquipmentInventoryItem,
          include: [Equipment]
        }]
      });
      if (!inventory) return res.status(404).json({ error: 'Inventory not found' });
      res.json(inventory);
    } catch (e) { res.status(500).json({ error: e.message }); }
  },

  async startInventory(req, res) {
    const transaction = await sequelize.transaction();
    try {
      const { storeId, notes } = req.body;
      const userId = req.user.id;

      const inventory = await EquipmentInventory.create({
        StoreId: storeId,
        UserId: userId,
        notes,
        status: 'OPEN'
      }, { transaction });

      // Pre-fill inventory items with current equipment
      const allEquipment = await Equipment.findAll({ where: { StoreId: storeId }, transaction });

      const items = allEquipment.map(eq => ({
        EquipmentInventoryId: inventory.id,
        EquipmentId: eq.id,
        expectedQuantity: eq.quantity,
        actualQuantity: eq.quantity, // Default to expected, user will update
        condition: 'GOOD'
      }));

      await EquipmentInventoryItem.bulkCreate(items, { transaction });

      await transaction.commit();
      res.status(201).json(inventory);
    } catch (e) {
      await transaction.rollback();
      res.status(400).json({ error: e.message });
    }
  },

  async updateInventoryItem(req, res) {
    try {
      const { id } = req.params; // Item ID
      const { actualQuantity, condition, notes } = req.body;

      const item = await EquipmentInventoryItem.findByPk(id);
      if (!item) return res.status(404).json({ error: 'Item not found' });

      await item.update({ actualQuantity, condition, notes });
      res.json(item);
    } catch (e) { res.status(400).json({ error: e.message }); }
  },

  async closeInventory(req, res) {
    const transaction = await sequelize.transaction();
    try {
      const { id } = req.params;
      const inventory = await EquipmentInventory.findByPk(id, {
        include: [EquipmentInventoryItem],
        transaction
      });

      if (!inventory) throw new Error('Inventory not found');
      if (inventory.status === 'CLOSED') throw new Error('Inventory already closed');

      // Update equipment quantities based on inventory
      for (const item of inventory.EquipmentInventoryItems) {
        await Equipment.update(
          { quantity: item.actualQuantity },
          { where: { id: item.EquipmentId }, transaction }
        );
      }

      await inventory.update({ status: 'CLOSED' }, { transaction });

      await transaction.commit();
      res.json({ message: 'Inventory closed and equipment updated' });
    } catch (e) {
      await transaction.rollback();
      res.status(400).json({ error: e.message });
    }
  }
};

module.exports = EquipmentController;
