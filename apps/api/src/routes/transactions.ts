import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { Transaction } from '../models/Transaction';
import { requireAuth } from '../middleware/auth';

const INLINE = process.env.INLINE_JOBS === 'true' || !process.env.REDIS_URL;

// Optioneel (alleen als je queues wilt gebruiken):
// - REDIS_URL aanwezig
// - INLINE_JOBS !== 'true'
let importQueue: import('bullmq').Queue | undefined;
let categorizeQueue: import('bullmq').Queue | undefined;
let redisReady = false;

if (!INLINE && process.env.REDIS_URL) {
  (async () => {
    const IORedis = (await import('ioredis')).default;
    const { Queue } = await import('bullmq');
    const connection = new IORedis(process.env.REDIS_URL!);
    importQueue = new Queue('import', { connection });
    categorizeQueue = new Queue('categorize', { connection });
    redisReady = true;
  })().catch((e) => {
    console.error('[transactions] Redis init failed, falling back to inline:', e);
  });
}

// Lazy imports voor inline path (zodat we libs alleen laden wanneer nodig)
async function inlineParseAndInsertCSV(userId: string, csv: string) {
  const { parse } = await import('csv-parse/sync');
  const records: any[] = parse(csv, { columns: true, skip_empty_lines: true });

  // Basic kolommen: date, amount, currency?, description?
  // Valideer minimaal
  const Row = z.object({
    date: z.string().min(1),
    amount: z.union([z.string(), z.number()]),
    currency: z.string().optional(),
    description: z.string().optional(),
  });

  let inserted = 0;
  const batchDocs: any[] = [];
  for (const raw of records) {
    const r = Row.parse(raw);
    batchDocs.push({
      userId,
      date: new Date(r.date),
      amount: typeof r.amount === 'string' ? Number(r.amount) : r.amount,
      currency: r.currency || 'EUR',
      description: r.description || '',
    });
  }

  if (batchDocs.length) {
    await (Transaction as any).insertMany(batchDocs, { ordered: false });
    inserted = batchDocs.length;
  }
  return { inserted };
}

async function inlineCategorizeRecent(userId: string, limit = 500) {
  // Categoriseer de meest recente nog-ongelabelde transacties van deze user
  // (zowel net ingevoerde als eerder geïmporteerde)
  const { categorize } = await import('../../../packages/shared/src/categorize');

  const batch = await Transaction.find({
    userId,
    $or: [{ category: { $exists: false } }, { category: null }, { category: '' }],
  })
    .sort({ createdAt: -1 })
    .limit(limit);

  for (const tx of batch) {
    const { category, confidence } = categorize({ description: tx.description, amount: tx.amount });
    (tx as any).category = category;
    (tx as any).confidence = confidence;
    await tx.save();
  }
  return { processed: batch.length };
}

/**
 * Zod schema's
 */
const GetQuerySchema = z.object({
  limit: z
    .string()
    .optional()
    .transform((v) => (v ? Math.min(Math.max(Number(v), 1), 1000) : 200)),
});

const CreateBodySchema = z.object({
  date: z.coerce.date(),
  amount: z.number(),
  currency: z.string().default('EUR'),
  description: z.string().optional(),
  category: z.string().optional(),
});

const ImportCsvBodySchema = z.object({
  csv: z.string().min(1, 'csv required'),
});

export const router = Router();

router.use(requireAuth);

/**
 * GET /api/transactions?limit=200
 * Haal de meest recente transacties van de ingelogde gebruiker op.
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { userId } = (req as any).session;
    const { limit } = GetQuerySchema.parse(req.query);

    const list = await Transaction.find({ userId }).sort({ date: -1 }).limit(limit);
    return res.json(list);
  } catch (err: any) {
    console.error('[GET /api/transactions] error:', err);
    return res.status(400).json({ error: err?.message ?? 'bad request' });
  }
});

/**
 * POST /api/transactions
 * Maak een enkele transactie aan (+ optionele directe categorisatie).
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { userId } = (req as any).session;
    const body = CreateBodySchema.parse(req.body);

    const tx = await Transaction.create({ ...body, userId });

    // Inline categorisatie (ook in gratis setup handig)
    try {
      const { categorize } = await import('../../../packages/shared/src/categorize');
      const { category, confidence } = categorize({ description: tx.description, amount: tx.amount });
      (tx as any).category = category;
      (tx as any).confidence = confidence;
      await tx.save();
    } catch (e) {
      // Niet fataal
      console.warn('[transactions] categorize (single) failed:', e);
    }

    return res.status(201).json(tx);
  } catch (err: any) {
    console.error('[POST /api/transactions] error:', err);
    return res.status(400).json({ error: err?.message ?? 'bad request' });
  }
});

/**
 * POST /api/transactions/import/csv
 * Body: { csv: string }
 * - INLINE modus: parse + insert + categorize in dezelfde request (201).
 * - QUEUE modus: job enqueue (202 Accepted).
 */
router.post('/import/csv', async (req: Request, res: Response) => {
  try {
    const { userId } = (req as any).session;
    const { csv } = ImportCsvBodySchema.parse(req.body);

    // Queue modus wanneer expliciet geconfigureerd
    if (!INLINE && importQueue && categorizeQueue && redisReady) {
      await importQueue.add('import-csv', { userId, csv });
      await categorizeQueue.add('categorize-user', { userId });
      return res.status(202).json({ status: 'queued' });
    }

    // INLINE modus (gratis setup)
    const { inserted } = await inlineParseAndInsertCSV(userId, csv);
    const { processed } = await inlineCategorizeRecent(userId, Math.max(500, inserted));
    return res.status(201).json({
      status: 'done',
      mode: 'inline',
      inserted,
      categorized: processed,
    });
  } catch (err: any) {
    console.error('[POST /api/transactions/import/csv] error:', err);
    return res.status(400).json({ error: err?.message ?? 'bad request' });
  }
});