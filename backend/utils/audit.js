const AuditLog = require('../models/AuditLog');

async function writeAudit({ action, entity, entityId = '', before = null, after = null, user = {}, ip = '', reason = '' }) {
  try {
    await AuditLog.create({
      action,
      entity,
      entityId,
      before,
      after,
      userId: user._id || user.id || '',
      userName: user.fullName || user.username || '',
      userRole: user.role || '',
      ip,
      reason,
    });
  } catch (e) {
    console.error('[audit] failed', e.message);
  }
}

module.exports = { writeAudit };
