const { sequelize, CashRegister, CashMovement, Sale, Expense, SalaryPayment } = require('../models');

class CashService {

  /**
   * Get or create cash register for a specific store
   */
  static async getRegister(storeId) {
    if (!storeId) throw new Error('storeId est requis pour accéder à la caisse');

    let register = await CashRegister.findOne({ where: { StoreId: storeId } });
    if (!register) {
      register = await CashRegister.create({ StoreId: storeId, balance: 0 });
    }
    return register;
  }

  /**
   * Record cash movement (IN or OUT) for a specific store
   */
  static async recordMovement({ storeId, type, amount, reason, referenceId, transaction }) {
    if (!transaction) {
      throw new Error('Tout mouvement doit etre effectué dans une transaction');
    }
    if (!storeId) {
      throw new Error('storeId est requis pour mouvement de cash');
    }

    const register = await CashRegister.findOne({
      where: { StoreId: storeId },
      lock: transaction.LOCK.UPDATE,
      transaction
    });

    if (!register) {
      throw new Error('Registre du cash non trouvé pour ce magasin');
    }

    const previousBalance = parseFloat(register.balance);
    const changeAmount = type === 'IN' ? amount : -amount;
    const newBalance = previousBalance + changeAmount;

    if (newBalance < 0) {
      throw new Error('Votre balance de caisse est insuffisante pour cette opération');
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
   * Get cash balance for a specific store
   */
  static async getBalance(storeId) {
    if (!storeId) {
      const registers = await CashRegister.findAll();
      return registers.reduce((sum, r) => sum + parseFloat(r.balance), 0);
    }
    const register = await this.getRegister(storeId);
    return parseFloat(register.balance);
  }

  /**
   * Get cash movements for a date range (can filter by store)
   */
  static async getMovements(startDate, endDate, storeId) {
    const { Op } = require('sequelize');
    const where = {
      createdAt: { [Op.between]: [startDate, endDate] }
    };

    if (storeId) {
      const register = await this.getRegister(storeId);
      where.CashRegisterId = register.id;
    }

    return await CashMovement.findAll({
      where,
      order: [['createdAt', 'DESC']]
    });
  }

  /**
   * Initialize cash balance (Opening Balance) for a store
   */
  static async initializeBalance(amount, storeId, userId) {
    const transaction = await sequelize.transaction();
    try {
      const register = await this.getRegister(storeId);
      const currentBalance = parseFloat(register.balance);
      const difference = amount - currentBalance;

      if (difference !== 0) {
        await this.recordMovement({
          storeId,
          type: difference > 0 ? 'IN' : 'OUT',
          amount: Math.abs(difference),
          reason: 'OPENING_BALANCE',
          referenceId: userId,
          transaction
        });
      }

      await transaction.commit();
      return await this.getRegister(storeId);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Process staff payment (Salary)
   */
  static async payStaff({ userId, storeId, amount, period, description, processedBy }) {
    const transaction = await sequelize.transaction();
    try {
      const register = await this.getRegister(storeId);

      // 1. Record Cash Movement from Store's Register
      await this.recordMovement({
        storeId,
        type: 'OUT',
        amount: parseFloat(amount),
        reason: 'STAFF_PAYMENT',
        referenceId: userId,
        transaction
      });

      // 2. Create SalaryPayment record
      await SalaryPayment.create({
        UserId: userId,
        CashRegisterId: register.id,
        amount: parseFloat(amount),
        date: new Date(),
        period: period || new Date().toLocaleString('fr-FR', { month: 'long', year: 'numeric' }),
        note: description,
        status: 'PAID'
      }, { transaction });

      // 3. Create Expense record for reports
      await Expense.create({
        description: `Salaire: ${description || period}`,
        amount: parseFloat(amount),
        StoreId: storeId,
        date: new Date()
      }, { transaction });

      await transaction.commit();
      return { success: true };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}

module.exports = CashService;
