import { Router } from 'express';
import { VerificationController } from '../controllers/verificationController';
import {
  anchorDataRequestSchema,
  verifyDataRequestSchema,
  verificationIdParamSchema,
  contributorAddressParamSchema,
  createValidationMiddleware,
  createParamValidationMiddleware
} from '@proofgraph/shared';

const router = Router();
const controller = new VerificationController();

/**
 * Verification API Routes
 */

/**
 * @route POST /anchor
 * @desc Anchor data to blockchain
 * @access Public
 */
router.post(
  '/anchor',
  createValidationMiddleware(anchorDataRequestSchema),
  controller.anchorData.bind(controller)
);

/**
 * @route POST /verify
 * @desc Verify data integrity against blockchain record
 * @access Public
 */
router.post(
  '/verify',
  createValidationMiddleware(verifyDataRequestSchema),
  controller.verifyData.bind(controller)
);

/**
 * @route GET /verification/:id
 * @desc Get verification record by ID
 * @access Public
 */
router.get(
  '/verification/:id',
  createParamValidationMiddleware(verificationIdParamSchema),
  controller.getVerificationById.bind(controller)
);

/**
 * @route GET /stats
 * @desc Get system statistics
 * @access Public
 */
router.get(
  '/stats',
  controller.getSystemStats.bind(controller)
);

/**
 * @route GET /contributor/:address/stats
 * @desc Get contributor statistics
 * @access Public
 */
router.get(
  '/contributor/:address/stats',
  createParamValidationMiddleware(contributorAddressParamSchema),
  controller.getContributorStats.bind(controller)
);

/**
 * @route GET /health
 * @desc Health check endpoint
 * @access Public
 */
router.get(
  '/health',
  controller.healthCheck.bind(controller)
);

export default router;
