import {
  callReadOnlyContractFunction,
  broadcastContractCall,
  isValidDataHash,
  isValidMetadataUri,
  mapContractError,
  createServiceLogger,
  logTransaction,
  logError,
  hexToBuffer
} from '@proofgraph/shared';
import {
  uintCV,
  bufferCV,
  stringAsciiCV,
  standardPrincipalCV
} from '@stacks/transactions';
import {
  VerificationRecord,
  SystemConfig,
  ContributorStats,
  VerificationResult,
  AnchorDataRequest,
  VerifyDataRequest
} from '@proofgraph/shared';
import { config } from '../config';

const logger = createServiceLogger('verification-service');

/**
 * Service class for blockchain verification operations
 */
export class VerificationService {
  /**
   * Anchor data to the blockchain
   */
  async anchorData(request: AnchorDataRequest): Promise<{
    success: boolean;
    verificationId?: number;
    transactionId?: string;
    error?: string;
  }> {
    try {
      // Validate input
      if (!isValidDataHash(request.dataHash)) {
        return {
          success: false,
          error: 'Invalid data hash format'
        };
      }

      if (!isValidMetadataUri(request.metadataUri)) {
        return {
          success: false,
          error: 'Invalid metadata URI format'
        };
      }

      if (request.fee < 1000) {
        return {
          success: false,
          error: 'Fee must be at least 1000 microSTX'
        };
      }

      // Check if data hash already exists
      const existingRecord = await this.getVerificationByHash(request.dataHash);
      if (existingRecord.success && existingRecord.record) {
        return {
          success: false,
          error: 'Data hash already exists'
        };
      }

      // Prepare function arguments
      const functionArgs = [
        bufferCV(hexToBuffer(request.dataHash)),
        stringAsciiCV(request.metadataUri),
        uintCV(request.fee)
      ];

      // Broadcast transaction
      const txId = await broadcastContractCall(
        'anchor-data',
        functionArgs,
        config.stacksPrivateKey,
        request.fee
      );

      logTransaction(txId, 'anchor-data', {
        dataHash: request.dataHash,
        metadataUri: request.metadataUri,
        fee: request.fee
      }, logger);

      // Note: In a real implementation, you'd want to wait for transaction confirmation
      // and extract the verification ID from the transaction result
      return {
        success: true,
        transactionId: txId
      };

    } catch (error) {
      logError(error as Error, 'anchorData', { request }, logger);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Verify data integrity against blockchain record
   */
  async verifyData(request: VerifyDataRequest): Promise<{
    success: boolean;
    result?: VerificationResult;
    transactionId?: string;
    error?: string;
  }> {
    try {
      // Validate input
      if (!isValidDataHash(request.dataHash)) {
        return {
          success: false,
          error: 'Invalid data hash format'
        };
      }

      if (request.verificationId < 1) {
        return {
          success: false,
          error: 'Invalid verification ID'
        };
      }

      // Prepare function arguments
      const functionArgs = [
        uintCV(request.verificationId),
        bufferCV(hexToBuffer(request.dataHash))
      ];

      // Broadcast transaction
      const txId = await broadcastContractCall(
        'verify-data',
        functionArgs,
        config.stacksPrivateKey,
        config.defaultFee
      );

      logTransaction(txId, 'verify-data', {
        verificationId: request.verificationId,
        dataHash: request.dataHash
      }, logger);

      return {
        success: true,
        transactionId: txId
      };

    } catch (error) {
      logError(error as Error, 'verifyData', { request }, logger);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get verification record by ID
   */
  async getVerificationById(verificationId: number): Promise<{
    success: boolean;
    record?: VerificationRecord;
    error?: string;
  }> {
    try {
      const result = await callReadOnlyContractFunction(
        'get-verification-record',
        [uintCV(verificationId)]
      );

      if (result.type === 'none') {
        return {
          success: false,
          error: 'Verification record not found'
        };
      }

      const record = result.value;
      return {
        success: true,
        record: {
          contributor: record.contributor.value,
          dataHash: `0x${Buffer.from(record['data-hash'].value).toString('hex')}`,
          timestamp: parseInt(record.timestamp.value),
          metadataUri: record['metadata-uri'].value,
          verificationCount: parseInt(record['verification-count'].value),
          feePaid: parseInt(record['fee-paid'].value)
        }
      };

    } catch (error) {
      logError(error as Error, 'getVerificationById', { verificationId }, logger);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to retrieve verification record'
      };
    }
  }

  /**
   * Get verification record by data hash
   */
  async getVerificationByHash(dataHash: string): Promise<{
    success: boolean;
    record?: VerificationRecord;
    error?: string;
  }> {
    try {
      const result = await callReadOnlyContractFunction(
        'get-verification-by-hash',
        [bufferCV(hexToBuffer(dataHash))]
      );

      if (result.type === 'none') {
        return {
          success: false,
          error: 'Verification record not found'
        };
      }

      const record = result.value;
      return {
        success: true,
        record: {
          contributor: record.contributor.value,
          dataHash: `0x${Buffer.from(record['data-hash'].value).toString('hex')}`,
          timestamp: parseInt(record.timestamp.value),
          metadataUri: record['metadata-uri'].value,
          verificationCount: parseInt(record['verification-count'].value),
          feePaid: parseInt(record['fee-paid'].value)
        }
      };

    } catch (error) {
      logError(error as Error, 'getVerificationByHash', { dataHash }, logger);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to retrieve verification record'
      };
    }
  }

  /**
   * Get system statistics
   */
  async getSystemStats(): Promise<{
    success: boolean;
    stats?: SystemConfig;
    error?: string;
  }> {
    try {
      const result = await callReadOnlyContractFunction('get-system-stats');

      return {
        success: true,
        stats: {
          minFee: parseInt(result['min-fee'].value),
          maxDataSize: parseInt(result['max-data-size'].value),
          totalRecords: parseInt(result['total-records'].value),
          totalVerifications: parseInt(result['total-verifications'].value),
          totalFeesCollected: parseInt(result['total-fees-collected'].value)
        }
      };

    } catch (error) {
      logError(error as Error, 'getSystemStats', {}, logger);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to retrieve system statistics'
      };
    }
  }

  /**
   * Get contributor statistics
   */
  async getContributorStats(address: string): Promise<{
    success: boolean;
    stats?: ContributorStats;
    error?: string;
  }> {
    try {
      const result = await callReadOnlyContractFunction(
        'get-contributor-stats',
        [standardPrincipalCV(address)]
      );

      return {
        success: true,
        stats: {
          totalContributions: parseInt(result['total-contributions'].value),
          totalFeesSpent: parseInt(result['total-fees-spent'].value),
          totalVerifications: parseInt(result['total-verifications'].value),
          firstContribution: result['first-contribution'].type !== 'none' 
            ? parseInt(result['first-contribution'].value.value) 
            : undefined,
          lastContribution: result['last-contribution'].type !== 'none' 
            ? parseInt(result['last-contribution'].value.value) 
            : undefined
        }
      };

    } catch (error) {
      logError(error as Error, 'getContributorStats', { address }, logger);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to retrieve contributor statistics'
      };
    }
  }
}
