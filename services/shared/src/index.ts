/**
 * ProofGraph Shared Library
 * Exports all shared types, utilities, and configurations
 */

// Types
export * from './types/verification';

// Configuration
export * from './config/networks';

// Utilities
export * from './utils/blockchain';
export * from './utils/validation';
export * from './utils/logger';

// Re-export commonly used external types
export {
  StacksNetwork,
  StacksTestnet,
  StacksMainnet
} from '@stacks/network';

export {
  TransactionVersion,
  AnchorMode,
  PostConditionMode
} from '@stacks/transactions';
