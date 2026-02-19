const { Unit } = require('../models');

const UnitController = {
  async list(req, res) {
    try {
      const units = await Unit.findAll({ order: [['name', 'ASC']] });
      res.json(units);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },

  async create(req, res) {
    try {
      const { name } = req.body;
      if (!name) return res.status(400).json({ error: 'Name is required' });

      const [unit, created] = await Unit.findOrCreate({
        where: { name: name.trim() }
      });

      res.status(created ? 201 : 200).json(unit);
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  }
};

module.exports = UnitController;
