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
        
        assertEquals(secondAnchorBlock.receipts[0].result.expectErr(), types.uint(101)); // ERR-DATA-EXISTS
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
        
        assertEquals(anchorBlock.receipts[0].result.expectErr(), types.uint(102)); // ERR-INSUFFICIENT-FEE
    },
});