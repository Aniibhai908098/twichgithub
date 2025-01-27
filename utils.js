// utils.js
const Utils = {
    // URL validation
    isValidUrl: (url) => {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    },

    // Error handling
    handleError: (error, defaultMessage = 'An error occurred') => {
        console.error(error);
        return error?.message || defaultMessage;
    },

    // Local storage operations
    storage: {
        set: (key, value) => {
            try {
                localStorage.setItem(key, JSON.stringify(value));
                return true;
            } catch (error) {
                console.error('Storage error:', error);
                return false;
            }
        },

        get: (key, defaultValue = null) => {
            try {
                const item = localStorage.getItem(key);
                return item ? JSON.parse(item) : defaultValue;
            } catch (error) {
                console.error('Storage error:', error);
                return defaultValue;
            }
        },

        remove: (key) => {
            try {
                localStorage.removeItem(key);
                return true;
            } catch (error) {
                console.error('Storage error:', error);
                return false;
            }
        }
    },

    // DOM helpers
    dom: {
        create: (tag, attributes = {}, children = []) => {
            const element = document.createElement(tag);
            Object.entries(attributes).forEach(([key, value]) => {
                if (key === 'className') {
                    element.className = value;
                } else if (key === 'dataset') {
                    Object.entries(value).forEach(([dataKey, dataValue]) => {
                        element.dataset[dataKey] = dataValue;
                    });
                } else {
                    element.setAttribute(key, value);
                }
            });
            children.forEach(child => {
                if (typeof child === 'string') {
                    element.appendChild(document.createTextNode(child));
                } else {
                    element.appendChild(child);
                }
            });
            return element;
        },

        removeAllChildren: (element) => {
            while (element.firstChild) {
                element.removeChild(element.firstChild);
            }
        }
    },

    // Format helpers
    format: {
        number: (num) => {
            return new Intl.NumberFormat().format(num);
        },

        fileSize: (bytes) => {
            const units = ['B', 'KB', 'MB', 'GB'];
            let size = bytes;
            let unitIndex = 0;

            while (size >= 1024 && unitIndex < units.length - 1) {
                size /= 1024;
                unitIndex++;
            }

            return `${size.toFixed(1)} ${units[unitIndex]}`;
        },

        duration: (seconds) => {
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = Math.floor(seconds % 60);
            return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
        }
    },

    // Async helpers
    async: {
        delay: (ms) => new Promise(resolve => setTimeout(resolve, ms)),

        retry: async (fn, retries = 3, delay = 1000) => {
            for (let i = 0; i < retries; i++) {
                try {
                    return await fn();
                } catch (error) {
                    if (i === retries - 1) throw error;
                    await Utils.async.delay(delay);
                }
            }
        }
    }
};

// Make utils globally available
window.Utils = Utils;
