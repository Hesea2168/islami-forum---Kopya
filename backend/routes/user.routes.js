const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { authMiddleware, optionalAuth } = require('../middleware/auth.middleware');
const { noLimit, contentLimiter } = require('../middleware/rateLimit.middleware');
const { validateUserUpdate, validateId, validatePagination } = require('../middleware/validation.middleware');
const { sanitizeMiddleware } = require('../middleware/sanitize.middleware');

// Get all users (with pagination)
router.get('/',
  noLimit,
  validatePagination,
  userController.getAllUsers
);

// Get user by ID
router.get('/:id',
  noLimit,
  validateId,
  userController.getUserById
);

// Update user profile
router.put('/:id',
  authMiddleware,
  contentLimiter,
  validateId,
  sanitizeMiddleware,
  validateUserUpdate,
  userController.updateUser
);

// Delete user (self or admin)
router.delete('/:id',
  authMiddleware,
  contentLimiter,
  validateId,
  userController.deleteUser
);

// Get user's topics
router.get('/:id/topics',
  noLimit,
  validateId,
  validatePagination,
  userController.getUserTopics
);

// Get user's replies
router.get('/:id/replies',
  noLimit,
  validateId,
  validatePagination,
  userController.getUserReplies
);

// Get user statistics
router.get('/:id/stats',
  noLimit,
  validateId,
  userController.getUserStats
);

// Get recent users
router.get('/recent/list',
  noLimit,
  userController.getRecentUsers
);

module.exports = router;