# ProofGraph Verification Service API Documentation

## Overview

The ProofGraph Verification Service provides a REST API for blockchain-based data verification and anchoring. It interfaces directly with Clarity smart contracts on the Stacks blockchain to provide immutable data verification capabilities.

**Base URL**: `http://localhost:3002/api/v1`

## Authentication

Currently, the API is public and does not require authentication. Future versions may implement API key or token-based authentication.

## Rate Limiting

The API implements tiered rate limiting:

- **General API**: 100 requests per 15 minutes per IP
- **Write Operations** (`/anchor`, `/verify`): 10 requests per minute per IP
- **Read Operations**: 100 requests per minute per IP
- **Health Checks**: 1000 requests per minute per IP

Rate limit headers are included in responses:
- `RateLimit-Limit`: Request limit for the current window
- `RateLimit-Remaining`: Remaining requests in the current window
- `RateLimit-Reset`: Time when the current window resets

## Response Format

All API responses follow a consistent format:

```json
{
  "success": boolean,
  "data": object | null,
  "error": {
    "code": string,
    "message": string,
    "details": object
  } | null,
  "timestamp": number
}
```

## Endpoints

### Data Operations

#### Anchor Data

Anchor a data hash to the blockchain with associated metadata.

**Endpoint**: `POST /anchor`

**Request Body**:
```json
{
  "dataHash": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
  "metadataUri": "ipfs://QmTest123456789",
  "fee": 1000
}
```

**Parameters**:
- `dataHash` (string, required): 32-byte hexadecimal hash of the data (with or without 0x prefix)
- `metadataUri` (string, required): URI pointing to metadata (1-256 characters, alphanumeric + :/.-)
- `fee` (number, required): Transaction fee in microSTX (minimum 1000, maximum 1,000,000,000)

**Success Response** (201):
```json
{
  "success": true,
  "data": {
    "transactionId": "0xabc123..."
  },
  "timestamp": 1640995200000
}
```

**Error Responses**:
- `400`: Validation error or duplicate data hash
- `500`: Internal server error

#### Verify Data

Verify data integrity against a blockchain record.

**Endpoint**: `POST /verify`

**Request Body**:
```json
{
  "verificationId": 1,
  "dataHash": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
}
```

**Parameters**:
- `verificationId` (number, required): ID of the verification record (positive integer)
- `dataHash` (string, required): 32-byte hexadecimal hash to verify

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "transactionId": "0xdef456..."
  },
  "timestamp": 1640995200000
}
```

### Query Operations

#### Get Verification Record

Retrieve a verification record by its ID.

**Endpoint**: `GET /verification/{id}`

**Parameters**:
- `id` (number, required): Verification record ID

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "contributor": "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
    "dataHash": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
    "timestamp": 1640995200,
    "metadataUri": "ipfs://QmTest123456789",
    "verificationCount": 5,
    "feePaid": 1000
  },
  "timestamp": 1640995200000
}
```

**Error Responses**:
- `400`: Invalid verification ID
- `404`: Verification record not found

#### Get System Statistics

Retrieve overall system statistics.

**Endpoint**: `GET /stats`

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "minFee": 1000,
    "maxDataSize": 1048576,
    "totalRecords": 150,
    "totalVerifications": 423,
    "totalFeesCollected": 150000
  },
  "timestamp": 1640995200000
}
```

#### Get Contributor Statistics

Retrieve statistics for a specific contributor.

**Endpoint**: `GET /contributor/{address}/stats`

**Parameters**:
- `address` (string, required): Stacks address (format: S[TM][0-9A-Z]{38})

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "totalContributions": 12,
    "totalFeesSpent": 15000,
    "totalVerifications": 34,
    "firstContribution": 1640995200,
    "lastContribution": 1641081600
  },
  "timestamp": 1640995200000
}
```

**Error Responses**:
- `400`: Invalid Stacks address format

### Health Check

#### Service Health

Check service health and status.

**Endpoint**: `GET /health` or `GET /api/v1/health`

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "service": "verification-service",
    "timestamp": 1640995200000,
    "version": "0.1.0",
    "environment": "development"
  },
  "timestamp": 1640995200000
}
```

## Error Codes

| Code | Description |
|------|-------------|
| `VALIDATION_ERROR` | Request validation failed |
| `ANCHOR_FAILED` | Data anchoring operation failed |
| `VERIFY_FAILED` | Data verification operation failed |
| `NOT_FOUND` | Requested resource not found |
| `RATE_LIMIT_EXCEEDED` | Rate limit exceeded |
| `WRITE_RATE_LIMIT_EXCEEDED` | Write operation rate limit exceeded |
| `READ_RATE_LIMIT_EXCEEDED` | Read operation rate limit exceeded |
| `INTERNAL_ERROR` | Internal server error |

## Usage Examples

### JavaScript/Node.js

```javascript
const axios = require('axios');

const API_BASE = 'http://localhost:3002/api/v1';

// Anchor data
async function anchorData(dataHash, metadataUri, fee) {
  try {
    const response = await axios.post(`${API_BASE}/anchor`, {
      dataHash,
      metadataUri,
      fee
    });
    return response.data;
  } catch (error) {
    console.error('Anchor failed:', error.response.data);
    throw error;
  }
}

// Verify data
async function verifyData(verificationId, dataHash) {
  try {
    const response = await axios.post(`${API_BASE}/verify`, {
      verificationId,
      dataHash
    });
    return response.data;
  } catch (error) {
    console.error('Verification failed:', error.response.data);
    throw error;
  }
}

// Get verification record
async function getVerification(id) {
  try {
    const response = await axios.get(`${API_BASE}/verification/${id}`);
    return response.data;
  } catch (error) {
    console.error('Get verification failed:', error.response.data);
    throw error;
  }
}
```

### cURL

```bash
# Anchor data
curl -X POST http://localhost:3002/api/v1/anchor \
  -H "Content-Type: application/json" \
  -d '{
    "dataHash": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
    "metadataUri": "ipfs://QmTest123456789",
    "fee": 1000
  }'

# Verify data
curl -X POST http://localhost:3002/api/v1/verify \
  -H "Content-Type: application/json" \
  -d '{
    "verificationId": 1,
    "dataHash": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
  }'

# Get verification record
curl http://localhost:3002/api/v1/verification/1

# Get system stats
curl http://localhost:3002/api/v1/stats

# Health check
curl http://localhost:3002/health
```

## Development

### Running Locally

1. Install dependencies: `npm install`
2. Copy environment: `cp .env.example .env`
3. Configure environment variables
4. Start development server: `npm run dev`

### Testing

- Unit tests: `npm test`
- Integration tests: `npm run test:integration`
- Coverage: `npm run test:coverage`

### Docker

Build and run with Docker:

```bash
docker build -t proofgraph-verification .
docker run -p 3002:3002 --env-file .env proofgraph-verification
```

Or use docker-compose:

```bash
docker-compose up verification-service
```
