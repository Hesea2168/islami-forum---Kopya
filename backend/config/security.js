const rateLimit = require('express-rate-limit');

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000, // 1 minute
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Çok fazla istek gönderdiniz. Lütfen biraz bekleyin.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for static files
    return req.path.startsWith('/css') || 
           req.path.startsWith('/js') || 
           req.path.startsWith('/images');
  }
});

// Strict rate limiter for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: 'Çok fazla giriş denemesi. 15 dakika sonra tekrar deneyin.',
  standardHeaders: true,
  legacyHeaders: false
});

// Moderate rate limiter for content creation
const createLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: 'Çok hızlı içerik oluşturuyorsunuz. Lütfen yavaşlayın.',
  standardHeaders: true,
  legacyHeaders: false
});

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400 // 24 hours
};

module.exports = {
  apiLimiter,
  authLimiter,
  createLimiter,
  corsOptions
};