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