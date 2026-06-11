const router = require('express').Router();
const User = require('../models/UserModel');
const auth = require('../middleware/authMiddleware');

// GET /api/users?q=search
router.get('/', auth, async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    const filter = { _id: { $ne: req.userId } };
    if (q) {
      const re = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [{ name: re }, { email: re }];
    }
    const users = await User.find(filter).sort({ name: 1, email: 1 }).select('name email');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
});

module.exports = router;
