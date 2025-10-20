
import { Job } from 'bullmq';
import { Transaction } from '../../../apps/api/src/models/Transaction';
import { categorize } from '../../../packages/shared/src/categorize';

export async function categorizeProcessor(_job: Job) {
  const batch = await Transaction.find({ $or: [ { category: { $exists: false } }, { category: null }, { category: '' } ] })
                                .sort({ createdAt: -1 }).limit(500);
  for (const tx of batch) {
    const { category, confidence } = categorize({ description: tx.description, amount: tx.amount });
    tx.category = category; (tx as any).confidence = confidence;
    await tx.save();
  }
  return { processed: batch.length };
}
