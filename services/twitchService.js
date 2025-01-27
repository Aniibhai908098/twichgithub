// services/twitchService.js
const fetch = require('node-fetch');
const { createError } = require('../utils/errorHandler');
const config = require('../config');

class TwitchService {
    constructor() {
        this.CLIENT_ID = config.twitch.clientId;
        this.GQL_ENDPOINT = config.twitch.gqlEndpoint;
    }

    async getClipInfo(clipUrl) {
        const clipId = this.extractClipId(clipUrl);
        if (!clipId) {
            throw createError('Invalid clip URL', 400);
        }

        const query = {
            operationName: 'VideoAccessToken_Clip',
            variables: { slug: clipId },
            extensions: {
                persistedQuery: {
                    version: 1,
                    sha256Hash: config.twitch.queryHash
                }
            }
        };

        try {
            const response = await fetch(this.GQL_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Client-Id': this.CLIENT_ID,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(query)
            });

            if (!response.ok) {
                throw createError('Failed to fetch clip information', response.status);
            }

            const data = await response.json();
            return this.processClipData(data);
        } catch (error) {
            throw createError(error.message, error.statusCode || 500);
        }
    }

    async getDownloadUrl(clipUrl, quality) {
        const clipInfo = await this.getClipInfo(clipUrl);
        const selectedQuality = clipInfo.qualities.find(q => q.quality === quality);
        
        if (!selectedQuality) {
            throw createError('Selected quality not available', 400);
        }

        return selectedQuality.url;
    }

    extractClipId(url) {
        const patterns = [
            /clips\.twitch\.tv\/(\w+)/,
            /twitch\.tv\/\w+\/clip\/(\w+)/
        ];

        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match) return match[1];
        }

        return null;
    }

    processClipData(data) {
        if (!data.data?.clip) {
            throw createError('Clip not found', 404);
        }

        const clip = data.data.clip;
        return {
            id: clip.id,
            slug: clip.slug,
            title: clip.title,
            broadcaster: clip.broadcaster.displayName,
            game: clip.game?.name || 'Unknown',
            duration: clip.durationSeconds,
            thumbnail: clip.thumbnailURL,
            viewCount: clip.viewCount,
            qualities: this.processQualities(clip)
        };
    }

    processQualities(clip) {
        if (!clip.videoQualities?.length) {
            throw createError('No download qualities available', 404);
        }

        return clip.videoQualities.map(quality => ({
            quality: quality.quality,
            fps: quality.frameRate,
            url: this.generateDownloadUrl(clip, quality.sourceURL)
        }));
    }

    generateDownloadUrl(clip, sourceUrl) {
        const token = clip.playbackAccessToken;
        return `${sourceUrl}?sig=${token.signature}&token=${encodeURIComponent(token.value)}`;
    }
}

module.exports = TwitchService;
