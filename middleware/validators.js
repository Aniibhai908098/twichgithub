// middleware/validators.js
const { validationResult } = require('express-validator');

// Validate Twitch clip URL
const validateClipUrl = (req, res, next) => {
    const { url } = req.body;

    // Check if URL is provided
    if (!url) {
        return res.status(400).json({
            status: 'error',
            message: 'Clip URL is required'
        });
    }

    // Validate URL format
    const twitchClipPattern = /^https?:\/\/(clips\.twitch\.tv\/|www\.twitch\.tv\/\w+\/clip\/)[\w-]+$/;
    
    if (!twitchClipPattern.test(url)) {
        return res.status(400).json({
            status: 'error',
            message: 'Invalid Twitch clip URL format'
        });
    }

    next();
};

// Generic validation error handler
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
        return res.status(400).json({
            status: 'error',
            message: 'Validation failed',
            errors: errors.array()
        });
    }

    next();
};

// Rate limiting error handler
const handleRateLimitError = (req, res) => {
    res.status(429).json({
        status: 'error',
        message: 'Too many requests, please try again later'
    });
};

// Security headers middleware
const securityHeaders = (req, res, next) => {
    // Remove sensitive headers
    res.removeHeader('X-Powered-By');
    
    // Add security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    next();
};

module.exports = {
    validateClipUrl,
    handleValidationErrors,
    handleRateLimitError,
    securityHeaders
};
