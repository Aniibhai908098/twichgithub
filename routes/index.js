// routes/index.js
const express = require('express');
const router = express.Router();
const clipController = require('../controllers/clipController');
const { validateClipUrl } = require('../middleware/validators');

// Health check endpoint
router.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString()
    });
});

// Clip endpoints
router.post('/clip/info', 
    validateClipUrl,
    clipController.getClipInfo
);

router.post('/clip/download', 
    validateClipUrl,
    clipController.getDownloadUrl
);

// Error handler for undefined routes
router.use('*', (req, res) => {
    res.status(404).json({
        status: 'error',
        message: 'Route not found'
    });
});

module.exports = router;
