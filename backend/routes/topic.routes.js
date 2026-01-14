const express = require('express');
const router = express.Router();
const topicController = require('../controllers/topic.controller');
const { authMiddleware, optionalAuth } = require('../middleware/auth.middleware');
const { noLimit, createLimiter } = require('../middleware/rateLimit.middleware');
const { validateTopic, validateId, validatePagination } = require('../middleware/validation.middleware');
const { sanitizeMiddleware } = require('../middleware/sanitize.middleware');

// Get all topics (with pagination and filters)
router.get('/',
  noLimit,
  validatePagination,
  topicController.getAllTopics
);

// Get hot topics
router.get('/hot',
  noLimit,
  topicController.getHotTopics
);

// Get recent topics
router.get('/recent',
  noLimit,
  topicController.getRecentTopics
);

// Search topics
router.get('/search',
  noLimit,
  topicController.searchTopics
);

// Get topic by ID
router.get('/:id',
  noLimit,
  optionalAuth,
  validateId,
  topicController.getTopicById
);

// Create new topic
router.post('/',
  authMiddleware,
  createLimiter,
  sanitizeMiddleware,
  validateTopic,
  topicController.createTopic
);

// Update topic
router.put('/:id',
  authMiddleware,
  createLimiter,
  validateId,
  sanitizeMiddleware,
  validateTopic,
  topicController.updateTopic
);

// Delete topic
router.delete('/:id',
  authMiddleware,
  createLimiter,
  validateId,
  topicController.deleteTopic
);

// Pin/Unpin topic (moderator/admin)
router.patch('/:id/pin',
  authMiddleware,
  createLimiter,
  validateId,
  topicController.togglePin
);

// Lock/Unlock topic (moderator/admin)
router.patch('/:id/lock',
  authMiddleware,
  createLimiter,
  validateId,
  topicController.toggleLock
);

module.exports = router;