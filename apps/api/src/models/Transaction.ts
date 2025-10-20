
import { Schema, model, Types } from 'mongoose';

const TransactionSchema = new Schema(
  {
    userId: { type: Types.ObjectId, index: true, required: true, ref: 'User' },
    date: { type: Date, required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'EUR' },
    description: { type: String },
    category: { type: String },
    confidence: { type: Number }
  },
  { timestamps: true }
);

export const Transaction = model('Transaction', TransactionSchema);
