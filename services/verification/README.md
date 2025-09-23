# ProofGraph Verification Service

A comprehensive backend service for blockchain-based data verification and anchoring, built on the Stacks blockchain using Clarity smart contracts.

## Overview

The Verification Service provides a REST API for interacting with the ProofGraph data anchoring smart contract. It enables users to:

- **Anchor data** to the blockchain with cryptographic hashes and metadata
- **Verify data integrity** against blockchain records
- **Query verification records** and system statistics
- **Track contributor activity** and statistics

## Features

### Core Functionality
- ✅ **Data Anchoring**: Securely anchor data hashes to the blockchain
- ✅ **Data Verification**: Verify data integrity against stored records
- ✅ **Record Queries**: Retrieve verification records by ID or hash
- ✅ **Statistics**: System and contributor statistics
- ✅ **Health Monitoring**: Service health checks and monitoring

### Technical Features
- ✅ **Stacks Integration**: Direct integration with Clarity smart contracts
- ✅ **Input Validation**: Comprehensive request validation using Joi schemas
- ✅ **Rate Limiting**: Configurable rate limiting for API endpoints
- ✅ **Error Handling**: Structured error responses with proper HTTP status codes
- ✅ **Logging**: Structured logging with Winston
- ✅ **Security**: Helmet.js security headers and CORS configuration
- ✅ **Testing**: Comprehensive unit and integration test suites

## API Endpoints

### Data Operations

#### Anchor Data
```http
POST /api/v1/anchor
Content-Type: application/json

{
  "dataHash": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
  "metadataUri": "ipfs://QmTest123456789",
  "fee": 1000
}
```

#### Verify Data
```http
POST /api/v1/verify
Content-Type: application/json

{
  "verificationId": 1,
  "dataHash": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
}
```

### Query Operations

#### Get Verification Record
```http
GET /api/v1/verification/{id}
```

#### Get System Statistics
```http
GET /api/v1/stats
```

#### Get Contributor Statistics
```http
GET /api/v1/contributor/{address}/stats
```

### Health Check
```http
GET /api/v1/health
GET /health
```

## Installation & Setup

### Prerequisites
- Node.js 18+ and npm
- Access to a Stacks node (devnet, testnet, or mainnet)
- Deployed ProofGraph smart contracts

### Environment Configuration

1. Copy the environment template:
```bash
cp .env.example .env
```

2. Configure environment variables:
```env
# Server Configuration
PORT=3002
NODE_ENV=development
LOG_LEVEL=info

# Stacks Network Configuration
STACKS_NETWORK=devnet
STACKS_NODE_URL=http://localhost:20443

# Private Key for Transaction Signing
STACKS_PRIVATE_KEY=your_private_key_here

# Contract Configuration
CONTRACT_ADDRESS=ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM
CONTRACT_NAME=data-anchoring
```

### Installation

1. Install dependencies:
```bash
npm install
```

2. Build the shared library:
```bash
cd ../shared && npm run build && cd ../verification
```

3. Build the service:
```bash
npm run build
```

### Development

Start in development mode with hot reload:
```bash
npm run dev
```

### Production

Build and start the service:
```bash
npm run build
npm start
```

## Testing

### Unit Tests
```bash
npm test
```

### Integration Tests
```bash
npm run test:integration
```

### Test Coverage
```bash
npm run test:coverage
```

### Watch Mode
```bash
npm run test:watch
```

## Configuration

### Rate Limiting

The service implements tiered rate limiting:

- **General API**: 100 requests per 15 minutes
- **Write Operations** (anchor, verify): 10 requests per minute
- **Read Operations**: 100 requests per minute
- **Health Checks**: 1000 requests per minute

### Security

- **Helmet.js**: Security headers and CSP
- **CORS**: Configurable cross-origin resource sharing
- **Input Validation**: Joi schema validation for all inputs
- **Error Handling**: Structured error responses without sensitive data exposure

### Logging

Structured JSON logging with configurable levels:
- Request/response logging
- Transaction logging
- Error logging with context
- Performance metrics

## Architecture

### Service Layer
- `VerificationService`: Core business logic for blockchain interactions
- `VerificationController`: HTTP request/response handling
- `ErrorHandler`: Centralized error handling and logging

### Middleware
- Rate limiting with express-rate-limit
- Request validation with Joi schemas
- Security headers with Helmet
- Request logging with Winston

### Blockchain Integration
- Direct Clarity contract calls using Stacks.js
- Transaction broadcasting and monitoring
- Read-only function calls for queries
- Error mapping from contract error codes

## Error Handling

The service provides structured error responses:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Data hash must be a 32-byte hexadecimal string",
    "details": {}
  },
  "timestamp": 1640995200000
}
```

### Error Codes
- `VALIDATION_ERROR`: Input validation failures
- `ANCHOR_FAILED`: Data anchoring failures
- `VERIFY_FAILED`: Data verification failures
- `NOT_FOUND`: Resource not found
- `RATE_LIMIT_EXCEEDED`: Rate limit violations
- `INTERNAL_ERROR`: Server errors

## Monitoring

### Health Checks
- Basic service health at `/health`
- Detailed service health at `/api/v1/health`
- Blockchain connectivity monitoring (planned)

### Metrics
- Request/response times
- Transaction success rates
- Error rates by type
- Rate limiting statistics

## Contributing

1. Follow TypeScript best practices
2. Maintain test coverage above 80%
3. Use structured logging for debugging
4. Validate all inputs with Joi schemas
5. Handle errors gracefully with proper HTTP status codes

## License

MIT License - see LICENSE file for details
