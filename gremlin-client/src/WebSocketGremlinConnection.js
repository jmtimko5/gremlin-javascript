import { EventEmitter } from 'events';

import WebSocket from 'ws';

export default class WebSocketGremlinConnection extends EventEmitter {
  constructor({
    port,
    host,
    path,
    ssl,
    rejectUnauthorized,
    autoReconnect,
    reconnectAttempts,
  }) {
    super();

    this.open = false;

    const address = `ws${ssl ? 's' : ''}://${host}:${port}${path}`;
    const options = {
      rejectUnauthorized,
      autoReconnect,
      reconnectAttempts,
    };

    this.ws = {};
    this.ws.isAlive = false;
    this.ws = this.createNewWebSocket(address, options);

    const interval = setInterval(function ping() {
      if (this.ws.isAlive === false) {
        return this.ws.terminate();
      }

      this.ws.isAlive = false;
      this.ws.ping('', false, true);
      console.log('pinging');
    }, 3000);
  }

  heartbeat() {
    this.ws.isAlive = true;
  }

  createNewWebSocket(address, options) {
    var ws = new WebSocket(address, null, options);

    ws.on('connection', function connection(ws) {
      ws.isAlive = true;
      ws.on('pong', this.heartbeat());
    });

    ws.onopen = () => this.onOpen();
    ws.onerror = err => this.handleError(err);
    ws.onmessage = message => this.handleMessage(message);
    ws.onclose = event => this.onClose(event);
    ws.binaryType = 'arraybuffer';

    return ws;
  }

  onOpen() {
    this.open = true;
    this.emit('open');
  }

  handleError(err) {
    this.emit('error', err);
  }

  handleMessage(message) {
    this.emit('message', message);
  }

  onClose(event) {
    this.open = false;
    this.emit('close', event);
  }

  sendMessage(message) {
    this.ws.send(message, { mask: true, binary: true }, err => {
      if (err) {
        this.handleError(err);
      }
    });
  }
}
