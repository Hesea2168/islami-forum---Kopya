const express = require('express');
const router = express.Router();
const replyController = require('../controllers/reply.controller');
const { authMiddleware } = require('../middleware/auth.middleware');
const { noLimit, createLimiter } = require('../middleware/rateLimit.middleware');
const { validateReply, validateId, validatePagination } = require('../middleware/validation.middleware');
const { sanitizeMiddleware } = require('../middleware/sanitize.middleware');

// Get replies for a topic
router.get('/topic/:topicId',
  noLimit,
  validateId,
  validatePagination,
  replyController.getRepliesByTopic
);

// Get reply by ID
router.get('/:id',
  noLimit,
  validateId,
  replyController.getReplyById
);

// Create new reply
router.post('/topic/:topicId',
  authMiddleware,
  createLimiter,
  sanitizeMiddleware,
  validateReply,
  replyController.createReply
);

// Update reply
router.put('/:id',
  authMiddleware,
  createLimiter,
  validateId,
  sanitizeMiddleware,
  replyController.updateReply
);

// Delete reply
router.delete('/:id',
  authMiddleware,
  createLimiter,
  validateId,
  replyController.deleteReply
);

// Get recent replies
router.get('/recent/list',
  noLimit,
  replyController.getRecentReplies
);

module.exports = router;