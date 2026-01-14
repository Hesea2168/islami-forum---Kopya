const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { authMiddleware, requireAdmin, requireModerator } = require('../middleware/auth.middleware');
const { adminLimiter } = require('../middleware/rateLimit.middleware');
const { validateId } = require('../middleware/validation.middleware');

// Get all logs (admin only)
router.get('/logs',
  authMiddleware,
  requireAdmin,
  adminLimiter,
  adminController.getLogs
);

// Get statistics (admin/moderator)
router.get('/stats',
  authMiddleware,
  requireModerator,
  adminLimiter,
  adminController.getStats
);

// Mute user (admin/moderator)
router.post('/users/:id/mute',
  authMiddleware,
  requireModerator,
  adminLimiter,
  validateId,
  adminController.muteUser
);

// Unmute user (admin/moderator)
router.post('/users/:id/unmute',
  authMiddleware,
  requireModerator,
  adminLimiter,
  validateId,
  adminController.unmuteUser
);

// Ban user (admin only)
router.post('/users/:id/ban',
  authMiddleware,
  requireAdmin,
  adminLimiter,
  validateId,
  adminController.banUser
);

// Unban user (admin only)
router.post('/users/:id/unban',
  authMiddleware,
  requireAdmin,
  adminLimiter,
  validateId,
  adminController.unbanUser
);

// Promote user to moderator (admin only)
router.post('/users/:id/promote',
  authMiddleware,
  requireAdmin,
  adminLimiter,
  validateId,
  adminController.promoteToModerator
);

// Demote user from moderator (admin only)
router.post('/users/:id/demote',
  authMiddleware,
  requireAdmin,
  adminLimiter,
  validateId,
  adminController.demoteFromModerator
);

// Delete topic (admin/moderator)
router.delete('/topics/:id',
  authMiddleware,
  requireModerator,
  adminLimiter,
  validateId,
  adminController.deleteTopic
);

// Delete reply (admin/moderator)
router.delete('/replies/:id',
  authMiddleware,
  requireModerator,
  adminLimiter,
  validateId,
  adminController.deleteReply
);

// Create database backup (admin only)
router.post('/backup',
  authMiddleware,
  requireAdmin,
  adminLimiter,
  adminController.createBackup
);

// Get backups list (admin only)
router.get('/backups',
  authMiddleware,
  requireAdmin,
  adminLimiter,
  adminController.getBackups
);

// Restore from backup (admin only)
router.post('/restore/:filename',
  authMiddleware,
  requireAdmin,
  adminLimiter,
  adminController.restoreBackup
);

module.exports = router;