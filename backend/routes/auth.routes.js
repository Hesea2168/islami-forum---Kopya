const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authLimiter } = require('../middleware/rateLimit.middleware');
const { validateRegister, validateLogin } = require('../middleware/validation.middleware');
const { sanitizeMiddleware } = require('../middleware/sanitize.middleware');

// Register new user
router.post('/register', 
  authLimiter,
  sanitizeMiddleware,
  validateRegister,
  authController.register
);

// Login user
router.post('/login',
  authLimiter,
  sanitizeMiddleware,
  validateLogin,
  authController.login
);

// Logout user (optional - mainly for logging purposes)
router.post('/logout',
  authController.logout
);

// Verify token
router.get('/verify',
  authController.verify
);

module.exports = router;