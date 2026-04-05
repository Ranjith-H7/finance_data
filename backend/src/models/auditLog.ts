import mongoose, { Schema, Document } from 'mongoose';

export interface IAuditLog extends Document {
  actorId: mongoose.Types.ObjectId;
  action: string;
  targetType: 'user' | 'finance_record' | 'permission';
  targetId?: string;
  details?: Record<string, unknown>;
  createdAt: Date;
}

const AuditLogSchema = new Schema(
  {
    actorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action: {
      type: String,
      required: true,
      trim: true,
    },
    targetType: {
      type: String,
      enum: ['user', 'finance_record', 'permission'],
      required: true,
    },
    targetId: {
      type: String,
      trim: true,
    },
    details: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: { updatedAt: false },
  }
);

export default mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
