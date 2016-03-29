
export function enableDestroy(server) {
  let sockets = { };
  let nextSocketId = 0;

  server.on('connection', function (socket) {
    const socketId = nextSocketId++;
    sockets[socketId] = socket;
    socket.on('close', function () {
      delete sockets[socketId];
    });
  });

  server.destroy = function (callback) {
    const destroy = (resolve, reject) => {
      Object.keys(sockets).forEach(id => sockets[id].destroy());
      sockets = { };
      nextSocketId = 0;
      server.close( error => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    };

    if (callback) {
      destroy(callback, callback);
    } else {
      return new Promise(destroy);
    }
  };
}
