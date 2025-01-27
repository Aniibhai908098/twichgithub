document.addEventListener('DOMContentLoaded', () => {
    const clipPreview = document.getElementById('clipPreview');
    const clipDetails = document.getElementById('clipDetails');
    const downloadOptions = document.getElementById('downloadOptions');

    // Get clip info from session storage
    const clipInfo = JSON.parse(sessionStorage.getItem('clipInfo'));
    
    if (!clipInfo) {
        window.location.href = '/'; // Redirect to home if no clip info
        return;
    }

    // Display clip information
    displayClipInfo(clipInfo);

    // Setup download options
    setupDownloadOptions(clipInfo);
});

function displayClipInfo(clipInfo) {
    // Create preview section
    clipPreview.innerHTML = `
        <div class="preview-container">
            <img src="${clipInfo.thumbnail}" alt="${clipInfo.title}">
            <h2>${clipInfo.title}</h2>
            <p>Duration: ${clipInfo.duration}</p>
            <p>Broadcaster: ${clipInfo.broadcaster}</p>
        </div>
    `;
}

function setupDownloadOptions(clipInfo) {
    const qualityButtons = clipInfo.qualities.map(quality => `
        <button onclick="downloadClip('${clipInfo.clipId}', '${quality}')">
            Download ${quality}
        </button>
    `).join('');

    downloadOptions.innerHTML = `
        <div class="quality-options">
            <h3>Select Quality:</h3>
            ${qualityButtons}
        </div>
    `;
}

async function downloadClip(clipId, quality) {
    try {
        const response = await fetch('/api/download-clip', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ clipId, quality })
        });

        const data = await response.json();
        
        if (data.success) {
            // Create download link and trigger download
            const a = document.createElement('a');
            a.href = data.downloadUrl;
            a.download = `twitch-clip.mp4`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        } else {
            alert('Download failed: ' + data.error);
        }
    } catch (error) {
        alert('Failed to download clip');
    }
}
