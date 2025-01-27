class TwitchAPI {
    constructor() {
        this.CLIENT_ID = 'kimne78kx3ncx6brgo4mv6wki5h1ko';
        this.GQL_ENDPOINT = 'https://gql.twitch.tv/gql';
        this.CLIP_QUERY_HASH = '36b89d2507fce29e5ca551df756d27c1cfe079e2609642b4390aa4c35796eb11';
    }

    async getClipInfo(clipUrl) {
        const clipId = this.extractClipId(clipUrl);
        if (!clipId) {
            throw new Error('Invalid Twitch clip URL');
        }

        const query = {
            operationName: 'VideoAccessToken_Clip',
            variables: { 
                slug: clipId 
            },
            extensions: {
                persistedQuery: {
                    version: 1,
                    sha256Hash: this.CLIP_QUERY_HASH
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
                throw new Error('Failed to fetch clip information');
            }

            const data = await response.json();
            return this.processClipData(data);

        } catch (error) {
            console.error('API Error:', error);
            throw new Error('Failed to fetch clip information. Please try again.');
        }
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
            throw new Error('Clip not found or no longer available');
        }

        const clip = data.data.clip;
        return {
            id: clip.id,
            slug: clip.slug,
            title: clip.title,
            broadcaster: clip.broadcaster.displayName,
            game: clip.game?.name || 'Unknown',
            duration: clip.durationSeconds,
            createdAt: clip.createdAt,
            thumbnail: clip.thumbnailURL,
            viewCount: clip.viewCount,
            qualities: this.processQualities(clip)
        };
    }

    processQualities(clip) {
        if (!clip.videoQualities?.length) {
            throw new Error('No download qualities available');
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

// Export as singleton
window.twitchAPI = new TwitchAPI();
