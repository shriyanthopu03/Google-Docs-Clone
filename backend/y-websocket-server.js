const http = require('http');
const WebSocket = require('ws');
const { setupWSConnection } = require('y-websocket/bin/utils');

const port = process.env.YWS_PORT || 1234;

const server = http.createServer();
const wss = new WebSocket.Server({ server });

wss.on('connection', (conn, req) => {
  // req.url contains the doc name
  setupWSConnection(conn, req, { gc: true });
});

server.listen(port, () => {
  console.log(`Yjs WebSocket Server running on ws://localhost:${port}`);
});
