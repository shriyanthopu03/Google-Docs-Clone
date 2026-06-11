require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const WebSocket = require('ws');
const { setupWSConnection } = require('y-websocket/bin/utils');

const authRoutes = require('./APIs/authAPI');
const docRoutes = require('./APIs/documentAPI');
const userRoutes = require('./APIs/userAPI');
const Document = require('./models/DocumentModel');

const app = express();

const allowedOrigins = [process.env.FRONTEND_URL, process.env.BACKEND_URL].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error('Not allowed by CORS'));
  },
};

app.use(cors(corsOptions));
app.use(express.json());

// ROUTES
app.use('/api/auth', authRoutes);
app.use('/api/documents', docRoutes);
app.use('/api/users', userRoutes);

// Backward-compatible aliases for older clients
app.use('/auth', authRoutes);
app.use('/documents', docRoutes);

// MONGODB CONNECTION
const mongoUrl = process.env.mongob_url || process.env.MONGO_URL;

if (!mongoUrl || (!mongoUrl.startsWith('mongodb://') && !mongoUrl.startsWith('mongodb+srv://'))) {
  console.warn('MongoDB connection skipped: set mongob_url to a valid mongodb URI in backend/.env');
} else {
  mongoose.connect(mongoUrl)
    .then(() => console.log('MongoDB Connected'))
    .catch((err) => console.error('MongoDB connection error', err));
}

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

// Socket.IO for realtime document sync (Phase 3)
const io = new Server(server, {
  cors: corsOptions,
});

// map userId => Set(socketId)
const userSockets = new Map();
app.set('userSockets', userSockets);

// expose io to routes
app.set('io', io);

// socket auth middleware
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth && socket.handshake.auth.token;
    if (!token) return next();
    const secret = process.env.JWT_SECRET || process.env.SECRET_KEY;
    const decoded = jwt.verify(token, secret);
    socket.userId = decoded.id || decoded._id || decoded.userId;
    return next();
  } catch (e) {
    // allow unauthenticated sockets for now but they won't be authorized to join docs
    return next();
  }
});

io.on('connection', (socket) => {
  // register socket under userId for notifications
  try {
    if (socket.userId) {
      const set = userSockets.get(String(socket.userId)) || new Set();
      set.add(socket.id);
      userSockets.set(String(socket.userId), set);
    }
  } catch (e) {}

  socket.on('join-document', async (docId) => {
    try {
      // access control: only owner or collaborator can join
      const doc = await Document.findById(docId);
      const uid = String(socket.userId || '');
      const isOwner = doc && String(doc.owner) === uid;
      const isCollaborator = doc && (doc.collaborators || []).some((c) => String(c) === uid);
      if (!doc || (!isOwner && !isCollaborator)) {
        socket.emit('access-denied', { message: 'Access denied' });
        return;
      }

      socket.join(docId);

      // send current document content
      socket.emit('document:init', { content: doc.content });

      // broadcast presence to room
      try {
        const clients = io.sockets.adapter.rooms.get(docId) || new Set();
        const users = [];
        for (const sid of clients) {
          const s = io.sockets.sockets.get(sid);
          if (s && s.userId) users.push(String(s.userId));
        }
        io.to(docId).emit('presence', { users });
      } catch (e) {}

    } catch (err) {
      console.error('join-document error', err);
    }
  });

  socket.on('document:update', async (payload) => {
    try {
      const { docId, content } = payload || {};
      if (!docId) return;

      // broadcast to other clients in the room
      socket.to(docId).emit('document:update', { content });

      // persist latest content (fire-and-forget)
      Document.findById(docId).then((doc) => {
        if (!doc) return;
        doc.content = content;
        doc.save().catch((e) => console.error('save error', e));
      }).catch(() => {});
    } catch (err) {
      console.error('document:update error', err);
    }
  });

  socket.on('disconnect', () => {
    try {
      if (socket.userId) {
        const set = userSockets.get(String(socket.userId));
        if (set) {
          set.delete(socket.id);
          if (set.size === 0) userSockets.delete(String(socket.userId));
        }
      }
    } catch (e) {}
  });
});

// Yjs WebSocket endpoint (for CRDT collaboration and awareness)
try {
  const wss = new WebSocket.Server({ server, path: '/yjs' });
  wss.on('connection', (conn, req) => {
    // req.url contains the doc name and query
    setupWSConnection(conn, req, { gc: true });
  });
  console.log('Yjs websocket mounted at /yjs');
} catch (e) {
  console.warn('Yjs websocket could not be started', e.message || e);
}

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});