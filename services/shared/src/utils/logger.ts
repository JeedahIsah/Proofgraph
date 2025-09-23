import winston from 'winston';

/**
 * Logger configuration for ProofGraph services
 */

const logLevel = process.env.LOG_LEVEL || 'info';
const nodeEnv = process.env.NODE_ENV || 'development';

/**
 * Custom log format
 */
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
    return JSON.stringify({
      timestamp,
      level,
      service: service || 'proofgraph',
      message,
      ...meta
    });
  })
);

/**
 * Console format for development
 */
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'HH:mm:ss'
  }),
  winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `${timestamp} [${service || 'proofgraph'}] ${level}: ${message} ${metaStr}`;
  })
);

/**
 * Create logger instance
 */
export const logger = winston.createLogger({
  level: logLevel,
  format: logFormat,
  defaultMeta: { service: 'proofgraph' },
  transports: [
    // Console transport for development
    new winston.transports.Console({
      format: nodeEnv === 'development' ? consoleFormat : logFormat
    })
  ]
});

// Add file transport for production
if (nodeEnv === 'production') {
  logger.add(new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error',
    format: logFormat
  }));
  
  logger.add(new winston.transports.File({
    filename: 'logs/combined.log',
    format: logFormat
  }));
}

/**
 * Create service-specific logger
 */
export function createServiceLogger(serviceName: string) {
  return logger.child({ service: serviceName });
}

/**
 * Log blockchain transaction
 */
export function logTransaction(
  txId: string,
  operation: string,
  details: any = {},
  serviceLogger = logger
) {
  serviceLogger.info('Blockchain transaction', {
    txId,
    operation,
    ...details
  });
}

/**
 * Log API request
 */
export function logApiRequest(
  method: string,
  path: string,
  statusCode: number,
  duration: number,
  details: any = {},
  serviceLogger = logger
) {
  serviceLogger.info('API request', {
    method,
    path,
    statusCode,
    duration,
    ...details
  });
}

/**
 * Log error with context
 */
export function logError(
  error: Error,
  context: string,
  details: any = {},
  serviceLogger = logger
) {
  serviceLogger.error('Error occurred', {
    context,
    error: error.message,
    stack: error.stack,
    ...details
  });
}

/**
 * Express middleware for request logging
 */
export function requestLoggingMiddleware(serviceName: string) {
  const serviceLogger = createServiceLogger(serviceName);
  
  return (req: any, res: any, next: any) => {
    const start = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      logApiRequest(
        req.method,
        req.path,
        res.statusCode,
        duration,
        {
          userAgent: req.get('User-Agent'),
          ip: req.ip
        },
        serviceLogger
      );
    });
    
    next();
  };
}
