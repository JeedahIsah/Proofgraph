import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v1.0.0/index.ts';
import { assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts';

Clarinet.test({
    name: "Contract initialization test",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        
        // Test that contract can be initialized
        let block = chain.mineBlock([
            Tx.contractCall('data-anchoring', 'initialize-contract', [], deployer.address)
        ]);
        
        assertEquals(block.receipts.length, 1);
        assertEquals(block.receipts[0].result.expectOk(), true);
    },
});

Clarinet.test({
    name: "System stats test",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        
        // Initialize contract first
        let initBlock = chain.mineBlock([
            Tx.contractCall('data-anchoring', 'initialize-contract', [], deployer.address)
        ]);
        
        // Test system stats
        let statsBlock = chain.mineBlock([
            Tx.contractCall('data-anchoring', 'get-system-stats', [], deployer.address)
        ]);
        
        assertEquals(statsBlock.receipts.length, 1);
        const stats = statsBlock.receipts[0].result.expectOk().expectTuple();
        assertEquals(stats['total-records'], types.uint(0));
        assertEquals(stats['contract-version'], types.uint(1));
    },
});

Clarinet.test({
    name: "Anchor data successfully",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        const user1 = accounts.get('wallet_1')!;
        
        // Initialize contract first
        let initBlock = chain.mineBlock([
            Tx.contractCall('data-anchoring', 'initialize-contract', [], deployer.address)
        ]);
        
        // Test successful data anchoring
        const dataHash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
        const metadataUri = 'ipfs://QmTest123456789';
        const fee = 1000;
        
        let anchorBlock = chain.mineBlock([
            Tx.contractCall('data-anchoring', 'anchor-data', [
                types.buff(dataHash),
                types.ascii(metadataUri),
                types.uint(fee)
            ], user1.address)
        ]);
        
        assertEquals(anchorBlock.receipts.length, 1);
        const verificationId = anchorBlock.receipts[0].result.expectOk();
        assertEquals(verificationId, types.uint(1));
        
        // Verify the data was stored correctly
        let metadataBlock = chain.mineBlock([
            Tx.contractCall('data-anchoring', 'get-verification-metadata', [
                types.uint(1)
            ], user1.address)
        ]);
        
        const metadata = metadataBlock.receipts[0].result.expectSome().expectTuple();
        assertEquals(metadata['contributor'], types.principal(user1.address));
        assertEquals(metadata['data-hash'], types.buff(dataHash));
        assertEquals(metadata['metadata-uri'], types.ascii(metadataUri));
        assertEquals(metadata['fee-paid'], types.uint(fee));
    },
});

Clarinet.test({
    name: "Reject duplicate data hash",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        const user1 = accounts.get('wallet_1')!;
        
        // Initialize contract first
        let initBlock = chain.mineBlock([
            Tx.contractCall('data-anchoring', 'initialize-contract', [], deployer.address)
        ]);
        
        const dataHash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
        const metadataUri = 'ipfs://QmTest123456789';
        const fee = 1000;
        
        // First anchoring should succeed
        let firstAnchorBlock = chain.mineBlock([
            Tx.contractCall('data-anchoring', 'anchor-data', [
                types.buff(dataHash),
                types.ascii(metadataUri),
                types.uint(fee)
            ], user1.address)
        ]);
        
        assertEquals(firstAnchorBlock.receipts[0].result.expectOk(), types.uint(1));
        
        // Second anchoring with same hash should fail
        let secondAnchorBlock = chain.mineBlock([
            Tx.contractCall('data-anchoring', 'anchor-data', [
                types.buff(dataHash),
                types.ascii(metadataUri),
                types.uint(fee)
            ], user1.address)
        ]);
        
        assertEquals(secondAnchorBlock.receipts[0].result.expectErr(), types.uint(201)); // ERR-DATA-EXISTS
    },
});

Clarinet.test({
    name: "Reject insufficient fee",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        const user1 = accounts.get('wallet_1')!;
        
        // Initialize contract first
        let initBlock = chain.mineBlock([
            Tx.contractCall('data-anchoring', 'initialize-contract', [], deployer.address)
        ]);
        
        const dataHash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
        const metadataUri = 'ipfs://QmTest123456789';
        const insufficientFee = 500; // Less than minimum fee of 1000
        
        // Anchoring with insufficient fee should fail
        let anchorBlock = chain.mineBlock([
            Tx.contractCall('data-anchoring', 'anchor-data', [
                types.buff(dataHash),
                types.ascii(metadataUri),
                types.uint(insufficientFee)
            ], user1.address)
        ]);
        
        assertEquals(anchorBlock.receipts[0].result.expectErr(), types.uint(202)); // ERR-INSUFFICIENT-FEE
    },
});

