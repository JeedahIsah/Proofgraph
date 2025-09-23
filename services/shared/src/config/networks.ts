import { NetworkConfig } from '../types/verification';

/**
 * Network configurations for different Stacks environments
 */
export const NETWORKS: Record<string, NetworkConfig> = {
  devnet: {
    name: 'devnet',
    stacksNodeUrl: 'http://localhost:20443',
    contractAddress: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
    contractName: 'data-anchoring'
  },
  testnet: {
    name: 'testnet',
    stacksNodeUrl: 'https://stacks-node-api.testnet.stacks.co',
    contractAddress: '', // To be set when deployed
    contractName: 'data-anchoring'
  },
  mainnet: {
    name: 'mainnet',
    stacksNodeUrl: 'https://stacks-node-api.mainnet.stacks.co',
    contractAddress: '', // To be set when deployed
    contractName: 'data-anchoring'
  }
};

/**
 * Get network configuration by name
 */
export function getNetworkConfig(networkName: string): NetworkConfig {
  const config = NETWORKS[networkName];
  if (!config) {
    throw new Error(`Unknown network: ${networkName}`);
  }
  return config;
}

/**
 * Get current network from environment
 */
export function getCurrentNetwork(): NetworkConfig {
  const networkName = process.env.STACKS_NETWORK || 'devnet';
  return getNetworkConfig(networkName);
}

/**
 * Contract deployment addresses for different networks
 * These should be updated when contracts are deployed
 */
export const CONTRACT_ADDRESSES = {
  devnet: {
    'data-anchoring': 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.data-anchoring',
    'proofgraph-core': 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.proofgraph-core'
  },
  testnet: {
    'data-anchoring': '', // To be updated after deployment
    'proofgraph-core': ''
  },
  mainnet: {
    'data-anchoring': '', // To be updated after deployment
    'proofgraph-core': ''
  }
};

/**
 * Get contract identifier for current network
 */
export function getContractId(contractName: string, network?: string): string {
  const networkName = network || process.env.STACKS_NETWORK || 'devnet';
  const addresses = CONTRACT_ADDRESSES[networkName as keyof typeof CONTRACT_ADDRESSES];
  
  if (!addresses) {
    throw new Error(`No contract addresses configured for network: ${networkName}`);
  }
  
  const contractId = addresses[contractName as keyof typeof addresses];
  if (!contractId) {
    throw new Error(`Contract ${contractName} not found for network ${networkName}`);
  }
  
  return contractId;
}
