const { Store, User } = require('../models');

const StoreController = {
  async list(req, res) {
    try {
      // If the user is admin, they can see all stores
      // Otherwise, only stores they are assigned to
      let stores;
      if (req.user.Role.name === 'ADMIN') {
        stores = await Store.findAll();
      } else {
        const userWithStores = await User.findByPk(req.user.id, {
          include: [{ model: Store }]
        });
        stores = userWithStores.Stores;
      }
      res.json(stores);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },

  async create(req, res) {
    try {
      const store = await Store.create(req.body);
      res.status(201).json(store);
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  },

  async update(req, res) {
    try {
      const store = await Store.findByPk(req.params.id);
      if (!store) return res.status(404).json({ error: 'Store not found' });
      await store.update(req.body);
      res.json(store);
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  },

  async assignUser(req, res) {
    try {
      const { userId, storeId } = req.body;
      const user = await User.findByPk(userId);
      const store = await Store.findByPk(storeId);

      if (!user || !store) return res.status(404).json({ error: 'User or Store not found' });

      await user.addStore(store);
      res.json({ message: 'User assigned to store successfully' });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  }
};

module.exports = StoreController;
