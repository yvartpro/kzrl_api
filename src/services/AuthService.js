const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User, Role } = require('../models');

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-kzrl-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

class AuthService {
  /**
   * Login user and return JWT
   */
  static async login(username, password) {
    const user = await User.findOne({
      where: { username, isActive: true },
      include: [Role]
    });

    if (!user) {
      throw new Error('Utilisateur non trouvé ou inactif');
    }

    if (user.Role?.name === 'WAITER') {
      throw new Error('Les serveurs n\'ont pas accès au tableau de bord');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new Error('Mot de passe incorrect');
    }

    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.Role?.name
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return {
      user: {
        id: user.id,
        username: user.username,
        role: user.Role?.name
      },
      token
    };
  }

  /**
   * Utility to hash password
   */
  static async hashPassword(password) {
    return await bcrypt.hash(password, 10);
  }

  /**
   * Verify token and return user
   */
  static async verifyToken(token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await User.findByPk(decoded.id, { include: [Role] });
      return user;
    } catch (e) {
      return null;
    }
  }
}

module.exports = AuthService;
