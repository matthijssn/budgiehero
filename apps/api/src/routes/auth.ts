
import { Router } from 'express';
import { getGoogleClient, codeChallenge, codeVerifier } from '../config/oidc';
import { signSession } from '../utils/jwt';
import { User } from '../models/User';

export const auth = Router();

auth.get('/google', async (_req, res) => {
  const client = await getGoogleClient();
  const redirectUri = client.authorizationUrl({
    scope: 'openid email profile',
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    prompt: 'consent',
    access_type: 'offline'
  });
  res.redirect(redirectUri);
});

auth.get('/google/callback', async (req, res) => {
  const client = await getGoogleClient();
  const params = client.callbackParams(req);
  const tokenSet = await client.callback(process.env.OIDC_REDIRECT_URI!, params, { code_verifier: codeVerifier });
  const claims = tokenSet.claims();
  const email = claims.email as string;
  const name = claims.name as string | undefined;
  const sub = claims.sub as string;

  if (!email) return res.status(400).send('No email in claims');

  const user = await User.findOneAndUpdate(
    { email },
    { name, provider: 'google', providerId: sub, picture: (claims.picture as string)|undefined },
    { new: true, upsert: true }
  );

  const jwt = signSession({ userId: user._id.toString(), email: user.email, name: user.name });
  const cookieOpts = {
    httpOnly: true,
    secure: true,
    sameSite: 'lax' as const,
    maxAge: 7 * 24 * 60 * 60 * 1000
  };
  res.cookie('bh_session', jwt, cookieOpts);

  const frontend = process.env.FRONTEND_ORIGIN || '/';
  res.redirect(frontend);
});

auth.post('/logout', async (_req, res) => {
  res.clearCookie('bh_session', { httpOnly: true, secure: true, sameSite: 'lax' });
  res.status(204).end();
});
