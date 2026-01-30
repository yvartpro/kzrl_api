const { sequelize, CashRegister, CashMovement, Sale } = require('../models');

class CashService {

  /**
   * Get or create default cash register
   */
  static async getDefaultRegister() {
    let register = await CashRegister.findOne();
    if (!register) {
      register = await CashRegister.create({ balance: 0 });
    }
    return register;
  }

  /**
   * Record cash movement (IN or OUT)
   */
  static async recordMovement({ type, amount, reason, referenceId, transaction }) {
    if (!transaction) {
      throw new Error('Cash movements must be executed within a transaction');
    }

    const register = await CashRegister.findOne({
      lock: transaction.LOCK.UPDATE,
      transaction
    });

    if (!register) {
      throw new Error('Cash register not found');
    }

    const previousBalance = parseFloat(register.balance);
    const changeAmount = type === 'IN' ? amount : -amount;
    const newBalance = previousBalance + changeAmount;

    if (newBalance < 0) {
      throw new Error('Insufficient cash balance');
    }

    register.balance = newBalance;
    await register.save({ transaction });

    await CashMovement.create({
      CashRegisterId: register.id,
      type,
      amount,
      reason,
      referenceId
    }, { transaction });

    return register;
  }

  /**
   * Get cash balance
   */
  static async getBalance() {
    const register = await this.getDefaultRegister();
    return parseFloat(register.balance);
  }

  /**
   * Get cash movements for a date range
   */
  static async getMovements(startDate, endDate) {
    const { Op } = require('sequelize');
    return await CashMovement.findAll({
      where: {
        createdAt: {
          [Op.between]: [startDate, endDate]
        }
      },
      order: [['createdAt', 'DESC']]
    });
  }
}

module.exports = CashService;
