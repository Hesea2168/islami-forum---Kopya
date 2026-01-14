const sanitizeHtml = require('sanitize-html');

// Sanitize HTML content while preserving formatting
function sanitizeContent(content) {
  return sanitizeHtml(content, {
    allowedTags: [
      'b', 'i', 'u', 's', 'strong', 'em', 'strike',
      'p', 'br', 'ul', 'ol', 'li',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'blockquote', 'code', 'pre',
      'a', 'img'
    ],
    allowedAttributes: {
      'a': ['href', 'target', 'rel'],
      'img': ['src', 'alt', 'width', 'height'],
      '*': ['class', 'style']
    },
    allowedStyles: {
      '*': {
        'color': [/^#[0-9a-fA-F]{3,6}$/],
        'background-color': [/^#[0-9a-fA-F]{3,6}$/],
        'text-align': [/^(left|right|center|justify)$/],
        'font-weight': [/^(normal|bold|[1-9]00)$/],
        'font-style': [/^(normal|italic|oblique)$/],
        'text-decoration': [/^(none|underline|line-through)$/]
      }
    },
    transformTags: {
      'a': (tagName, attribs) => {
        return {
          tagName: 'a',
          attribs: {
            ...attribs,
            target: '_blank',
            rel: 'noopener noreferrer nofollow'
          }
        };
      }
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    allowProtocolRelative: false
  });
}

// Sanitize plain text (for titles, usernames, etc.)
function sanitizeText(text) {
  if (!text) return '';
  return text
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/[^\w\s\-_.!?@#$%&*()+='",;:]/g, '') // Remove special characters except common ones
    .trim();
}

// Middleware to sanitize request body
function sanitizeMiddleware(req, res, next) {
  if (req.body) {
    // Sanitize content fields (allow HTML formatting)
    if (req.body.content) {
      req.body.content = sanitizeContent(req.body.content);
    }

    // Sanitize text fields (no HTML)
    if (req.body.title) {
      req.body.title = sanitizeText(req.body.title);
    }
    if (req.body.username) {
      req.body.username = sanitizeText(req.body.username);
    }
    if (req.body.email) {
      req.body.email = sanitizeText(req.body.email);
    }
    if (req.body.bio) {
      req.body.bio = sanitizeText(req.body.bio);
    }
    if (req.body.category) {
      req.body.category = sanitizeText(req.body.category);
    }
  }

  next();
}

// Prevent XSS in query parameters
function sanitizeQuery(req, res, next) {
  if (req.query) {
    Object.keys(req.query).forEach(key => {
      if (typeof req.query[key] === 'string') {
        req.query[key] = sanitizeText(req.query[key]);
      }
    });
  }
  next();
}

module.exports = {
  sanitizeContent,
  sanitizeText,
  sanitizeMiddleware,
  sanitizeQuery
};