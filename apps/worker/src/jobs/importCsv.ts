
import { Job } from 'bullmq';
import { parse } from 'csv-parse/sync';
import { Transaction } from '../../../apps/api/src/models/Transaction';
import mongoose from 'mongoose';

export async function importCsvProcessor(job: Job<{ userId: string; csv: string }>) {
  const { userId, csv } = job.data;
  const records = parse(csv, { columns: true, skip_empty_lines: true });
  const docs = records.map((r: any) => ({
    userId: new (mongoose as any).Types.ObjectId(userId),
    date: new Date(r.date),
    amount: Number(r.amount),
    currency: r.currency || 'EUR',
    description: r.description || ''
  }));
  if (docs.length) await (Transaction as any).insertMany(docs, { ordered: false });
  return { inserted: docs.length };
}
