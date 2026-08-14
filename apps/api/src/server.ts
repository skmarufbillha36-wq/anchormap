import app from './app';
import { env } from './config/env';
import { prisma } from '@ankara-gis/database';

const PORT = env.PORT;

async function main() {
  // Verify database connection before accepting traffic
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Database connected');
  } catch (err) {
    console.error('❌ Database connection failed:', err);
    process.exit(1);
  }

  const server = app.listen(PORT, () => {
    console.log(`\n🗺️  ================================`);
    console.log(`   AnchorMap GIS API`);
    console.log(`   http://localhost:${PORT}/api/v1`);
    console.log(`================================= 🗺️\n`);
  });

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    console.log(`\n${signal} received. Shutting down gracefully...`);
    server.close(async () => {
      await prisma.$disconnect();
      console.log('Database disconnected. Bye! 👋');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
