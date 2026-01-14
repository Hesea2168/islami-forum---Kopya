const jwt = require('jsonwebtoken');
const { verifyToken } = require('../utils/token');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key_change_this_in_production';

function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token bulunamadı' });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(401).json({ error: 'Geçersiz veya süresi dolmuş token' });
    }

    // Get user from database
    const user = User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({ error: 'Kullanıcı bulunamadı' });
    }

    if (user.banned) {
      return res.status(403).json({ error: 'Hesabınız yasaklanmış' });
    }

    // Attach user to request
    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({ error: 'Kimlik doğrulama hatası' });
  }
}

function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      return next();
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (!decoded) {
      req.user = null;
      return next();
    }

    const user = User.findById(decoded.userId);

    if (!user || user.banned) {
      req.user = null;
      return next();
    }

    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    };

    next();
  } catch (error) {
    req.user = null;
    next();
  }
}

function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Giriş yapmanız gerekiyor' });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Bu işlem için yetkiniz yok' });
  }

  next();
}

function requireModerator(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Giriş yapmanız gerekiyor' });
  }

  if (req.user.role !== 'moderator' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Bu işlem için yetkiniz yok' });
  }

  next();
}

module.exports = {
  authMiddleware,
  optionalAuth,
  requireAdmin,
  requireModerator
};