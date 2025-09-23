/**
 * Core types for ProofGraph verification system
 * These types mirror the Clarity smart contract data structures
 */

/**
 * Verification record as stored in the smart contract
 */
export interface VerificationRecord {
  contributor: string;
  dataHash: string;
  timestamp: number;
  metadataUri: string;
  verificationCount: number;
  feePaid: number;
}

/**
 * System configuration parameters
 */
export interface SystemConfig {
  minFee: number;
  maxDataSize: number;
  totalRecords: number;
  totalVerifications: number;
  totalFeesCollected: number;
}

/**
 * Contributor statistics
 */
export interface ContributorStats {
  totalContributions: number;
  totalFeesSpent: number;
  totalVerifications: number;
  firstContribution?: number;
  lastContribution?: number;
}

/**
 * Verification result from smart contract
 */
export interface VerificationResult {
  contributor: string;
  timestamp: number;
  verified: boolean;
}

/**
 * API request types
 */
export interface AnchorDataRequest {
  dataHash: string;
  metadataUri: string;
  fee: number;
}

export interface VerifyDataRequest {
  verificationId: number;
  dataHash: string;
}

/**
 * API response types
 */
export interface AnchorDataResponse {
  success: boolean;
  verificationId?: number;
  transactionId?: string;
  error?: string;
}

export interface VerifyDataResponse {
  success: boolean;
  result?: VerificationResult;
  transactionId?: string;
  error?: string;
}

export interface GetVerificationResponse {
  success: boolean;
  record?: VerificationRecord;
  error?: string;
}

export interface GetStatsResponse {
  success: boolean;
  stats?: SystemConfig;
  error?: string;
}

export interface GetContributorStatsResponse {
  success: boolean;
  stats?: ContributorStats;
  error?: string;
}

/**
 * Network configuration
 */
export interface NetworkConfig {
  name: string;
  stacksNodeUrl: string;
  contractAddress: string;
  contractName: string;
}

/**
 * Error types
 */
export enum ContractError {
  NOT_AUTHORIZED = 100,
  INVALID_INPUT = 101,
  ALREADY_EXISTS = 102,
  NOT_FOUND = 103,
  INSUFFICIENT_BALANCE = 104,
  SYSTEM_ERROR = 105,
  DATA_EXISTS = 201,
  INSUFFICIENT_FEE = 202,
  INVALID_DATA = 203,
  INVALID_METADATA = 204,
  DATA_TOO_LARGE = 205,
  CONTRACT_NOT_INITIALIZED = 206
}

/**
 * API error response
 */
export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  timestamp: number;
}
