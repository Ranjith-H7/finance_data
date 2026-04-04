import mongoose, { Schema, type Document } from 'mongoose';

export type PermissionScope = 'single_user' | 'all_users';
export type PermissionStatus = 'pending' | 'approved' | 'rejected';

export interface IAnalystPermission extends Document {
  analystId: mongoose.Types.ObjectId;
  scope: PermissionScope;
  userId?: mongoose.Types.ObjectId;
  reason?: string;
  status: PermissionStatus;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AnalystPermissionSchema = new Schema(
  {
    analystId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    scope: {
      type: String,
      enum: ['single_user', 'all_users'],
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    reason: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

AnalystPermissionSchema.index({ analystId: 1, scope: 1, userId: 1, status: 1 });

export default mongoose.model<IAnalystPermission>('AnalystPermission', AnalystPermissionSchema);