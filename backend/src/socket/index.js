const { socketManager, SocketManager } = require('./socketManager');

module.exports = {
  socketManager,
  SocketManager,
  ...require('./client')
};
