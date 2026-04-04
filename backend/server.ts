import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './src/config/db.js';
import { ensureDefaultUsers } from './src/config/seedUsers.js';
import userRoutes from './src/routes/routes.js';

dotenv.config();

const app = express();

const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim())
  : ['http://localhost:5173'];

app.use(
  cors({
    origin: allowedOrigins,
  })
);

app.use(express.json());

app.use('/api/users', userRoutes);

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  await connectDB();
  await ensureDefaultUsers();

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
};

startServer();