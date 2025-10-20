
import 'dotenv/config';
import { Worker, QueueEvents } from 'bullmq';
import IORedis from 'ioredis';
import mongoose from 'mongoose';
import { importCsvProcessor } from './jobs/importCsv';
import { categorizeProcessor } from './jobs/categorize';

const redis = new IORedis(process.env.REDIS_URL!);

async function main() {
  await mongoose.connect(process.env.MONGODB_URI!);

  new Worker('import', importCsvProcessor, { connection: redis, concurrency: 2 });
  new Worker('categorize', categorizeProcessor, { connection: redis, concurrency: 4 });

  const importEvents = new QueueEvents('import', { connection: redis });
  const categorizeEvents = new QueueEvents('categorize', { connection: redis });

  importEvents.on('failed', ({ jobId, failedReason }) => console.error('import failed', jobId, failedReason));
  categorizeEvents.on('failed', ({ jobId, failedReason }) => console.error('categorize failed', jobId, failedReason));

  console.log('BudgieHero Worker started. Queues: import, categorize');
}

main().catch((e) => { console.error(e); process.exit(1); });
