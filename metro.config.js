const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

const allowedOrigins = (process.env.METRO_ALLOWED_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

config.server = {
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      if (allowedOrigins.length > 0) {
        const origin = req.headers.origin;
        if (origin && allowedOrigins.includes(origin)) {
          res.setHeader('Access-Control-Allow-Origin', origin);
        }
      }
      return middleware(req, res, next);
    };
  },
};

module.exports = config;
