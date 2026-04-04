import mongoose, { Schema, Document } from 'mongoose';

export interface IFinanceRecord extends Document {
  userId: mongoose.Types.ObjectId;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: Date;
  note?: string;
  paymentMethod: 'UPI' | 'CASH' | 'CARD';
  merchant: string;
  createdAt: Date;
  updatedAt: Date;
}

const FinanceRecordSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    type: {
      type: String,
      enum: ['income', 'expense'],
      required: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    date: {
      type: Date,
      required: true,
    },
    note: {
      type: String,
      trim: true,
    },
    paymentMethod: {
      type: String,
      enum: ['UPI', 'CASH', 'CARD'],
      required: true,
    },
    merchant: {
      type: String,
      trim: true,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IFinanceRecord>(
  'FinanceRecord',
  FinanceRecordSchema
);
