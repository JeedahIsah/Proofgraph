# ProofGraph

A decentralized knowledge graph enabling discovery and verification of supply chain and product data, built on Stacks blockchain for immutable data anchoring and AI-ready insights.

## Executive Summary

ProofGraph creates a verifiable web of supply chain and product data that AI models can trust, reducing misinformation and enabling transparent, provable insights. The platform aggregates data from decentralized sources into a structured, verifiable knowledge graph, anchored immutably on the Stacks blockchain through Bitcoin-secured Layer 2 technology.

## Technology Stack

### Core Infrastructure
- **Blockchain Layer**: Stacks blockchain with Clarity smart contracts
- **Consensus**: Proof-of-Transfer (PoX) anchoring to Bitcoin
- **Decentralized Storage**: IPFS, Arweave, Filecoin
- **Knowledge Graph**: Neo4j or DGraph (distributed adaptation)

### Backend Services
- **Runtime**: Node.js with TypeScript
- **Architecture**: Microservices pattern
- **AI Integration**: LangChain, custom dRAG framework
- **Oracles**: Chainlink integration for external data feeds

### Frontend & User Interface
- **Framework**: React.js with Next.js
- **Styling**: TailwindCSS
- **Authentication**: OAuth2/JWT with Decentralized Identifiers (DIDs)

### DevOps & Infrastructure
- **Containerization**: Docker
- **Orchestration**: Kubernetes (AWS EKS / GCP GKE)
- **CI/CD**: GitHub Actions
- **Monitoring**: Prometheus, Grafana, ELK Stack

## Prerequisites

### System Requirements
- Node.js >= 18.0.0
- npm >= 8.0.0 or yarn >= 1.22.0
- Docker >= 20.10.0
- Docker Compose >= 2.0.0
- Git >= 2.30.0

### Development Tools
- Stacks CLI for blockchain development
- Clarity language support
- TypeScript >= 4.8.0
- Neo4j Desktop (for local graph database)

### Cloud Dependencies
- AWS CLI (for EKS deployment)
- kubectl (for Kubernetes management)
- Terraform >= 1.0.0 (for infrastructure as code)

## Development Environment Setup

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone <repository-url>
cd proofgraph

# Install root dependencies
npm install

# Install blockchain contract dependencies
cd contracts
npm install
cd ..

# Install backend service dependencies
cd services
npm install
cd ..

# Install frontend dependencies
cd web-portal
npm install
cd ..
```

### 2. Environment Configuration

```bash
# Copy environment templates
cp .env.example .env.local
cp services/.env.example services/.env.local
cp web-portal/.env.example web-portal/.env.local

# Configure environment variables
# Edit .env.local files with your specific configuration
```

### 3. Local Infrastructure Setup

```bash
# Start local development infrastructure
docker-compose up -d

# This will start:
# - Neo4j graph database
# - Redis for caching
# - PostgreSQL for metadata
# - IPFS node for decentralized storage
```

### 4. Blockchain Development Setup

```bash
# Install Stacks CLI
npm install -g @stacks/cli

# Start local Stacks node (optional for development)
stacks-node start --config=./config/stacks-node.toml
```

### 5. Run Development Services

```bash
# Start all services in development mode
npm run dev

# Or start individual services:
npm run dev:contracts    # Clarity contract development
npm run dev:services     # Backend microservices
npm run dev:web          # Frontend web portal
npm run dev:ai           # AI integration layer
```

## Testing Strategy

### Unit Testing
```bash
# Run all unit tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

### Integration Testing
```bash
# Run integration tests
npm run test:integration

# Test blockchain contracts
npm run test:contracts

# Test API endpoints
npm run test:api
```

### End-to-End Testing
```bash
# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui
```

## Project Structure

```
proofgraph/
├── contracts/              # Clarity smart contracts
│   ├── src/               # Contract source files
│   ├── tests/             # Contract tests
│   └── deployments/       # Deployment configurations
├── services/              # Backend microservices
│   ├── ingestion/         # Data ingestion service
│   ├── graph/             # Knowledge graph service
│   ├── verification/      # Data verification service
│   ├── ai-integration/    # AI/dRAG service
│   └── shared/            # Shared utilities and types
├── web-portal/            # Frontend React application
│   ├── src/
│   ├── public/
│   └── components/
├── sdk/                   # Developer SDKs
│   ├── javascript/
│   ├── python/
│   └── docs/
├── infrastructure/        # Infrastructure as code
│   ├── terraform/
│   ├── kubernetes/
│   └── docker/
├── docs/                  # Documentation
│   ├── api/
│   ├── architecture/
│   └── guides/
├── scripts/               # Build and deployment scripts
├── tests/                 # Integration and E2E tests
└── tools/                 # Development tools and utilities
```

## API Documentation

API documentation is available at `/docs/api/` and will be served at `http://localhost:3001/docs` when running the development server.

### Core API Endpoints
- **Data Ingestion**: `/api/v1/ingest`
- **Graph Queries**: `/api/v1/graph`
- **Verification**: `/api/v1/verify`
- **AI Integration**: `/api/v1/ai`
- **Blockchain Anchoring**: `/api/v1/anchor`

## Contributing Guidelines

### Code Standards
- Follow TypeScript strict mode
- Use ESLint and Prettier for code formatting
- Maintain test coverage above 80%
- Follow conventional commit messages
- Use semantic versioning for releases

### Pull Request Process
1. Fork the repository
2. Create a feature branch
3. Implement changes with tests
4. Ensure all tests pass
5. Submit pull request with detailed description

### Development Workflow
- Use feature branches for new development
- Require code review for all changes
- Automated testing on all pull requests
- Continuous integration with GitHub Actions

## Security Considerations

- Never commit private keys or sensitive configuration
- Use environment variables for all secrets
- Follow blockchain security best practices
- Implement proper access controls for APIs
- Regular security audits for smart contracts

## Deployment

### Staging Environment
```bash
npm run deploy:staging
```

### Production Environment
```bash
npm run deploy:production
```

### Infrastructure Management
```bash
# Deploy infrastructure
cd infrastructure/terraform
terraform init
terraform plan
terraform apply
```

## Monitoring and Observability

- **Metrics**: Prometheus metrics available at `/metrics`
- **Logs**: Structured logging with ELK stack integration
- **Tracing**: Distributed tracing for microservices
- **Health Checks**: Service health endpoints at `/health`

## License

MIT License - see LICENSE file for details.

## Support

For technical support and questions:
- Create an issue in the GitHub repository
- Review the documentation in `/docs`
- Check the API reference for integration guidance

---

**Note**: This project is in active development. Please refer to the project roadmap and current phase documentation for the latest development status and available features.