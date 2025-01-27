document.addEventListener('DOMContentLoaded', () => {
    const fetchBtn = document.getElementById('fetchBtn');
    const clipUrlInput = document.getElementById('clipUrl');
    const statusDiv = document.getElementById('status');

    fetchBtn.addEventListener('click', async () => {
        const clipUrl = clipUrlInput.value.trim();
        
        if (!clipUrl) {
            showStatus('Please enter a Twitch clip URL', 'error');
            return;
        }

        try {
            showStatus('Fetching clip information...', 'info');
            
            const response = await fetch('/api/fetch-clip', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ clipUrl })
            });

            const data = await response.json();
            
            if (data.success) {
                // Store clip info in session storage
                sessionStorage.setItem('clipInfo', JSON.stringify(data));
                // Redirect to download page
                window.location.href = '/download';
            } else {
                showStatus(data.error || 'Failed to fetch clip', 'error');
            }
        } catch (error) {
            showStatus('Failed to process request', 'error');
        }
    });

    function showStatus(message, type) {
        statusDiv.textContent = message;
        statusDiv.className = `status ${type}`;
    }
});
