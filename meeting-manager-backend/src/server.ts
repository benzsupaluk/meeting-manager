import { createApp } from './app.js';
import { env } from './config/env.js';
import { createContainer } from './container.js';

const { repos, services } = await createContainer(env);
const app = createApp(services, { corsOrigin: env.CORS_ORIGIN });

const server = app.listen(env.PORT, () => {
  console.log(`[api] listening on http://localhost:${env.PORT}/api (db: ${env.DB_DRIVER})`);
});

const shutdown = (signal: string) => {
  console.log(`[api] ${signal} received, shutting down`);
  server.close(() => {
    void repos.close().finally(() => process.exit(0));
  });
};
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
