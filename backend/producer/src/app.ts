import express from 'express';
import cors from 'cors';
import { config } from './config/index.js';
import { logger } from './utils/logger.js';
import { connectRabbitMQ, closeRabbitMQ } from './messaging/rabbitmq.js';
import { complaintsRouter } from './routes/complaints.routes.js';
import { errorHandler } from './middlewares/errorHandler.js';

const app = express();

// Middleware
const allowedOrigins = [
  'http://localhost',
  'http://localhost:80',
  'http://127.0.0.1',
  'http://127.0.0.1:80'
];
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/complaints', complaintsRouter);

// Health check endpoint
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Graceful shutdown
const gracefulShutdown = async (signal: string): Promise<void> => {
  logger.info(`Received ${signal}. Shutting down gracefully...`);
  await closeRabbitMQ();
  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server
const startServer = async (): Promise<void> => {
  try {
    // Connect to RabbitMQ
    await connectRabbitMQ();

    // Start Express server
    app.listen(config.port, () => {
      logger.info(`Producer service started`, {
        port: config.port,
        environment: config.nodeEnv,
      });
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to start server', { error: errorMessage });
    process.exit(1);
  }
};

startServer();

export { app };
