// config.js
require('dotenv').config();

const config = {
    app: {
        port: process.env.PORT || 3000,
        env: process.env.NODE_ENV || 'development',
        cors: {
            origin: process.env.CORS_ORIGIN || '*',
            methods: ['GET', 'POST']
        }
    },
    twitch: {
        clientId: 'kimne78kx3ncx6brgo4mv6wki5h1ko',
        gqlEndpoint: 'https://gql.twitch.tv/gql',
        queryHash: '36b89d2507fce29e5ca551df756d27c1cfe079e2609642b4390aa4c35796eb11'
    },
    rateLimit: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: process.env.RATE_LIMIT_MAX || 100
    },
    security: {
        helmet: {
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    connectSrc: ["'self'", "https://gql.twitch.tv"],
                    imgSrc: ["'self'", "https://*.twitch.tv", "data:"],
                    scriptSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'"]
                }
            }
        }
    }
};

module.exports = config;
