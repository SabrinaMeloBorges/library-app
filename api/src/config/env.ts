import 'dotenv/config';
import { z } from 'zod';

const csv = z
  .string()
  .default('')
  .transform((value) =>
    value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean),
  );

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3333),
  DATA_STORE: z.enum(['mysql', 'memory']).default('mysql'),
  DATABASE_URL: z.string().optional(),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET precisa ter pelo menos 32 caracteres'),
  JWT_EXPIRES_IN_HOURS: z.coerce.number().int().positive().max(720).default(168),
  BCRYPT_COST: z.coerce.number().int().min(4).max(15).default(12),
  CORS_ORIGINS: csv,
  APP_TIMEZONE: z.string().default('America/Sao_Paulo'),
  RATE_LIMIT_WINDOW_MINUTES: z.coerce.number().int().positive().default(15),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().positive().default(300),
  AUTH_RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().positive().default(20),
});

export type AppConfig = z.infer<typeof envSchema>;

export const loadConfig = (source: NodeJS.ProcessEnv = process.env): AppConfig => {
  const parsed = envSchema.safeParse(source);
  if (!parsed.success) {
    const details = parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`);
    throw new Error(`Variáveis de ambiente inválidas:\n${details.join('\n')}`);
  }
  const config = parsed.data;
  if (config.DATA_STORE === 'mysql' && !config.DATABASE_URL) {
    throw new Error('DATABASE_URL é obrigatória quando DATA_STORE=mysql');
  }
  if (config.DATA_STORE === 'memory' && config.NODE_ENV === 'production') {
    throw new Error('DATA_STORE=memory não é permitido em produção');
  }
  return config;
};
