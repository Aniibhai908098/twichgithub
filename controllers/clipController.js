// controllers/clipController.js
const TwitchService = require('../services/twitchService');
const { createError } = require('../utils/errorHandler');

class ClipController {
    constructor() {
        this.twitchService = new TwitchService();
    }

    getClipInfo = async (req, res, next) => {
        try {
            const { url } = req.body;
            const clipInfo = await this.twitchService.getClipInfo(url);
            
            res.status(200).json({
                status: 'success',
                data: clipInfo
            });
        } catch (error) {
            next(createError(error.message, error.statusCode));
        }
    };

    getDownloadUrl = async (req, res, next) => {
        try {
            const { url, quality } = req.body;
            const downloadUrl = await this.twitchService.getDownloadUrl(url, quality);
            
            res.status(200).json({
                status: 'success',
                data: { downloadUrl }
            });
        } catch (error) {
            next(createError(error.message, error.statusCode));
        }
    };
}

module.exports = new ClipController();
