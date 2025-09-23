import { VerificationService } from '../src/services/verificationService';
import { AnchorDataRequest, VerifyDataRequest } from '@proofgraph/shared';

// Mock the shared module
jest.mock('@proofgraph/shared', () => ({
  ...jest.requireActual('@proofgraph/shared'),
  callReadOnlyContractFunction: jest.fn(),
  broadcastContractCall: jest.fn(),
  createServiceLogger: jest.fn(() => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  })),
  logTransaction: jest.fn(),
  logError: jest.fn()
}));

describe('VerificationService', () => {
  let service: VerificationService;
  
  beforeEach(() => {
    service = new VerificationService();
    jest.clearAllMocks();
  });

  describe('anchorData', () => {
    const validRequest: AnchorDataRequest = {
      dataHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      metadataUri: 'ipfs://QmTest123456789',
      fee: 1000
    };

    it('should successfully anchor data with valid input', async () => {
      const mockTxId = 'mock-transaction-id';
      const { broadcastContractCall, callReadOnlyContractFunction } = require('@proofgraph/shared');
      
      // Mock that data hash doesn't exist
      callReadOnlyContractFunction.mockResolvedValue({ type: 'none' });
      broadcastContractCall.mockResolvedValue(mockTxId);

      const result = await service.anchorData(validRequest);

      expect(result.success).toBe(true);
      expect(result.transactionId).toBe(mockTxId);
      expect(result.error).toBeUndefined();
    });

    it('should reject invalid data hash format', async () => {
      const invalidRequest = {
        ...validRequest,
        dataHash: 'invalid-hash'
      };

      const result = await service.anchorData(invalidRequest);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid data hash format');
    });

    it('should reject invalid metadata URI format', async () => {
      const invalidRequest = {
        ...validRequest,
        metadataUri: ''
      };

      const result = await service.anchorData(invalidRequest);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid metadata URI format');
    });

    it('should reject insufficient fee', async () => {
      const invalidRequest = {
        ...validRequest,
        fee: 500
      };

      const result = await service.anchorData(invalidRequest);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Fee must be at least 1000 microSTX');
    });

    it('should reject duplicate data hash', async () => {
      const { callReadOnlyContractFunction } = require('@proofgraph/shared');
      
      // Mock that data hash already exists
      callReadOnlyContractFunction.mockResolvedValue({
        type: 'some',
        value: { /* mock record */ }
      });

      const result = await service.anchorData(validRequest);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Data hash already exists');
    });

    it('should handle blockchain errors gracefully', async () => {
      const { broadcastContractCall, callReadOnlyContractFunction } = require('@proofgraph/shared');
      
      callReadOnlyContractFunction.mockResolvedValue({ type: 'none' });
      broadcastContractCall.mockRejectedValue(new Error('Blockchain error'));

      const result = await service.anchorData(validRequest);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Blockchain error');
    });
  });

  describe('verifyData', () => {
    const validRequest: VerifyDataRequest = {
      verificationId: 1,
      dataHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
    };

    it('should successfully verify data with valid input', async () => {
      const mockTxId = 'mock-transaction-id';
      const { broadcastContractCall } = require('@proofgraph/shared');
      
      broadcastContractCall.mockResolvedValue(mockTxId);

      const result = await service.verifyData(validRequest);

      expect(result.success).toBe(true);
      expect(result.transactionId).toBe(mockTxId);
      expect(result.error).toBeUndefined();
    });

    it('should reject invalid data hash format', async () => {
      const invalidRequest = {
        ...validRequest,
        dataHash: 'invalid-hash'
      };

      const result = await service.verifyData(invalidRequest);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid data hash format');
    });

    it('should reject invalid verification ID', async () => {
      const invalidRequest = {
        ...validRequest,
        verificationId: 0
      };

      const result = await service.verifyData(invalidRequest);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid verification ID');
    });
  });

  describe('getVerificationById', () => {
    it('should return verification record when found', async () => {
      const { callReadOnlyContractFunction } = require('@proofgraph/shared');
      
      const mockRecord = {
        type: 'some',
        value: {
          contributor: { value: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM' },
          'data-hash': { value: Buffer.from('1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef', 'hex') },
          timestamp: { value: '1640995200' },
          'metadata-uri': { value: 'ipfs://QmTest123456789' },
          'verification-count': { value: '0' },
          'fee-paid': { value: '1000' }
        }
      };
      
      callReadOnlyContractFunction.mockResolvedValue(mockRecord);

      const result = await service.getVerificationById(1);

      expect(result.success).toBe(true);
      expect(result.record).toBeDefined();
      expect(result.record?.contributor).toBe('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM');
    });

    it('should return error when verification not found', async () => {
      const { callReadOnlyContractFunction } = require('@proofgraph/shared');
      
      callReadOnlyContractFunction.mockResolvedValue({ type: 'none' });

      const result = await service.getVerificationById(999);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Verification record not found');
    });
  });

  describe('getSystemStats', () => {
    it('should return system statistics', async () => {
      const { callReadOnlyContractFunction } = require('@proofgraph/shared');
      
      const mockStats = {
        'min-fee': { value: '1000' },
        'max-data-size': { value: '1048576' },
        'total-records': { value: '10' },
        'total-verifications': { value: '25' },
        'total-fees-collected': { value: '15000' }
      };
      
      callReadOnlyContractFunction.mockResolvedValue(mockStats);

      const result = await service.getSystemStats();

      expect(result.success).toBe(true);
      expect(result.stats).toBeDefined();
      expect(result.stats?.totalRecords).toBe(10);
      expect(result.stats?.totalVerifications).toBe(25);
    });
  });

  describe('getContributorStats', () => {
    it('should return contributor statistics', async () => {
      const { callReadOnlyContractFunction } = require('@proofgraph/shared');
      
      const mockStats = {
        'total-contributions': { value: '5' },
        'total-fees-spent': { value: '5000' },
        'total-verifications': { value: '12' },
        'first-contribution': { type: 'some', value: { value: '1640995200' } },
        'last-contribution': { type: 'some', value: { value: '1641081600' } }
      };
      
      callReadOnlyContractFunction.mockResolvedValue(mockStats);

      const result = await service.getContributorStats('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM');

      expect(result.success).toBe(true);
      expect(result.stats).toBeDefined();
      expect(result.stats?.totalContributions).toBe(5);
      expect(result.stats?.firstContribution).toBe(1640995200);
    });
  });
});
