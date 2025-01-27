// Updated server.js with complete implementations

const express = require('express');
const cors = require('cors');
const path = require('path');
const fetch = require('node-fetch');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Helper function to get clip ID from URL
function getClipId(url) {
    const matches = url.match(/(?:clips\.twitch\.tv\/|twitch\.tv\/\w+\/clip\/)([A-Za-z0-9-_]+)/);
    return matches ? matches[1] : null;
}

// Implementation for fetching clip info from Twitch
async function getTwitchClipInfo(url) {
    const clipId = getClipId(url);
    if (!clipId) {
        throw new Error('Invalid clip URL');
    }

    // First, get the clip data using GraphQL (this matches your extension's logic)
    const gqlEndpoint = 'https://gql.twitch.tv/gql';
    const query = {
        "operationName": "VideoAccessToken_Clip",
        "variables": {
            "slug": clipId
        },
        "extensions": {
            "persistedQuery": {
                "version": 1,
                "sha256Hash": "36b89d2507fce29e5ca551df756d27c1cfe079e2609642b4390aa4c35796eb11"
            }
        }
    };

    const response = await fetch(gqlEndpoint, {
        method: 'POST',
        headers: {
            'Client-Id': 'kimne78kx3ncx6brgo4mv6wki5h1ko', // Public Twitch Client ID
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(query)
    });

    const data = await response.json();
    
    if (!data.data || !data.data.clip) {
        throw new Error('Clip not found');
    }

    const clip = data.data.clip;
    
    // Extract available qualities
    const qualities = [];
    if (clip.videoQualities) {
        qualities.push(...clip.videoQualities.map(q => ({
            quality: q.quality,
            frameRate: q.frameRate,
            sourceURL: clip.playbackAccessToken ? 
                `${clip.videoQualities[0].sourceURL}?sig=${clip.playbackAccessToken.signature}&token=${encodeURIComponent(clip.playbackAccessToken.value)}` : 
                null
        })));
    }

    return {
        id: clipId,
        title: clip.title,
        thumbnail: clip.thumbnailURL,
        duration: clip.durationSeconds,
        broadcaster: clip.broadcaster?.displayName || 'Unknown',
        qualities: qualities,
        game: clip.game?.name || 'Unknown',
        views: clip.viewCount,
        createdAt: clip.createdAt
    };
}

// Implementation for generating download URL
async function getDownloadUrl(clipId, quality) {
    try {
        const gqlEndpoint = 'https://gql.twitch.tv/gql';
        const query = {
            "operationName": "VideoAccessToken_Clip",
            "variables": {
                "slug": clipId
            },
            "extensions": {
                "persistedQuery": {
                    "version": 1,
                    "sha256Hash": "36b89d2507fce29e5ca551df756d27c1cfe079e2609642b4390aa4c35796eb11"
                }
            }
        };

        const response = await fetch(gqlEndpoint, {
            method: 'POST',
            headers: {
                'Client-Id': 'kimne78kx3ncx6brgo4mv6wki5h1ko',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(query)
        });

        const data = await response.json();
        
        if (!data.data || !data.data.clip) {
            throw new Error('Clip not found');
        }

        const clip = data.data.clip;
        const selectedQuality = clip.videoQualities.find(q => q.quality === quality) || clip.videoQualities[0];
        
        // Generate signed URL
        const downloadUrl = `${selectedQuality.sourceURL}?sig=${clip.playbackAccessToken.signature}&token=${encodeURIComponent(clip.playbackAccessToken.value)}`;
        
        return {
            url: downloadUrl,
            fileName: `${clip.title}-${quality}.mp4`.replace(/[^a-z0-9.-]/gi, '_')
        };
    } catch (error) {
        console.error('Error generating download URL:', error);
        throw new Error('Failed to generate download URL');
    }
}

// API Endpoints
app.post('/api/fetch-clip', async (req, res) => {
    try {
        const { clipUrl } = req.body;
        
        if (!isValidTwitchUrl(clipUrl)) {
            return res.status(400).json({ 
                error: 'Invalid Twitch URL' 
            });
        }

        const clipInfo = await getTwitchClipInfo(clipUrl);
        
        res.json({
            success: true,
            ...clipInfo
        });
    } catch (error) {
        res.status(500).json({ 
            error: error.message || 'Failed to fetch clip information' 
        });
    }
});

app.post('/api/download-clip', async (req, res) => {
    try {
        const { clipId, quality } = req.body;
        
        const downloadInfo = await getDownloadUrl(clipId, quality);
        
        res.json({
            success: true,
            downloadUrl: downloadInfo.url,
            fileName: downloadInfo.fileName
        });
    } catch (error) {
        res.status(500).json({ 
            error: error.message || 'Failed to generate download link' 
        });
    }
});

function isValidTwitchUrl(url) {
    return /^https?:\/\/(www\.)?(clips\.twitch\.tv\/|twitch\.tv\/\w+\/clip\/)[\w-]+/.test(url);
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
