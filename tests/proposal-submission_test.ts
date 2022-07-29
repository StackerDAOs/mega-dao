import { 
  Account,
  assertEquals,
  Clarinet,
  Chain,
  Tx,
  types,
} from './utils/deps.ts';
import {
  BOOTSTRAPS,
  EXTENSIONS,
  PROPOSALS,
  SUBMISSION_CODES
} from './utils/constants.ts';
import { daoApi, submissionApi } from './api/index.ts';

Clarinet.test({
  name: 'Verify submission extension is enabled',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const { init, isExtension } = daoApi(chain, deployer);
    const { receipts } = chain.mineBlock([
      init(BOOTSTRAPS.MEGA_DAO),
    ])
    receipts[0].result.expectOk().expectBool(true);
    isExtension(EXTENSIONS.SUBMISSION).result.expectBool(true);
  },
});

Clarinet.test({
  name: 'Reject proposal if it starts too soon',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const { init } = daoApi(chain, deployer);
    const { receipts } = chain.mineBlock([
      init(BOOTSTRAPS.MEGA_DAO),
    ])
    receipts[0].result.expectOk().expectBool(true);
    const { propose } = submissionApi(chain, deployer);
    const { receipts: proposalReceipts } = chain.mineBlock([
      propose(
        PROPOSALS.TRANSFER_TOKENS,
        145,
      ),
    ])
    proposalReceipts[0].result.expectErr().expectUint(
      SUBMISSION_CODES.ERR_PROPOSAL_MINIMUM_START_DELAY,
    );
  },
});

Clarinet.test({
  name: 'Reject proposal if it ends too late',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const { init } = daoApi(chain, deployer);
    const { receipts } = chain.mineBlock([
      init(BOOTSTRAPS.MEGA_DAO),
    ])
    receipts[0].result.expectOk().expectBool(true);
    const { propose } = submissionApi(chain, deployer);
    const { receipts: proposalReceipts } = chain.mineBlock([
      propose(
        PROPOSALS.TRANSFER_TOKENS,
        1011,
      ),
    ])
    proposalReceipts[0].result.expectErr().expectUint(
      SUBMISSION_CODES.ERR_PROPOSAL_MAXIMUM_START_DELAY,
    );
  },
});

Clarinet.test({
  name: 'Reject proposal submitted by user with insufficient token balance',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const ineligibleMember = accounts.get('wallet_4')!;
    const { init } = daoApi(chain, deployer);
    const { receipts } = chain.mineBlock([
      init(BOOTSTRAPS.MEGA_DAO),
    ])
    receipts[0].result.expectOk().expectBool(true);
    const { propose } = submissionApi(chain, ineligibleMember);
    const { receipts: proposalReceipts } = chain.mineBlock([
      propose(
        PROPOSALS.TRANSFER_TOKENS,
        146,
      ),
    ])
    proposalReceipts[0].result.expectErr().expectUint(
      SUBMISSION_CODES.ERR_UNAUTHORIZED_PROPOSER,
    );
  },
});

Clarinet.test({
  name: 'Reject an invalid proposal',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const account = accounts.get('wallet_1')!;
    const { init } = daoApi(chain, deployer);
    const { receipts } = chain.mineBlock([
      init(BOOTSTRAPS.MEGA_DAO),
    ])
    receipts[0].result.expectOk().expectBool(true);
    const { propose } = submissionApi(chain, deployer);
    const { receipts: proposalReceipts } = chain.mineBlock([
      propose(
        account.address,
        146,
      ),
    ])
    assertEquals(proposalReceipts.length, 0);
  },
});

Clarinet.test({
  name: 'Submit a successful proposal',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const { init } = daoApi(chain, deployer);
    const { receipts } = chain.mineBlock([
      init(BOOTSTRAPS.MEGA_DAO),
    ])
    receipts[0].result.expectOk().expectBool(true);
    const { propose } = submissionApi(chain, deployer);
    const { receipts: proposalReceipts } = chain.mineBlock([
      propose(
        PROPOSALS.TRANSFER_TOKENS,
        146,
      ),
    ])
    proposalReceipts[0].result.expectOk().expectBool(true);
  },
});

