const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'resonance-dev-secret-change-in-prod';
const JWT_EXPIRES = '7d';

function signToken(user) {
  return jwt.sign(
    { id: user._id, role: user.role, username: user.username },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES }
  );
}

async function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Missing token' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(payload.id);
    if (!user || !user.active) return res.status(401).json({ error: 'Invalid user' });
    req.user = user;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: `Forbidden. Requires: ${roles.join(', ')}` });
    }
    next();
  };
}

module.exports = { auth, requireRole, signToken, JWT_SECRET };
