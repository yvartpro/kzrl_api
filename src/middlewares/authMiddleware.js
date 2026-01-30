const AuthService = require('../services/AuthService');

/**
 * Authentication Middleware: Protects routes from unauthenticated access
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Accès non autorisé. Token manquant.' });
    }

    const token = authHeader.split(' ')[1];
    const user = await AuthService.verifyToken(token);

    if (!user) {
      return res.status(401).json({ error: 'Session expirée ou invalide.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'Votre compte est désactivé.' });
    }

    // Attach user to request
    req.user = {
      id: user.id,
      username: user.username,
      role: user.Role?.name
    };

    next();
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de l\'authentification', details: error.message });
  }
};

/**
 * Authorization Middleware: Restricts routes to specific roles
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Permissions insuffisantes pour cette action.' });
    }
    next();
  };
};

module.exports = { authenticate, authorize };
