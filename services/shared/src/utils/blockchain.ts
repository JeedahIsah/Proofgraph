import {
  makeContractCall,
  makeContractDeploy,
  broadcastTransaction,
  AnchorMode,
  PostConditionMode,
  createStacksPrivateKey,
  getAddressFromPrivateKey,
  TransactionVersion,
  callReadOnlyFunction,
  cvToJSON,
  standardPrincipalCV,
  uintCV,
  bufferCV,
  stringAsciiCV
} from '@stacks/transactions';
import { StacksNetwork, StacksTestnet, StacksMainnet } from '@stacks/network';
import { getCurrentNetwork, getContractId } from '../config/networks';
import { ContractError } from '../types/verification';

/**
 * Get Stacks network instance based on configuration
 */
export function getStacksNetwork(): StacksNetwork {
  const config = getCurrentNetwork();
  
  switch (config.name) {
    case 'mainnet':
      return new StacksMainnet({ url: config.stacksNodeUrl });
    case 'testnet':
      return new StacksTestnet({ url: config.stacksNodeUrl });
    case 'devnet':
    default:
      return new StacksTestnet({ url: config.stacksNodeUrl });
  }
}

/**
 * Convert hex string to buffer for Clarity
 */
export function hexToBuffer(hex: string): Buffer {
  // Remove 0x prefix if present
  const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;
  return Buffer.from(cleanHex, 'hex');
}

/**
 * Validate data hash format (32-byte hex string)
 */
export function isValidDataHash(hash: string): boolean {
  const cleanHash = hash.startsWith('0x') ? hash.slice(2) : hash;
  return /^[a-fA-F0-9]{64}$/.test(cleanHash);
}

/**
 * Validate metadata URI format
 */
export function isValidMetadataUri(uri: string): boolean {
  return uri.length > 0 && uri.length <= 256 && /^[a-zA-Z0-9:\/\.\-_]+$/.test(uri);
}

/**
 * Call read-only function on data-anchoring contract
 */
export async function callReadOnlyContractFunction(
  functionName: string,
  functionArgs: any[] = [],
  senderAddress?: string
): Promise<any> {
  const network = getStacksNetwork();
  const contractId = getContractId('data-anchoring');
  const [contractAddress, contractName] = contractId.split('.');
  
  try {
    const result = await callReadOnlyFunction({
      contractAddress,
      contractName,
      functionName,
      functionArgs,
      senderAddress: senderAddress || contractAddress,
      network
    });
    
    return cvToJSON(result);
  } catch (error) {
    throw new Error(`Failed to call read-only function ${functionName}: ${error}`);
  }
}

/**
 * Create and broadcast a contract call transaction
 */
export async function broadcastContractCall(
  functionName: string,
  functionArgs: any[],
  privateKey: string,
  fee: number = 1000
): Promise<string> {
  const network = getStacksNetwork();
  const contractId = getContractId('data-anchoring');
  const [contractAddress, contractName] = contractId.split('.');
  
  const senderKey = createStacksPrivateKey(privateKey);
  const senderAddress = getAddressFromPrivateKey(
    senderKey.data,
    network.version === TransactionVersion.Mainnet 
      ? TransactionVersion.Mainnet 
      : TransactionVersion.Testnet
  );
  
  const txOptions = {
    contractAddress,
    contractName,
    functionName,
    functionArgs,
    senderKey: senderKey.data,
    network,
    anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Allow,
    fee
  };
  
  try {
    const transaction = await makeContractCall(txOptions);
    const result = await broadcastTransaction(transaction, network);
    
    if (result.error) {
      throw new Error(`Transaction failed: ${result.error}`);
    }
    
    return result.txid;
  } catch (error) {
    throw new Error(`Failed to broadcast transaction: ${error}`);
  }
}

/**
 * Map contract error codes to human-readable messages
 */
export function mapContractError(errorCode: number): string {
  switch (errorCode) {
    case ContractError.NOT_AUTHORIZED:
      return 'Not authorized to perform this action';
    case ContractError.INVALID_INPUT:
      return 'Invalid input parameters';
    case ContractError.ALREADY_EXISTS:
      return 'Resource already exists';
    case ContractError.NOT_FOUND:
      return 'Resource not found';
    case ContractError.INSUFFICIENT_BALANCE:
      return 'Insufficient balance';
    case ContractError.DATA_EXISTS:
      return 'Data hash already exists';
    case ContractError.INSUFFICIENT_FEE:
      return 'Insufficient fee provided';
    case ContractError.INVALID_DATA:
      return 'Invalid data format';
    case ContractError.INVALID_METADATA:
      return 'Invalid metadata format';
    case ContractError.DATA_TOO_LARGE:
      return 'Data size exceeds maximum allowed';
    case ContractError.CONTRACT_NOT_INITIALIZED:
      return 'Contract not initialized';
    default:
      return `Unknown error (code: ${errorCode})`;
  }
}
