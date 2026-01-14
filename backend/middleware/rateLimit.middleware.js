const rateLimit = require('express-rate-limit');

// General content rate limiter - allows frequent reads
const contentLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 200, // Very generous for browsing
  message: 'Çok fazla istek. Lütfen bir dakika bekleyin.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip for GET requests (reading content)
    return req.method === 'GET';
  }
});

// Auth rate limiter - stricter for login attempts
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per 15 minutes
  message: 'Çok fazla giriş denemesi. 15 dakika sonra tekrar deneyin.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true
});

// Topic/Reply creation limiter - prevents spam but allows active users
const createLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 15, // 15 posts per minute (very generous)
  message: 'Çok hızlı içerik oluşturuyorsunuz. Lütfen biraz yavaşlayın.',
  standardHeaders: true,
  legacyHeaders: false
});

// Admin action limiter - allows frequent admin actions
const adminLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 50, // Generous for admin tasks
  message: 'Çok fazla işlem. Lütfen bir dakika bekleyin.',
  standardHeaders: true,
  legacyHeaders: false
});

// No rate limit for reading content
const noLimit = (req, res, next) => next();

module.exports = {
  contentLimiter,
  authLimiter,
  createLimiter,
  adminLimiter,
  noLimit
};