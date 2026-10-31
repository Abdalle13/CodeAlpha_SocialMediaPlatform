import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { config } from './config/env.js';
import { healthRouter } from './routes/health.js';
import { mediaRouter } from './routes/media.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

export function createApp() {
  const app = express();

  // Security headers via Helmet
  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }));

  // Strict CORS configuration
  app.use(cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (such as mobile apps or curl) or if origin is in allowlist
      if (!origin || config.allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS blocked for origin: ${origin}`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Bootstrap-Secret'],
  }));

  // Global rate limiter
  const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 300, // Limit each IP to 300 requests per window
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: { message: 'Too many requests. Please try again later.', status: 429 } },
  });
  app.use(globalLimiter);

  // Parse JSON bodies with safe size limit
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // Routes
  app.use('/api', healthRouter);
  app.use('/api', mediaRouter);

  // 404 & Global Error Handlers
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

