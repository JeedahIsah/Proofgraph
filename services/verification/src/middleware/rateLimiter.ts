import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { ApiResponse } from '@proofgraph/shared';
import { config } from '../config';

/**
 * Rate limiting configuration
 */

/**
 * General API rate limiter
 */
export const apiRateLimiter = rateLimit({
  windowMs: config.rateLimitWindowMs, // 15 minutes
  max: config.rateLimitMaxRequests, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests from this IP, please try again later'
    },
    timestamp: Date.now()
  } as ApiResponse,
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req: Request, res: Response) => {
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests from this IP, please try again later',
        details: {
          limit: config.rateLimitMaxRequests,
          windowMs: config.rateLimitWindowMs,
          retryAfter: Math.ceil(config.rateLimitWindowMs / 1000)
        }
      },
      timestamp: Date.now()
    };
    
    res.status(429).json(response);
  }
});

/**
 * Strict rate limiter for write operations (anchor, verify)
 */
export const writeOperationRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // Limit each IP to 10 write operations per minute
  message: {
    success: false,
    error: {
      code: 'WRITE_RATE_LIMIT_EXCEEDED',
      message: 'Too many write operations from this IP, please try again later'
    },
    timestamp: Date.now()
  } as ApiResponse,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'WRITE_RATE_LIMIT_EXCEEDED',
        message: 'Too many write operations from this IP, please try again later',
        details: {
          limit: 10,
          windowMs: 60 * 1000,
          retryAfter: 60
        }
      },
      timestamp: Date.now()
    };
    
    res.status(429).json(response);
  }
});

/**
 * Lenient rate limiter for read operations
 */
export const readOperationRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // Limit each IP to 100 read operations per minute
  message: {
    success: false,
    error: {
      code: 'READ_RATE_LIMIT_EXCEEDED',
      message: 'Too many read operations from this IP, please try again later'
    },
    timestamp: Date.now()
  } as ApiResponse,
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Health check rate limiter (very lenient)
 */
export const healthCheckRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 1000, // Very high limit for health checks
  standardHeaders: false,
  legacyHeaders: false
});
