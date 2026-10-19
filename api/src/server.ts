import { PrismaClient } from '@prisma/client';
import { createApp } from './app';
import { loadConfig } from './config/env';
import type { Repositories } from './repositories/contracts';
import { createMemoryRepositories } from './repositories/memory/memoryRepositories';
import { createPrismaRepositories } from './repositories/prisma/prismaRepositories';

const bootstrap = async (): Promise<void> => {
  const config = loadConfig();
  let prisma: PrismaClient | null = null;
  let repositories: Repositories;

  if (config.DATA_STORE === 'memory') {
    console.warn('[library-api] DATA_STORE=memory: os dados serão perdidos ao reiniciar a API.');
    repositories = createMemoryRepositories();
  } else {
    prisma = new PrismaClient();
    await prisma.$connect();
    repositories = createPrismaRepositories(prisma);
  }

  const server = createApp({ config, repositories }).listen(config.PORT, '0.0.0.0', () => {
    console.info(`[library-api] ouvindo na porta ${config.PORT} (docs em /docs)`);
  });

  const shutdown = (): void => {
    server.close(async () => {
      await prisma?.$disconnect();
      process.exit(0);
    });
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
};

bootstrap().catch((error: unknown) => {
  console.error('[library-api] falha ao iniciar:', error instanceof Error ? error.message : error);
  process.exit(1);
});