Clarinet.test({
    name: "Verify data successfully",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        const user1 = accounts.get('wallet_1')!;
        const verifier = accounts.get('wallet_2')!;
        
        // Initialize contract first
        let initBlock = chain.mineBlock([
            Tx.contractCall('data-anchoring', 'initialize-contract', [], deployer.address)
        ]);
        
        const dataHash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
        const metadataUri = 'ipfs://QmTest123456789';
        const fee = 1000;
        
        // First anchor some data
        let anchorBlock = chain.mineBlock([
            Tx.contractCall('data-anchoring', 'anchor-data', [
                types.buff(dataHash),
                types.ascii(metadataUri),
                types.uint(fee)
            ], user1.address)
        ]);
        
        const verificationId = anchorBlock.receipts[0].result.expectOk();
        
        // Now verify the data with correct hash
        let verifyBlock = chain.mineBlock([
            Tx.contractCall('data-anchoring', 'verify-data', [
                verificationId,
                types.buff(dataHash)
            ], verifier.address)
        ]);
        
        assertEquals(verifyBlock.receipts.length, 1);
        const verifyResult = verifyBlock.receipts[0].result.expectOk().expectTuple();
        assertEquals(verifyResult['contributor'], types.principal(user1.address));
        assertEquals(verifyResult['verified'], types.bool(true));
    },
});

Clarinet.test({
    name: "Verify data with tampered hash fails",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        const user1 = accounts.get('wallet_1')!;
        const verifier = accounts.get('wallet_2')!;
        
        // Initialize contract first
        let initBlock = chain.mineBlock([
            Tx.contractCall('data-anchoring', 'initialize-contract', [], deployer.address)
        ]);
        
        const originalHash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
        const tamperedHash = '0x9999567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
        const metadataUri = 'ipfs://QmTest123456789';
        const fee = 1000;
        
        // First anchor some data
        let anchorBlock = chain.mineBlock([
            Tx.contractCall('data-anchoring', 'anchor-data', [
                types.buff(originalHash),
                types.ascii(metadataUri),
                types.uint(fee)
            ], user1.address)
        ]);
        
        const verificationId = anchorBlock.receipts[0].result.expectOk();
        
        // Now verify the data with tampered hash
        let verifyBlock = chain.mineBlock([
            Tx.contractCall('data-anchoring', 'verify-data', [
                verificationId,
                types.buff(tamperedHash)
            ], verifier.address)
        ]);
        
        assertEquals(verifyBlock.receipts.length, 1);
        const verifyResult = verifyBlock.receipts[0].result.expectOk().expectTuple();
        assertEquals(verifyResult['contributor'], types.principal(user1.address));
        assertEquals(verifyResult['verified'], types.bool(false));
    },
});

Clarinet.test({
    name: "Verify non-existent verification ID",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        const verifier = accounts.get('wallet_2')!;
        
        // Initialize contract first
        let initBlock = chain.mineBlock([
            Tx.contractCall('data-anchoring', 'initialize-contract', [], deployer.address)
        ]);
        
        const dataHash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
        const nonExistentId = 999;
        
        // Try to verify with non-existent verification ID
        let verifyBlock = chain.mineBlock([
            Tx.contractCall('data-anchoring', 'verify-data', [
                types.uint(nonExistentId),
                types.buff(dataHash)
            ], verifier.address)
        ]);
        
        assertEquals(verifyBlock.receipts.length, 1);
        assertEquals(verifyBlock.receipts[0].result.expectErr(), types.uint(104)); // ERR-NOT-FOUND
    },
});

Clarinet.test({
    name: "Test read-only query functions",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        const user1 = accounts.get('wallet_1')!;
        
        // Initialize contract first
        let initBlock = chain.mineBlock([
            Tx.contractCall('data-anchoring', 'initialize-contract', [], deployer.address)
        ]);
        
        const dataHash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
        const metadataUri = 'ipfs://QmTest123456789';
        const fee = 1000;
        
        // Anchor some data
        let anchorBlock = chain.mineBlock([
            Tx.contractCall('data-anchoring', 'anchor-data', [
                types.buff(dataHash),
                types.ascii(metadataUri),
                types.uint(fee)
            ], user1.address)
        ]);
        
        // Test get-verification-by-hash
        let hashQueryBlock = chain.mineBlock([
            Tx.contractCall('data-anchoring', 'get-verification-by-hash', [
                types.buff(dataHash)
            ], user1.address)
        ]);
        
        const hashResult = hashQueryBlock.receipts[0].result.expectSome().expectTuple();
        assertEquals(hashResult['contributor'], types.principal(user1.address));
        
        // Test verification-exists
        let existsBlock = chain.mineBlock([
            Tx.contractCall('data-anchoring', 'verification-exists', [
                types.uint(1)
            ], user1.address)
        ]);
        
        assertEquals(existsBlock.receipts[0].result, types.bool(true));
        
        // Test get-detailed-system-metrics
        let metricsBlock = chain.mineBlock([
            Tx.contractCall('data-anchoring', 'get-detailed-system-metrics', [], user1.address)
        ]);
        
        const metrics = metricsBlock.receipts[0].result.expectTuple();
        assertEquals(metrics['total-records'], types.uint(1));
        assertEquals(metrics['contract-version'], types.uint(1));
    },
});