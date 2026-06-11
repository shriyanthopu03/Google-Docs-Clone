const router = require('express').Router();
const Document = require('../models/DocumentModel');
const auth = require('../middleware/authMiddleware');

// Create new document (owner set to current user)
router.post('/create', auth, async (req, res) => {
  try {
    const { title = 'Untitled', content = {} } = req.body;
    if (!req.userId) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    const doc = await Document.create({ title, content, owner: req.userId, lastSavedBy: req.userId });
    res.status(201).json(doc);
  } catch (err) {
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
});

// List documents: owned and shared
router.get('/', auth, async (req, res) => {
  try {
    const owned = await Document.find({ owner: req.userId }).sort({ updatedAt: -1 });
    const shared = await Document.find({ collaborators: req.userId }).sort({ updatedAt: -1 });
    res.json({ owned, shared });
  } catch (err) {
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
});

// Get single document with access control (owner or collaborator)
router.get('/:id', auth, async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id).populate('owner collaborators lastSavedBy', 'name email');
    if (!doc) return res.status(404).json({ message: 'Not found' });
    const isOwner = String(doc.owner?._id || doc.owner) === String(req.userId);
    const isCollaborator = (doc.collaborators || []).some((c) => String(c._id || c) === String(req.userId));
    if (!isOwner && !isCollaborator) return res.status(403).json({ message: 'Forbidden' });
    res.json(doc);
  } catch (err) {
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
});

// Update document (owner or collaborator can update content/title)
router.put('/:id', auth, async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Not found' });
    const isOwner = String(doc.owner) === String(req.userId);
    const isCollaborator = (doc.collaborators || []).some((c) => String(c) === String(req.userId));
    if (!isOwner && !isCollaborator) return res.status(403).json({ message: 'Forbidden' });
    const { title, content } = req.body;
    if (title !== undefined) doc.title = title;
    if (content !== undefined) doc.content = content;
    doc.lastSavedBy = req.userId;
    await doc.save();
    res.json(doc);
  } catch (err) {
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
});

// Delete document (only owner)
router.delete('/:id', auth, async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Not found' });
    const isOwner = String(doc.owner) === String(req.userId);
    if (!isOwner) return res.status(403).json({ message: 'Forbidden' });
    await doc.deleteOne();
    res.json({ message: 'Document deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
});

// Add collaborator (only owner can grant)
router.post('/:id/collaborators', auth, async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ message: 'userId is required' });
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Not found' });
    const isOwner = String(doc.owner) === String(req.userId);
    if (!isOwner) return res.status(403).json({ message: 'Forbidden' });
    if (!doc.collaborators.some((c) => String(c) === String(userId))) {
      doc.collaborators.push(userId);
      await doc.save();

      // send realtime notification if io available
      try {
        const io = req.app.get('io');
        const userSockets = req.app.get('userSockets');
        if (io && userSockets) {
          const sockets = userSockets.get(String(userId)) || new Set();
          sockets.forEach((sid) => {
            io.to(sid).emit('notification', { message: `You now have access to document: ${doc.title}`, documentId: doc._id });
          });
        }
      } catch (e) {
        // ignore notification errors
      }
    }
    res.json(doc);
  } catch (err) {
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
});

// Remove collaborator (only owner)
router.delete('/:id/collaborators/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Not found' });
    const isOwner = String(doc.owner) === String(req.userId);
    if (!isOwner) return res.status(403).json({ message: 'Forbidden' });
    doc.collaborators = (doc.collaborators || []).filter((c) => String(c) !== String(userId));
    await doc.save();
    res.json(doc);
  } catch (err) {
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
});

module.exports = router;