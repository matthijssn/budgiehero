
import { Issuer, generators, Client } from 'openid-client';

let clientPromise: Promise<Client> | null = null;
export async function getGoogleClient(): Promise<Client> {
  if (!clientPromise) {
    clientPromise = (async () => {
      const google = await Issuer.discover('https://accounts.google.com');
      const client = new google.Client({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uris: [process.env.OIDC_REDIRECT_URI!],
        response_types: ['code']
      });
      return client;
    })();
  }
  return clientPromise;
}

export const codeVerifier = generators.codeVerifier();
export const codeChallenge = generators.codeChallenge(codeVerifier);
