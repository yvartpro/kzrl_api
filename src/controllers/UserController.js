const { User, Role, Store } = require('../models');
const AuthService = require('../services/AuthService');
const bcrypt = require('bcrypt');

const UserController = {
  /**
   * List all users with their roles (Admin only)
   */
  async listUsers(req, res) {
    try {
      const users = await User.findAll({
        include: [
          { model: Role, attributes: ['id', 'name'] },
          { model: Store, attributes: ['id', 'name'], through: { attributes: [] } }
        ],
        attributes: { exclude: ['passwordHash'] },
        order: [['username', 'ASC']]
      });
      res.json(users);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },

  /**
   * Create a new user (Admin only)
   */
  async createUser(req, res) {
    try {
      const { username, password, roleId, storeIds } = req.body;

      const existingUser = await User.findOne({ where: { username } });
      if (existingUser) {
        return res.status(400).json({ error: 'Cet utilisateur existe déjà.' });
      }

      const passwordHash = await AuthService.hashPassword(password);

      const requesterRole = req.user.role;
      let finalRoleId = roleId;

      if (requesterRole === 'MANAGER') {
        const waiterRole = await Role.findOne({ where: { name: 'WAITER' } });
        if (!waiterRole) throw new Error('Rôle WAITER non trouvé');
        finalRoleId = waiterRole.id;
      }

      const user = await User.create({
        username,
        passwordHash,
        RoleId: finalRoleId,
        isActive: true,
        salary: req.body.salary || 0
      });

      if (storeIds && Array.isArray(storeIds)) {
        await user.setStores(storeIds);
      }

      const userWithRole = await User.findByPk(user.id, {
        include: [Role, Store],
        attributes: { exclude: ['passwordHash'] }
      });

      res.status(201).json(userWithRole);
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  },

  /**
   * Toggle user active status (Admin only)
   */
  async toggleUserStatus(req, res) {
    try {
      const { id } = req.params;
      const user = await User.findByPk(id);

      if (!user) {
        return res.status(404).json({ error: 'Utilisateur non trouvé.' });
      }

      if (user.id === req.user.id) {
        return res.status(400).json({ error: 'Vous ne pouvez pas désactiver votre propre compte.' });
      }

      await user.update({ isActive: !user.isActive });
      res.json({ message: `Compte ${user.isActive ? 'activé' : 'désactivé'} avec succès.`, user });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },

  /**
   * Change own password
   */
  async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;
      const user = await User.findByPk(req.user.id);

      const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isMatch) {
        return res.status(400).json({ error: 'Mot de passe actuel incorrect.' });
      }

      const passwordHash = await AuthService.hashPassword(newPassword);
      await user.update({ passwordHash });

      res.json({ message: 'Mot de passe mis à jour avec succès.' });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },

  /**
   * List all available roles
   */
  async listRoles(req, res) {
    try {
      const requesterRole = req.user.role;
      let roles;
      if (requesterRole === 'MANAGER') {
        roles = await Role.findAll({ where: { name: 'WAITER' } });
      } else {
        roles = await Role.findAll();
      }
      res.json(roles);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },

  /**
   * Update user details (Admin only)
   */
  async updateUser(req, res) {
    try {
      const { id } = req.params;
      const { username, roleId, salary, isActive, storeIds } = req.body;
      const user = await User.findByPk(id);

      if (!user) {
        return res.status(404).json({ error: 'Utilisateur non trouvé.' });
      }

      const updates = {};
      const requesterRole = req.user.role;

      if (requesterRole === 'MANAGER') {
        // Manager can ONLY update salary
        if (salary !== undefined) updates.salary = salary;
        // Ignore other fields
      } else {
        // Admin can update everything
        if (username !== undefined) updates.username = username;
        if (roleId !== undefined) updates.RoleId = roleId;
        if (salary !== undefined) updates.salary = salary;
        if (isActive !== undefined) updates.isActive = isActive;
      }

      await user.update(updates);

      if (req.user.role === 'ADMIN' && storeIds && Array.isArray(storeIds)) {
        await user.setStores(storeIds);
      }

      const updatedUser = await User.findByPk(id, {
        include: [Role, Store],
        attributes: { exclude: ['passwordHash'] }
      });

      res.json(updatedUser);
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  }
};

module.exports = UserController;
