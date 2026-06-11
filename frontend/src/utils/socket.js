import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

let socket;

export function getSocket() {
  if (!socket) {
    const token = localStorage.getItem('token');
    socket = io(SOCKET_URL, { auth: { token }, transports: ["polling"] });

    // forward notifications
    socket.on('notification', (payload) => {
      window.dispatchEvent(new CustomEvent('socket:notification', { detail: payload }));
    });

    // presence updates
    socket.on('presence', (payload) => {
      window.dispatchEvent(new CustomEvent('socket:presence', { detail: payload }));
    });
  }
  return socket;
}

export function joinDocument(docId) {
  const s = getSocket();
  s.emit('join-document', docId);
}

export function onDocumentInit(cb) {
  const s = getSocket();
  s.off('document:init');
  s.on('document:init', (payload) => cb(payload));
}

export function onDocumentUpdate(cb) {
  const s = getSocket();
  s.off('document:update');
  s.on('document:update', (payload) => cb(payload));
}

export function sendDocumentUpdate(docId, content) {
  const s = getSocket();
  s.emit('document:update', { docId, content });
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export default {
  getSocket,
  joinDocument,
  onDocumentInit,
  onDocumentUpdate,
  sendDocumentUpdate,
  disconnectSocket,
};
