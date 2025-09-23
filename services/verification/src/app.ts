import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config, validateConfig } from './config';
import { createServiceLogger, requestLoggingMiddleware } from '@proofgraph/shared';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { 
  apiRateLimiter, 
  writeOperationRateLimiter, 
  readOperationRateLimiter,
  healthCheckRateLimiter 
} from './middleware/rateLimiter';
import verificationRoutes from './routes/verificationRoutes';

// Initialize logger
const logger = createServiceLogger('verification-service');

/**
 * Create Express application
 */
function createApp(): express.Application {
  const app = express();

  // Security middleware
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    }
  }));

  // CORS configuration
  app.use(cors({
    origin: config.corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  }));

  // Body parsing middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Request logging
  if (config.nodeEnv === 'development') {
    app.use(morgan('dev'));
  }
  app.use(requestLoggingMiddleware('verification-service'));

  // Rate limiting
  app.use(apiRateLimiter);

  // Health check endpoint (with lenient rate limiting)
  app.get('/health', healthCheckRateLimiter, (req, res) => {
    res.json({
      success: true,
      data: {
        status: 'healthy',
        service: 'verification-service',
        timestamp: Date.now(),
        version: '0.1.0',
        environment: config.nodeEnv
      },
      timestamp: Date.now()
    });
  });

  // API routes with specific rate limiting
  app.use(`${config.apiPrefix}/anchor`, writeOperationRateLimiter);
  app.use(`${config.apiPrefix}/verify`, writeOperationRateLimiter);
  app.use(`${config.apiPrefix}/verification`, readOperationRateLimiter);
  app.use(`${config.apiPrefix}/stats`, readOperationRateLimiter);
  app.use(`${config.apiPrefix}/contributor`, readOperationRateLimiter);
  app.use(`${config.apiPrefix}/health`, healthCheckRateLimiter);

  // Mount API routes
  app.use(config.apiPrefix, verificationRoutes);

  // 404 handler
  app.use(notFoundHandler);

  // Global error handler
  app.use(errorHandler);

  return app;
}

/**
 * Start the server
 */
async function startServer(): Promise<void> {
  try {
    // Validate configuration
    validateConfig();
    logger.info('Configuration validated successfully');

    // Create Express app
    const app = createApp();

    // Start server
    const server = app.listen(config.port, () => {
      logger.info(`Verification service started`, {
        port: config.port,
        environment: config.nodeEnv,
        apiPrefix: config.apiPrefix,
        stacksNetwork: config.stacksNetwork
      });
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received, shutting down gracefully');
      server.close(() => {
        logger.info('Server closed');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      logger.info('SIGINT received, shutting down gracefully');
      server.close(() => {
        logger.info('Server closed');
        process.exit(0);
      });
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught exception', { error: error.message, stack: error.stack });
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled rejection', { reason, promise });
      process.exit(1);
    });

  } catch (error) {
    logger.error('Failed to start server', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    process.exit(1);
  }
}

// Start the server if this file is run directly
if (require.main === module) {
  startServer();
}

export { createApp, startServer };
