import AuditLog from '../models/auditLog.js';

interface AuditEvent {
  actorId: string;
  action: string;
  targetType: 'user' | 'finance_record' | 'permission';
  targetId?: string;
  details?: Record<string, unknown>;
}

export const logAuditEvent = async ({ actorId, action, targetType, targetId, details }: AuditEvent) => {
  const payload: {
    actorId: string;
    action: string;
    targetType: 'user' | 'finance_record' | 'permission';
    targetId?: string;
    details?: Record<string, unknown>;
  } = {
    actorId,
    action,
    targetType,
  };

  if (targetId !== undefined) {
    payload.targetId = targetId;
  }

  if (details !== undefined) {
    payload.details = details;
  }

  await AuditLog.create({
    ...payload,
  });
};
