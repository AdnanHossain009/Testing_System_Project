const AuditLog = require('../models/AuditLog');

const logAction = async ({ actor, action, entityType, entityId, metadata = {} }) => {
  try {
    await AuditLog.create({ actor, action, entityType, entityId, metadata });
  } catch (error) {
    console.error('Audit log failed:', error.message);
  }
};

module.exports = { logAction };
