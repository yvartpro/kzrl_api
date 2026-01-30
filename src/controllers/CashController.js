const express = require('express');
const router = express.Router();
const CashService = require('../services/CashService');
const { Expense } = require('../models');

const CashController = {
  async getBalance(req, res) {
    try {
      const balance = await CashService.getBalance();
      res.json({ balance });
    } catch (e) { res.status(500).json({ error: e.message }); }
  },

  async getMovements(req, res) {
    try {
      const { startDate, endDate } = req.query;
      const start = startDate ? new Date(startDate) : new Date(new Date().setHours(0, 0, 0, 0));
      const end = endDate ? new Date(endDate) : new Date(new Date().setHours(23, 59, 59, 999));

      const movements = await CashService.getMovements(start, end);
      res.json(movements);
    } catch (e) { res.status(500).json({ error: e.message }); }
  },

  async recordExpense(req, res) {
    try {
      const { description, amount } = req.body;
      const expense = await Expense.create({ description, amount });

      // Record cash OUT movement
      const { sequelize } = require('../models');
      const transaction = await sequelize.transaction();

      try {
        await CashService.recordMovement({
          type: 'OUT',
          amount,
          reason: 'EXPENSE',
          referenceId: expense.id,
          transaction
        });
        await transaction.commit();
        res.status(201).json(expense);
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    } catch (e) { res.status(400).json({ error: e.message }); }
  }
};

module.exports = CashController;
