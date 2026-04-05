import dotenv from 'dotenv';
import { connectDB } from './src/config/db.js';
import { ensureDefaultUsers } from './src/config/seedUsers.js';
import { createApp } from './src/app.js';
import { attachGraphQL } from './src/graphql/schema.js';
import { errorHandler, notFoundHandler } from './src/middleware/errorHandler.js';

dotenv.config();

const app = createApp(false);

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  await connectDB();
  await ensureDefaultUsers();
  await attachGraphQL(app);

  app.use(notFoundHandler);
  app.use(errorHandler);

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
};

startServer().catch((error) => {
  console.error('Server startup failed:', error);
  if (error && typeof error === 'object') {
    console.error('Startup error keys:', Object.keys(error));
  }
  process.exit(1);
});