import 'dotenv/config';
import app from './app.js';
import { initDatabase } from './models/index.js';

const PORT = Number(process.env.PORT || 5000);

async function bootstrap() {
  await initDatabase();
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

bootstrap().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
