const hpp = require('hpp');

const sanitizerOptions = {
  whitelist: []
};

const sanitizerMiddleware = hpp(sanitizerOptions);

module.exports = sanitizerMiddleware;
