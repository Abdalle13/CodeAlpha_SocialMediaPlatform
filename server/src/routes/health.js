import { Router } from 'express';
import { config } from '../config/env.js';

export const healthRouter = Router();

healthRouter.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'veyra-api',
    environment: config.env,
  });
});

