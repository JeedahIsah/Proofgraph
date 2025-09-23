import dotenv from 'dotenv';
import { getCurrentNetwork } from '@proofgraph/shared';

// Load environment variables
dotenv.config();

/**
 * Application configuration
 */
export const config = {
  // Server configuration
  port: parseInt(process.env.PORT || '3002', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  logLevel: process.env.LOG_LEVEL || 'info',

  // API configuration
  apiPrefix: process.env.API_PREFIX || '/api/v1',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3001',

  // Stacks configuration
  stacksNetwork: process.env.STACKS_NETWORK || 'devnet',
  stacksNodeUrl: process.env.STACKS_NODE_URL || getCurrentNetwork().stacksNodeUrl,
  stacksPrivateKey: process.env.STACKS_PRIVATE_KEY || '',

  // Contract configuration
  contractAddress: process.env.CONTRACT_ADDRESS || getCurrentNetwork().contractAddress,
  contractName: process.env.CONTRACT_NAME || 'data-anchoring',

  // Rate limiting
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),

  // Transaction settings
  defaultFee: parseInt(process.env.DEFAULT_FEE || '1000', 10),
  maxFee: parseInt(process.env.MAX_FEE || '1000000', 10),

  // Health check
  healthCheckEnabled: process.env.HEALTH_CHECK_ENABLED === 'true'
};

/**
 * Validate required configuration
 */
export function validateConfig(): void {
  const requiredVars = [
    'STACKS_PRIVATE_KEY'
  ];

  const missing = requiredVars.filter(varName => !process.env[varName]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  // Validate private key format (64 hex characters)
  if (config.stacksPrivateKey && !/^[a-fA-F0-9]{64}$/.test(config.stacksPrivateKey)) {
    throw new Error('STACKS_PRIVATE_KEY must be a 64-character hexadecimal string');
  }
}

/**
 * Get configuration for current environment
 */
export function getConfig() {
  return config;
}
