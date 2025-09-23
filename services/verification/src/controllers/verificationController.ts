import { Request, Response } from 'express';
import { VerificationService } from '../services/verificationService';
import { 
  AnchorDataRequest, 
  VerifyDataRequest,
  ApiResponse,
  createServiceLogger,
  logApiRequest,
  logError
} from '@proofgraph/shared';

const logger = createServiceLogger('verification-controller');
const verificationService = new VerificationService();

/**
 * Controller for verification-related API endpoints
 */
export class VerificationController {
  /**
   * Anchor data to blockchain
   * POST /api/v1/anchor
   */
  async anchorData(req: Request, res: Response): Promise<void> {
    const start = Date.now();
    
    try {
      const request: AnchorDataRequest = req.body;
      const result = await verificationService.anchorData(request);
      
      const response: ApiResponse = {
        success: result.success,
        data: result.success ? {
          verificationId: result.verificationId,
          transactionId: result.transactionId
        } : undefined,
        error: result.error ? {
          code: 'ANCHOR_FAILED',
          message: result.error
        } : undefined,
        timestamp: Date.now()
      };

      const statusCode = result.success ? 201 : 400;
      res.status(statusCode).json(response);

      logApiRequest(
        req.method,
        req.path,
        statusCode,
        Date.now() - start,
        { dataHash: request.dataHash },
        logger
      );

    } catch (error) {
      logError(error as Error, 'anchorData', { body: req.body }, logger);
      
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error'
        },
        timestamp: Date.now()
      };

      res.status(500).json(response);
    }
  }

  /**
   * Verify data integrity
   * POST /api/v1/verify
   */
  async verifyData(req: Request, res: Response): Promise<void> {
    const start = Date.now();
    
    try {
      const request: VerifyDataRequest = req.body;
      const result = await verificationService.verifyData(request);
      
      const response: ApiResponse = {
        success: result.success,
        data: result.success ? {
          result: result.result,
          transactionId: result.transactionId
        } : undefined,
        error: result.error ? {
          code: 'VERIFY_FAILED',
          message: result.error
        } : undefined,
        timestamp: Date.now()
      };

      const statusCode = result.success ? 200 : 400;
      res.status(statusCode).json(response);

      logApiRequest(
        req.method,
        req.path,
        statusCode,
        Date.now() - start,
        { verificationId: request.verificationId },
        logger
      );

    } catch (error) {
      logError(error as Error, 'verifyData', { body: req.body }, logger);
      
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error'
        },
        timestamp: Date.now()
      };

      res.status(500).json(response);
    }
  }

  /**
   * Get verification record by ID
   * GET /api/v1/verification/:id
   */
  async getVerificationById(req: Request, res: Response): Promise<void> {
    const start = Date.now();
    
    try {
      const verificationId = parseInt(req.params.id);
      
      if (isNaN(verificationId) || verificationId < 1) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'INVALID_ID',
            message: 'Invalid verification ID'
          },
          timestamp: Date.now()
        };
        
        res.status(400).json(response);
        return;
      }

      const result = await verificationService.getVerificationById(verificationId);
      
      const response: ApiResponse = {
        success: result.success,
        data: result.record,
        error: result.error ? {
          code: 'NOT_FOUND',
          message: result.error
        } : undefined,
        timestamp: Date.now()
      };

      const statusCode = result.success ? 200 : 404;
      res.status(statusCode).json(response);

      logApiRequest(
        req.method,
        req.path,
        statusCode,
        Date.now() - start,
        { verificationId },
        logger
      );

    } catch (error) {
      logError(error as Error, 'getVerificationById', { params: req.params }, logger);
      
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error'
        },
        timestamp: Date.now()
      };

      res.status(500).json(response);
    }
  }

  /**
   * Get system statistics
   * GET /api/v1/stats
   */
  async getSystemStats(req: Request, res: Response): Promise<void> {
    const start = Date.now();
    
    try {
      const result = await verificationService.getSystemStats();
      
      const response: ApiResponse = {
        success: result.success,
        data: result.stats,
        error: result.error ? {
          code: 'STATS_FAILED',
          message: result.error
        } : undefined,
        timestamp: Date.now()
      };

      const statusCode = result.success ? 200 : 500;
      res.status(statusCode).json(response);

      logApiRequest(
        req.method,
        req.path,
        statusCode,
        Date.now() - start,
        {},
        logger
      );

    } catch (error) {
      logError(error as Error, 'getSystemStats', {}, logger);
      
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error'
        },
        timestamp: Date.now()
      };

      res.status(500).json(response);
    }
  }

  /**
   * Get contributor statistics
   * GET /api/v1/contributor/:address/stats
   */
  async getContributorStats(req: Request, res: Response): Promise<void> {
    const start = Date.now();
    
    try {
      const address = req.params.address;
      
      // Basic Stacks address validation
      if (!/^S[TM][0-9A-Z]{38}$/.test(address)) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'INVALID_ADDRESS',
            message: 'Invalid Stacks address format'
          },
          timestamp: Date.now()
        };
        
        res.status(400).json(response);
        return;
      }

      const result = await verificationService.getContributorStats(address);
      
      const response: ApiResponse = {
        success: result.success,
        data: result.stats,
        error: result.error ? {
          code: 'STATS_FAILED',
          message: result.error
        } : undefined,
        timestamp: Date.now()
      };

      const statusCode = result.success ? 200 : 500;
      res.status(statusCode).json(response);

      logApiRequest(
        req.method,
        req.path,
        statusCode,
        Date.now() - start,
        { address },
        logger
      );

    } catch (error) {
      logError(error as Error, 'getContributorStats', { params: req.params }, logger);
      
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error'
        },
        timestamp: Date.now()
      };

      res.status(500).json(response);
    }
  }

  /**
   * Health check endpoint
   * GET /api/v1/health
   */
  async healthCheck(req: Request, res: Response): Promise<void> {
    try {
      // Basic health check - could be extended to check blockchain connectivity
      const response: ApiResponse = {
        success: true,
        data: {
          status: 'healthy',
          service: 'verification-service',
          timestamp: Date.now(),
          version: '0.1.0'
        },
        timestamp: Date.now()
      };

      res.status(200).json(response);

    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'HEALTH_CHECK_FAILED',
          message: 'Service unhealthy'
        },
        timestamp: Date.now()
      };

      res.status(503).json(response);
    }
  }
}
