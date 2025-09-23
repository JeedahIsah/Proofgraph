import request from 'supertest';
import { createApp } from '../src/app';
import { Express } from 'express';

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
  logError: jest.fn(),
  logApiRequest: jest.fn()
}));

// Mock config
jest.mock('../src/config', () => ({
  config: {
    port: 3002,
    nodeEnv: 'test',
    apiPrefix: '/api/v1',
    corsOrigin: 'http://localhost:3001',
    stacksPrivateKey: '753b7cc01a1a2e86221266a154af739463fce51219d97e4f856cd7200c3bd2a601',
    defaultFee: 1000,
    rateLimitWindowMs: 900000,
    rateLimitMaxRequests: 100
  },
  validateConfig: jest.fn()
}));

describe('Verification API Integration Tests', () => {
  let app: Express;

  beforeAll(() => {
    app = createApp();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/v1/anchor', () => {
    const validAnchorRequest = {
      dataHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      metadataUri: 'ipfs://QmTest123456789',
      fee: 1000
    };

    it('should anchor data successfully with valid input', async () => {
      const { broadcastContractCall, callReadOnlyContractFunction } = require('@proofgraph/shared');
      
      // Mock that data hash doesn't exist
      callReadOnlyContractFunction.mockResolvedValue({ type: 'none' });
      broadcastContractCall.mockResolvedValue('mock-tx-id');

      const response = await request(app)
        .post('/api/v1/anchor')
        .send(validAnchorRequest)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.transactionId).toBe('mock-tx-id');
    });

    it('should reject invalid data hash', async () => {
      const invalidRequest = {
        ...validAnchorRequest,
        dataHash: 'invalid-hash'
      };

      const response = await request(app)
        .post('/api/v1/anchor')
        .send(invalidRequest)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject missing required fields', async () => {
      const response = await request(app)
        .post('/api/v1/anchor')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject fee below minimum', async () => {
      const invalidRequest = {
        ...validAnchorRequest,
        fee: 500
      };

      const response = await request(app)
        .post('/api/v1/anchor')
        .send(invalidRequest)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/v1/verify', () => {
    const validVerifyRequest = {
      verificationId: 1,
      dataHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
    };

    it('should verify data successfully with valid input', async () => {
      const { broadcastContractCall } = require('@proofgraph/shared');
      
      broadcastContractCall.mockResolvedValue('mock-tx-id');

      const response = await request(app)
        .post('/api/v1/verify')
        .send(validVerifyRequest)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.transactionId).toBe('mock-tx-id');
    });

    it('should reject invalid verification ID', async () => {
      const invalidRequest = {
        ...validVerifyRequest,
        verificationId: 0
      };

      const response = await request(app)
        .post('/api/v1/verify')
        .send(invalidRequest)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/v1/verification/:id', () => {
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

      const response = await request(app)
        .get('/api/v1/verification/1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.contributor).toBe('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM');
    });

    it('should return 404 when verification not found', async () => {
      const { callReadOnlyContractFunction } = require('@proofgraph/shared');
      
      callReadOnlyContractFunction.mockResolvedValue({ type: 'none' });

      const response = await request(app)
        .get('/api/v1/verification/999')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });

    it('should reject invalid verification ID format', async () => {
      const response = await request(app)
        .get('/api/v1/verification/invalid')
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/stats', () => {
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

      const response = await request(app)
        .get('/api/v1/stats')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.totalRecords).toBe(10);
    });
  });

  describe('GET /api/v1/contributor/:address/stats', () => {
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

      const response = await request(app)
        .get('/api/v1/contributor/ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM/stats')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.totalContributions).toBe(5);
    });

    it('should reject invalid Stacks address', async () => {
      const response = await request(app)
        .get('/api/v1/contributor/invalid-address/stats')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('healthy');
    });
  });

  describe('GET /api/v1/health', () => {
    it('should return detailed health status', async () => {
      const response = await request(app)
        .get('/api/v1/health')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('healthy');
      expect(response.body.data.service).toBe('verification-service');
    });
  });

  describe('404 handling', () => {
    it('should return 404 for unknown routes', async () => {
      const response = await request(app)
        .get('/api/v1/unknown-route')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });
  });
});
