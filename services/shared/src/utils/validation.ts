import Joi from 'joi';
import { AnchorDataRequest, VerifyDataRequest } from '../types/verification';

/**
 * Validation schemas for API requests
 */

/**
 * Schema for data hash validation (32-byte hex string)
 */
const dataHashSchema = Joi.string()
  .pattern(/^(0x)?[a-fA-F0-9]{64}$/)
  .required()
  .messages({
    'string.pattern.base': 'Data hash must be a 32-byte hexadecimal string',
    'any.required': 'Data hash is required'
  });

/**
 * Schema for metadata URI validation
 */
const metadataUriSchema = Joi.string()
  .min(1)
  .max(256)
  .pattern(/^[a-zA-Z0-9:\/\.\-_]+$/)
  .required()
  .messages({
    'string.min': 'Metadata URI cannot be empty',
    'string.max': 'Metadata URI cannot exceed 256 characters',
    'string.pattern.base': 'Metadata URI contains invalid characters',
    'any.required': 'Metadata URI is required'
  });

/**
 * Schema for fee validation
 */
const feeSchema = Joi.number()
  .integer()
  .min(1000)
  .max(1000000000)
  .required()
  .messages({
    'number.base': 'Fee must be a number',
    'number.integer': 'Fee must be an integer',
    'number.min': 'Fee must be at least 1000 microSTX',
    'number.max': 'Fee cannot exceed 1,000,000,000 microSTX',
    'any.required': 'Fee is required'
  });

/**
 * Schema for verification ID validation
 */
const verificationIdSchema = Joi.number()
  .integer()
  .min(1)
  .required()
  .messages({
    'number.base': 'Verification ID must be a number',
    'number.integer': 'Verification ID must be an integer',
    'number.min': 'Verification ID must be positive',
    'any.required': 'Verification ID is required'
  });

/**
 * Schema for Stacks address validation
 */
const stacksAddressSchema = Joi.string()
  .pattern(/^S[TM][0-9A-Z]{38}$/)
  .required()
  .messages({
    'string.pattern.base': 'Invalid Stacks address format',
    'any.required': 'Stacks address is required'
  });

/**
 * Validation schema for anchor data request
 */
export const anchorDataRequestSchema = Joi.object<AnchorDataRequest>({
  dataHash: dataHashSchema,
  metadataUri: metadataUriSchema,
  fee: feeSchema
}).required();

/**
 * Validation schema for verify data request
 */
export const verifyDataRequestSchema = Joi.object<VerifyDataRequest>({
  verificationId: verificationIdSchema,
  dataHash: dataHashSchema
}).required();

/**
 * Validation schema for verification ID parameter
 */
export const verificationIdParamSchema = Joi.object({
  id: verificationIdSchema
}).required();

/**
 * Validation schema for contributor address parameter
 */
export const contributorAddressParamSchema = Joi.object({
  address: stacksAddressSchema
}).required();

/**
 * Validate request data against schema
 */
export function validateRequest<T>(data: any, schema: Joi.ObjectSchema<T>): {
  isValid: boolean;
  value?: T;
  error?: string;
} {
  const { error, value } = schema.validate(data, {
    abortEarly: false,
    stripUnknown: true
  });

  if (error) {
    const errorMessage = error.details
      .map(detail => detail.message)
      .join(', ');
    
    return {
      isValid: false,
      error: errorMessage
    };
  }

  return {
    isValid: true,
    value
  };
}

/**
 * Middleware function for request validation
 */
export function createValidationMiddleware<T>(schema: Joi.ObjectSchema<T>) {
  return (req: any, res: any, next: any) => {
    const { isValid, value, error } = validateRequest(req.body, schema);
    
    if (!isValid) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error,
          timestamp: Date.now()
        }
      });
    }
    
    req.validatedBody = value;
    next();
  };
}

/**
 * Middleware function for parameter validation
 */
export function createParamValidationMiddleware<T>(schema: Joi.ObjectSchema<T>) {
  return (req: any, res: any, next: any) => {
    const { isValid, value, error } = validateRequest(req.params, schema);
    
    if (!isValid) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error,
          timestamp: Date.now()
        }
      });
    }
    
    req.validatedParams = value;
    next();
  };
}
