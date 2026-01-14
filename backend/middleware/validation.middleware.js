const { body, param, query, validationResult } = require('express-validator');

// Validation error handler
function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      error: 'Doğrulama hatası',
      details: errors.array().map(err => err.msg)
    });
  }
  next();
}

// User validation rules
const validateRegister = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage('Kullanıcı adı 3-20 karakter arası olmalı')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Kullanıcı adı sadece harf, rakam ve alt çizgi içerebilir'),
  
  body('email')
    .trim()
    .isEmail()
    .withMessage('Geçerli bir e-posta adresi girin')
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Şifre en az 6 karakter olmalı'),
  
  handleValidationErrors
];

const validateLogin = [
  body('username')
    .trim()
    .notEmpty()
    .withMessage('Kullanıcı adı gerekli'),
  
  body('password')
    .notEmpty()
    .withMessage('Şifre gerekli'),
  
  handleValidationErrors
];

// Topic validation rules
const validateTopic = [
  body('title')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Başlık 5-200 karakter arası olmalı'),
  
  body('content')
    .trim()
    .isLength({ min: 10, max: 50000 })
    .withMessage('İçerik 10-50000 karakter arası olmalı'),
  
  body('category')
    .trim()
    .notEmpty()
    .withMessage('Kategori seçilmeli'),
  
  handleValidationErrors
];

// Reply validation rules
const validateReply = [
  body('content')
    .trim()
    .isLength({ min: 1, max: 50000 })
    .withMessage('Yanıt 1-50000 karakter arası olmalı'),
  
  param('topicId')
    .isInt({ min: 1 })
    .withMessage('Geçersiz konu ID'),
  
  handleValidationErrors
];

// User update validation
const validateUserUpdate = [
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Biyografi en fazla 500 karakter olabilir'),
  
  body('avatar')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Avatar URL çok uzun'),
  
  handleValidationErrors
];

// ID parameter validation
const validateId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Geçersiz ID'),
  
  handleValidationErrors
];

// Pagination validation
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Sayfa numarası 1 veya daha büyük olmalı'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit 1-100 arası olmalı'),
  
  handleValidationErrors
];

module.exports = {
  validateRegister,
  validateLogin,
  validateTopic,
  validateReply,
  validateUserUpdate,
  validateId,
  validatePagination,
  handleValidationErrors
};