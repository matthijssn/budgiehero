
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import cookieParser from 'cookie-parser';
import { router as transactions } from './routes/transactions';
import { auth } from './routes/auth';

const app = express();
app.use(helmet());
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());
app.use(cors({ origin: process.env.FRONTEND_ORIGIN, credentials: true }));

app.get('/health', (_req, res) => res.json({ ok: true, ts: new Date().toISOString() }));
app.use('/auth', auth);
app.use('/api/transactions', transactions);

const port = Number(process.env.PORT || 3000);
const uri = process.env.MONGODB_URI!;
mongoose
  .connect(uri)
  .then(() => {
    app.listen(port, () => console.log(`API on :${port}`));
  })
  .catch((err) => {
    console.error('Mongo connect failed', err);
    process.exit(1);
  });
