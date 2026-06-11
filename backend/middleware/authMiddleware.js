const jwt = require('jsonwebtoken');

module.exports = function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    const cookieToken = req.cookies?.token;
    const token = bearerToken || cookieToken;

    if (!token) {
      return res.status(401).json({ message: 'Please login first' });
    }

    const jwtSecret = process.env.JWT_SECRET || process.env.SECRET_KEY;
    const decodedToken = jwt.verify(token, jwtSecret);

    req.userId = decodedToken.id || decodedToken._id || decodedToken.userId;
    req.user = decodedToken;

    if (!req.userId) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};