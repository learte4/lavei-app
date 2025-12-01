const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Configure Metro to allow remote connections
config.server = {
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      // Allow all hosts
      res.setHeader('Access-Control-Allow-Origin', '*');
      return middleware(req, res, next);
    };
  },
};

module.exports = config;
