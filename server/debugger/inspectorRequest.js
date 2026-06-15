export function createInspectorRequest(socket) {
  let nextId = 1;
  const pending = new Map();

  const handleMessage = raw => {
    let message;
    try {
      message = JSON.parse(String(raw));
    } catch {
      return;
    }
    if (!message.id) return;
    const request = pending.get(message.id);
    if (!request) return;
    pending.delete(message.id);
    if (message.error) request.reject(new Error(message.error.message || 'Inspector request failed'));
    else request.resolve(message.result || {});
  };

  socket.on('message', handleMessage);

  return {
    request(method, params = {}) {
      return new Promise((resolve, reject) => {
        const id = nextId++;
        pending.set(id, { resolve, reject });
        socket.send(JSON.stringify({ id, method, params }), error => {
          if (!error) return;
          pending.delete(id);
          reject(error);
        });
      });
    },
    dispose() {
      socket.off('message', handleMessage);
      for (const { reject } of pending.values()) reject(new Error('Inspector disconnected'));
      pending.clear();
    },
  };
}
