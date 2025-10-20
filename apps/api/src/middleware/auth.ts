
import { Request, Response, NextFunction } from 'express';
import { verifySession } from '../utils/jwt';

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization || '';
  const cookie = (req.headers['cookie'] || '').split(';').find(c=>c.trim().startsWith('bh_session='));
  let token: string | undefined;
  if (header.startsWith('Bearer ')) token = header.substring(7);
  else if (cookie) token = cookie.split('=')[1];
  if (!token) return res.status(401).json({ error: 'unauthorized' });
  try {
    const session = verifySession(token);
    (req as any).session = session;
    next();
  } catch {
    return res.status(401).json({ error: 'invalid token' });
  }
}
