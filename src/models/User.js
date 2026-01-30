const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Role = sequelize.define('Role', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true, },
  name: { type: DataTypes.STRING, allowNull: false, unique: true, },
}, {
  tableName: 'kzrl_roles'
});

const User = sequelize.define('User', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true, },
  username: { type: DataTypes.STRING, allowNull: false, unique: true, },
  passwordHash: { type: DataTypes.STRING, allowNull: false, },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true, },
}, {
  tableName: 'kzrl_users'
});

module.exports = { User, Role };
