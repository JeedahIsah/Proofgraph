# Setup Validation Checklist

## Development Team Onboarding Validation

### Prerequisites Verification

#### System Requirements
- [ ] **Node.js**: Version 18.0.0 or higher installed
  ```bash
  node --version
  ```
- [ ] **npm**: Version 9.0.0 or higher installed
  ```bash
  npm --version
  ```
- [ ] **Docker**: Version 20.0.0 or higher installed and running
  ```bash
  docker --version
  docker info
  ```
- [ ] **Docker Compose**: Version 2.0.0 or higher installed
  ```bash
  docker-compose --version
  ```
- [ ] **Git**: Version 2.30.0 or higher installed
  ```bash
  git --version
  ```
- [ ] **Clarinet**: Latest version installed for Stacks development
  ```bash
  clarinet --version
  ```

#### Development Tools
- [ ] **Code Editor**: VS Code or similar with recommended extensions
  - TypeScript support
  - ESLint extension
  - Prettier extension
  - Docker extension
- [ ] **Terminal**: PowerShell, Bash, or Zsh with Git integration

### Repository Setup Validation

#### Git Repository
- [ ] **Clone Repository**: Successfully cloned from remote
  ```bash
  git clone <repository-url>
  cd Proofgraph
  ```
- [ ] **Git Status**: Clean working directory
  ```bash
  git status
  ```
- [ ] **Commit History**: Verify initial commits present
  ```bash
  git log --oneline
  ```
  Expected output:
  - `feat: establish project directory structure and configuration templates`
  - `feat: initialize repository with documentation and git configuration`

#### Directory Structure
- [ ] **Root Files**: Verify presence of essential files
  - `README.md`
  - `package.json`
  - `.gitignore`
  - `docker-compose.yml`
  - `tsconfig.json`
  - `.eslintrc.json`
  - `.prettierrc.json`
  - `.env.example`
  - `LICENSE`

- [ ] **Directory Structure**: Verify all directories exist
  ```bash
  tree /F  # Windows
  tree     # Linux/macOS
  ```
  Expected directories:
  - `contracts/` (with Clarinet.toml)
  - `services/` (with package.json)
  - `web-portal/` (with package.json)
  - `sdk/`
  - `infrastructure/`
  - `docs/`
  - `scripts/`
  - `tests/`
  - `tools/`

### Dependency Installation

#### Root Dependencies
- [ ] **Install Root Dependencies**
  ```bash
  npm install
  ```
- [ ] **Verify Installation**: No errors or warnings
- [ ] **Check Workspaces**: Verify workspace configuration
  ```bash
  npm run workspaces
  ```

#### Service Dependencies
- [ ] **Contracts Dependencies**
  ```bash
  cd contracts
  npm install
  cd ..
  ```
- [ ] **Services Dependencies**
  ```bash
  cd services
  npm install
  cd ..
  ```
- [ ] **Web Portal Dependencies**
  ```bash
  cd web-portal
  npm install
  cd ..
  ```

### Development Environment

#### Docker Services
- [ ] **Start Development Stack**
  ```bash
  docker-compose up -d
  ```
- [ ] **Verify Services Running**
  ```bash
  docker-compose ps
  ```
  Expected services:
  - Neo4j (port 7474, 7687)
  - Redis (port 6379)
  - PostgreSQL (port 5432)
  - IPFS (port 5001, 8080)
  - Prometheus (port 9090)
  - Grafana (port 3000)
  - Elasticsearch (port 9200)
  - Kibana (port 5601)

#### Service Health Checks
- [ ] **Neo4j**: Access web interface at http://localhost:7474
  - Username: `neo4j`
  - Password: `password`
- [ ] **Redis**: Test connection
  ```bash
  docker exec -it proofgraph-redis redis-cli ping
  ```
- [ ] **PostgreSQL**: Test connection
  ```bash
  docker exec -it proofgraph-postgres psql -U postgres -c "SELECT version();"
  ```
- [ ] **IPFS**: Access web UI at http://localhost:5001/webui
- [ ] **Grafana**: Access dashboard at http://localhost:3000
  - Username: `admin`
  - Password: `admin`

