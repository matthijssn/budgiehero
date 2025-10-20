
import jwt, { Secret, SignOptions } from 'jsonwebtoken';

const JWT_SECRET : Secret = process.env.JWT_SECRET || 'dev_secret_change_me';

export type SessionPayload = { userId: string; email: string; name?: string };

type Expires = SignOptions['expiresIn'];  // => number | StringValue | undefined


export function signSession(
  payload: SessionPayload,
  expiresIn: Expires = '7d' // '7d' is compatibel met StringValue
) {
  const opts: SignOptions = {};
  if (expiresIn !== undefined) opts.expiresIn = expiresIn;
  return jwt.sign(payload, JWT_SECRET, opts);
}


export function verifySession(token: string): SessionPayload {
  return jwt.verify(token, JWT_SECRET) as SessionPayload;
}
