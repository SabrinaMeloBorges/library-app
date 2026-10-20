import { OAuth2Client } from 'google-auth-library';

export interface GoogleIdentity {
  googleId: string;
  email: string;
  emailVerified: boolean;
  name: string;
}

export interface GoogleTokenVerifier {
  verify(idToken: string): Promise<GoogleIdentity | null>;
}

export const createGoogleTokenVerifier = (
  clientId: string | undefined,
): GoogleTokenVerifier | null => {
  if (!clientId) return null;
  const client = new OAuth2Client(clientId);
  return {
    async verify(idToken) {
      try {
        const ticket = await client.verifyIdToken({ idToken, audience: clientId });
        const payload = ticket.getPayload();
        if (!payload?.sub || !payload.email) return null;
        return {
          googleId: payload.sub,
          email: payload.email.toLowerCase(),
          emailVerified: payload.email_verified === true,
          name: payload.name ?? payload.given_name ?? payload.email.split('@')[0],
        };
      } catch {
        return null;
      }
    },
  };
};