### Code Quality Tools

#### Linting and Formatting
- [ ] **ESLint**: Run linting check
  ```bash
  npm run lint
  ```
- [ ] **Prettier**: Run formatting check
  ```bash
  npm run format:check
  ```
- [ ] **TypeScript**: Run type checking
  ```bash
  npm run type-check
  ```

#### Testing Framework
- [ ] **Unit Tests**: Run test suite
  ```bash
  npm test
  ```
- [ ] **Test Coverage**: Generate coverage report
  ```bash
  npm run test:coverage
  ```

### Blockchain Development

#### Clarinet Setup
- [ ] **Clarinet Check**: Verify Clarinet configuration
  ```bash
  cd contracts
  clarinet check
  ```
- [ ] **Console Access**: Test Clarinet console
  ```bash
  clarinet console
  ```
- [ ] **Test Execution**: Run contract tests (when available)
  ```bash
  clarinet test
  ```

### Environment Configuration

#### Environment Variables
- [ ] **Copy Environment Template**
  ```bash
  cp .env.example .env
  ```
- [ ] **Configure Required Variables**: Update `.env` with appropriate values
  - Database connections
  - API keys (development/testing)
  - Service endpoints
- [ ] **Verify Configuration**: Test environment loading
  ```bash
  npm run env:check
  ```

### Development Workflow

#### Git Workflow
- [ ] **Branch Creation**: Test branch creation
  ```bash
  git checkout -b feature/test-setup
  ```
- [ ] **Commit Convention**: Test conventional commit
  ```bash
  echo "test" > test.txt
  git add test.txt
  git commit -m "feat: add test file for setup validation"
  git reset --hard HEAD~1
  rm test.txt
  ```

#### Development Scripts
- [ ] **Development Mode**: Test development server startup
  ```bash
  npm run dev
  ```
- [ ] **Build Process**: Test build execution
  ```bash
  npm run build
  ```
- [ ] **Clean Process**: Test cleanup
  ```bash
  npm run clean
  ```

### Documentation Access

#### Project Documentation
- [ ] **README**: Review setup instructions
- [ ] **Technical Justification**: Review architectural decisions
- [ ] **API Documentation**: Verify documentation structure
- [ ] **Contributing Guidelines**: Review development standards

### Troubleshooting Common Issues

#### Port Conflicts
- [ ] **Check Port Availability**: Ensure required ports are free
  ```bash
  netstat -an | findstr "7474 7687 6379 5432 5001 8080 9090 3000 9200 5601"
  ```

#### Permission Issues
- [ ] **Docker Permissions**: Verify Docker access
- [ ] **File Permissions**: Check file system permissions
- [ ] **Network Access**: Verify internet connectivity for package downloads

#### Memory and Resources
- [ ] **Docker Resources**: Ensure adequate Docker memory allocation (minimum 4GB)
- [ ] **Disk Space**: Verify sufficient disk space (minimum 10GB free)
- [ ] **System Performance**: Monitor system resources during development

### Team Onboarding Completion

#### Final Validation
- [ ] **All Services Running**: Complete development stack operational
- [ ] **Code Quality Passing**: All linting and formatting checks pass
- [ ] **Tests Passing**: All available tests execute successfully
- [ ] **Documentation Reviewed**: Team member familiar with project structure
- [ ] **Development Workflow**: Able to make changes and commit following conventions

#### Sign-off
- [ ] **Developer Name**: ________________________
- [ ] **Setup Date**: ________________________
- [ ] **Mentor/Lead Approval**: ________________________
- [ ] **Notes/Issues**: ________________________

### Next Steps

1. **Review PRD**: Familiarize with product requirements
2. **Architecture Deep Dive**: Study technical justification document
3. **First Task Assignment**: Begin development work
4. **Team Integration**: Join development communication channels
5. **Continuous Learning**: Stay updated with project evolution

---

**Note**: This checklist should be completed for each new team member joining the ProofGraph development team. Any issues encountered during setup should be documented and addressed to improve the onboarding process.