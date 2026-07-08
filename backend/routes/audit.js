const express = require('express');
const AuditLog = require('../models/AuditLog');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, requireRole('principal', 'admin'), async (req, res) => {
  const { entity, action, userId, limit = 200 } = req.query;
  const filter = {};
  if (entity) filter.entity = entity;
  if (action) filter.action = action;
  if (userId) filter.userId = userId;
  const items = await AuditLog.find(filter).sort({ createdAt: -1 }).limit(Math.min(parseInt(limit, 10) || 200, 1000));
  res.json(items);
});

module.exports = router;
