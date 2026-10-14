import type { TokenIdentity } from '../services/authService';

declare global {
  namespace Express {
    interface Request {
      auth?: TokenIdentity;
    }
  }
}

export {};
