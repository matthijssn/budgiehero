
import { Router } from 'express';
import { Transaction } from '../models/Transaction';
import { requireAuth } from '../middleware/auth';
import { Queue } from 'bullmq';
import IORedis from 'ioredis';

const connection = new IORedis(process.env.REDIS_URL!);
const importQueue = new Queue('import', { connection });
const categorizeQueue = new Queue('categorize', { connection });

export const router = Router();

router.use(requireAuth);

router.get('/', async (req, res) => {
  const { userId } = (req as any).session;
  const list = await Transaction.find({ userId }).sort({ date: -1 }).limit(200);
  res.json(list);
});

router.post('/', async (req, res) => {
  const { userId } = (req as any).session;
  const body = req.body;
  body.userId = userId;
  const tx = await Transaction.create(body);
  // optional: enqueue categorize for single tx
  await categorizeQueue.add('categorize-single', { txId: tx._id });
  res.status(201).json(tx);
});

router.post('/import/csv', async (req, res) => {
  const { userId } = (req as any).session;
  const csv = req.body.csv as string;
  if (!csv) return res.status(400).json({ error: 'csv required' });
  await importQueue.add('import-csv', { userId, csv });
  res.status(202).json({ status: 'queued' });
});
