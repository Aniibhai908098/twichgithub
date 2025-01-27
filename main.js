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

// Add UI Handler class
class TwitchDownloader {
    constructor() {
        this.initializeElements();
        this.attachEventListeners();
    }

    initializeElements() {
        this.urlInput = document.getElementById('clipUrl');
        this.submitButton = document.getElementById('submitBtn');
        this.statusMessage = document.getElementById('statusMsg');
        this.clipInfoSection = document.getElementById('clipInfoSection');
        this.qualitySection = document.getElementById('qualitySection');
    }

    attachEventListeners() {
        this.submitButton.addEventListener('click', () => this.handleSubmit());
        this.urlInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleSubmit();
        });
    }

    async handleSubmit() {
        const url = this.urlInput.value.trim();
        if (!url) {
            this.showStatus('Please enter a Twitch clip URL', 'error');
            return;
        }

        try {
            this.setLoading(true);
            this.showStatus('Fetching clip information...', 'info');
            
            const clipInfo = await window.twitchAPI.getClipInfo(url);
            this.displayClipInfo(clipInfo);
            this.showStatus('Clip information loaded successfully', 'success');
        } catch (error) {
            this.showStatus(error.message, 'error');
            this.clearClipInfo();
        } finally {
            this.setLoading(false);
        }
    }

    displayClipInfo(clipInfo) {
        this.clipInfoSection.innerHTML = `
            <div class="clip-info">
                <img src="${clipInfo.thumbnail}" alt="${clipInfo.title}" class="clip-thumbnail">
                <div class="clip-details">
                    <h2>${clipInfo.title}</h2>
                    <p>Channel: ${clipInfo.broadcaster}</p>
                    <p>Game: ${clipInfo.game}</p>
                    <p>Duration: ${this.formatDuration(clipInfo.duration)}</p>
                    <p>Views: ${this.formatNumber(clipInfo.viewCount)}</p>
                </div>
            </div>
        `;

        this.displayQualityOptions(clipInfo.qualities);
    }

    displayQualityOptions(qualities) {
        const qualityButtons = qualities.map(quality => `
            <button class="quality-btn" data-url="${quality.url}">
                <span class="quality-label">${quality.quality}p</span>
                <span class="quality-fps">${quality.fps} FPS</span>
            </button>
        `).join('');

        this.qualitySection.innerHTML = `
            <div class="quality-container">
                <h3>Select Quality</h3>
                <div class="quality-options">
                    ${qualityButtons}
                </div>
            </div>
        `;

        // Add click handlers to quality buttons
        this.qualitySection.querySelectorAll('.quality-btn').forEach(button => {
            button.addEventListener('click', () => this.handleDownload(button.dataset.url));
        });
    }

    async handleDownload(url) {
        try {
            this.showStatus('Starting download...', 'info');
            const response = await fetch(url);
            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = `twitch-clip-${Date.now()}.mp4`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(downloadUrl);

            this.showStatus('Download started successfully', 'success');
        } catch (error) {
            this.showStatus('Download failed. Please try again.', 'error');
        }
    }

    setLoading(isLoading) {
        this.submitButton.disabled = isLoading;
        if (isLoading) {
            this.submitButton.textContent = 'Loading...';
        } else {
            this.submitButton.textContent = 'Download';
        }
    }

    showStatus(message, type) {
        this.statusMessage.textContent = message;
        this.statusMessage.className = `status-message ${type}`;
    }

    clearClipInfo() {
        this.clipInfoSection.innerHTML = '';
        this.qualitySection.innerHTML = '';
    }

    formatDuration(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    formatNumber(number) {
        return new Intl.NumberFormat().format(number);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.twitchDownloader = new TwitchDownloader();
});
