import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v1.0.0/index.ts';
import { assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts';

Clarinet.test({
  name: 'Initialize staking and set token minter',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;

    const stakingInit = chain.mineBlock([
      Tx.contractCall('pg-staking', 'initialize', [], deployer.address),
    ]);

    assertEquals(stakingInit.receipts[0].result.expectOk(), true);

    // set minter to staking contract principal
    const stakingPrincipal = `${deployer.address}.pg-staking`;
    const setMinter = chain.mineBlock([
      Tx.contractCall('pg-token', 'set-minter', [types.principal(stakingPrincipal)], deployer.address),
    ]);
    assertEquals(setMinter.receipts[0].result.expectOk(), true);
  },
});

Clarinet.test({
  name: 'Stake, accrue rewards across blocks, and claim mints tokens',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const user1 = accounts.get('wallet_1')!;

    // initialize & set minter
    chain.mineBlock([
      Tx.contractCall('pg-staking', 'initialize', [], deployer.address),
      Tx.contractCall('pg-token', 'set-minter', [types.principal(`${deployer.address}.pg-staking`)], deployer.address),
    ]);

    // stake 100 units
    const stakeBlock = chain.mineBlock([
      Tx.contractCall('pg-staking', 'stake', [types.uint(100)], user1.address),
    ]);
    assertEquals(stakeBlock.receipts[0].result.expectOk(), types.uint(100));

    // advance a few blocks by calling read-only endpoints (still mined as blocks)
    chain.mineBlock([
      Tx.contractCall('pg-staking', 'pending-rewards-of', [types.principal(user1.address)], user1.address),
    ]);
    chain.mineBlock([
      Tx.contractCall('pg-staking', 'pending-rewards-of', [types.principal(user1.address)], user1.address),
    ]);

    // claim
    const claimBlock = chain.mineBlock([
      Tx.contractCall('pg-staking', 'claim', [], user1.address),
    ]);

    const claimed = claimBlock.receipts[0].result.expectOk();

    // token balance should equal claimed amount
    const balBlock = chain.mineBlock([
      Tx.contractCall('pg-token', 'get-balance-of', [types.principal(user1.address)], user1.address),
    ]);
    assertEquals(balBlock.receipts[0].result, claimed);
  },
});

Clarinet.test({
  name: 'Unstake reduces amount and keeps rewards accounting consistent',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const user1 = accounts.get('wallet_1')!;

    chain.mineBlock([
      Tx.contractCall('pg-staking', 'initialize', [], deployer.address),
      Tx.contractCall('pg-token', 'set-minter', [types.principal(`${deployer.address}.pg-staking`)], deployer.address),
      Tx.contractCall('pg-staking', 'stake', [types.uint(100)], user1.address),
    ]);

    // Unstake 40
    const unstakeBlock = chain.mineBlock([
      Tx.contractCall('pg-staking', 'unstake', [types.uint(40)], user1.address),
    ]);
    assertEquals(unstakeBlock.receipts[0].result.expectOk(), types.uint(60));

    // Read stake-of
    const stakeInfoBlock = chain.mineBlock([
      Tx.contractCall('pg-staking', 'get-stake-of', [types.principal(user1.address)], user1.address),
    ]);
    const s = stakeInfoBlock.receipts[0].result.expectTuple();
    assertEquals(s['amount'], types.uint(60));
  },
});

