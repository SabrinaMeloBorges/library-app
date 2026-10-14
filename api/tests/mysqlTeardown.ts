import { afterAll } from 'vitest';
import { disconnectTestDatabase } from './helpers';

afterAll(disconnectTestDatabase);
