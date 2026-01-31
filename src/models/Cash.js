const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CashRegister = sequelize.define('CashRegister', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true, },
  balance: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.00, }
}, {
  tableName: 'kzrl_cash_registers'
});

const CashMovement = sequelize.define('CashMovement', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true, },
  type: { type: DataTypes.ENUM('IN', 'OUT'), allowNull: false, },
  amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false, },
  reason: { type: DataTypes.STRING, },
  referenceId: { type: DataTypes.UUID, },
}, {
  tableName: 'kzrl_cash_movements'
});

const Expense = sequelize.define('Expense', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true, },
  description: { type: DataTypes.STRING, allowNull: false, },
  amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false, },
  date: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, },
}, {
  tableName: 'kzrl_expenses'
});

const SalaryPayment = sequelize.define('SalaryPayment', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true, },
  amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false, },
  date: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, },
  period: { type: DataTypes.STRING, allowNull: false, comment: 'e.g., "Janvier 2026"', },
  status: { type: DataTypes.ENUM('PAID', 'PENDING'), defaultValue: 'PAID', },
  note: { type: DataTypes.TEXT, },
}, {
  tableName: 'kzrl_salary_payments'
});

module.exports = { CashRegister, CashMovement, Expense, SalaryPayment };
