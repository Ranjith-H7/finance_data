import cors from 'cors';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const helmet = require('helmet') as () => ReturnType<typeof cors>;
const rateLimit = require('express-rate-limit').rateLimit as (options: Record<string, unknown>) => ReturnType<typeof cors>;

const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim())
  : ['http://localhost:5173'];

export const corsMiddleware = cors({
  origin: allowedOrigins,
  credentials: true,
});

export const helmetMiddleware = helmet();

export const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX || 200),
  standardHeaders: true,
  legacyHeaders: false,
});

export const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.LOGIN_RATE_LIMIT_MAX || 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_LOGIN_ATTEMPTS',
      message: 'Too many login attempts. Please try again later.',
    },
  },
});
