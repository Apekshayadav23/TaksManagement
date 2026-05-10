import 'dotenv/config';
import app from './app.js';
import { initDatabase } from './models/index.js';

const PORT = Number(process.env.PORT || 5000);

async function bootstrap() {
  await initDatabase();
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

bootstrap().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
