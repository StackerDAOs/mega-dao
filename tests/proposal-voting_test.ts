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
  VOTING_CODES,
} from './utils/constants.ts';
import { daoApi, submissionApi, tokenApi, votingApi } from './api/index.ts';

Clarinet.test({
  name: 'Verify voting extension is enabled',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const { init, isExtension } = daoApi(chain, deployer);
    const { receipts } = chain.mineBlock([
      init(BOOTSTRAPS.MEGA_DAO),
    ])
    receipts[0].result.expectOk().expectBool(true);
    isExtension(EXTENSIONS.VOTING).result.expectBool(true);
  },
});

Clarinet.test({
  name: 'Reject vote too early',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const { init } = daoApi(chain, deployer);
    const { receipts } = chain.mineBlock([
      init(BOOTSTRAPS.MEGA_DAO),
    ])
    receipts[0].result.expectOk().expectBool(true);
    const { propose } = submissionApi(chain, deployer);
    const validStartHeight = chain.blockHeight + 144;
    const { receipts: proposalReceipts } = chain.mineBlock([
      propose(
        PROPOSALS.TRANSFER_TOKENS,
        validStartHeight,
      ),
    ]);
    proposalReceipts[0].result.expectOk().expectBool(true);
    const { vote } = votingApi(chain, deployer);
    const { receipts: voteReceipts } = chain.mineBlock([
      vote(
        true,
        PROPOSALS.TRANSFER_TOKENS,
        undefined,
      ),
    ]);
    voteReceipts[0].result.expectErr().expectUint(VOTING_CODES.ERR_PROPOSAL_INACTIVE);
  },
});

Clarinet.test({
  name: 'Reject vote too late',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const { init } = daoApi(chain, deployer);
    const { receipts } = chain.mineBlock([
      init(BOOTSTRAPS.MEGA_DAO),
    ])
    receipts[0].result.expectOk().expectBool(true);
    const { propose } = submissionApi(chain, deployer);
    const validStartHeight = chain.blockHeight + 144;
    const { receipts: proposalReceipts } = chain.mineBlock([
      propose(
        PROPOSALS.TRANSFER_TOKENS,
        validStartHeight,
      ),
    ]);
    proposalReceipts[0].result.expectOk().expectBool(true);
    const { vote } = votingApi(chain, deployer);
    chain.mineEmptyBlockUntil(866);
    const { receipts: voteReceipts } = chain.mineBlock([
      vote(
        true,
        PROPOSALS.TRANSFER_TOKENS,
        undefined,
      ),
    ]);
    voteReceipts[0].result.expectErr().expectUint(VOTING_CODES.ERR_PROPOSAL_INACTIVE);
  },
});

Clarinet.test({
  name: 'Reject vote by user with insufficient token balance',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const { init } = daoApi(chain, deployer);
    const { receipts } = chain.mineBlock([
      init(BOOTSTRAPS.MEGA_DAO),
    ])
    receipts[0].result.expectOk().expectBool(true);
    const { propose } = submissionApi(chain, deployer);
    const validStartHeight = chain.blockHeight + 144;
    const { receipts: proposalReceipts } = chain.mineBlock([
      propose(
        PROPOSALS.TRANSFER_TOKENS,
        validStartHeight,
      ),
    ]);
    proposalReceipts[0].result.expectOk().expectBool(true);
    const { vote } = votingApi(chain, deployer);
    chain.mineEmptyBlockUntil(866);
    const { receipts: voteReceipts } = chain.mineBlock([
      vote(
        true,
        PROPOSALS.TRANSFER_TOKENS,
        undefined,
      ),
    ]);
    voteReceipts[0].result.expectErr().expectUint(VOTING_CODES.ERR_PROPOSAL_INACTIVE);
  },
});

Clarinet.test({
  name: 'Reject double vote',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const { init } = daoApi(chain, deployer);
    const { receipts } = chain.mineBlock([
      init(BOOTSTRAPS.MEGA_DAO),
    ])
    receipts[0].result.expectOk().expectBool(true);
    const { propose } = submissionApi(chain, deployer);
    const validStartHeight = chain.blockHeight + 144;
    const { receipts: proposalReceipts } = chain.mineBlock([
      propose(
        PROPOSALS.TRANSFER_TOKENS,
        validStartHeight,
      ),
    ]);
    proposalReceipts[0].result.expectOk().expectBool(true);
    const { vote } = votingApi(chain, deployer);
    chain.mineEmptyBlockUntil(147);
    const { receipts: voteReceipts } = chain.mineBlock([
      vote(
        true,
        PROPOSALS.TRANSFER_TOKENS,
        undefined,
      ),
      vote(
        true,
        PROPOSALS.TRANSFER_TOKENS,
        undefined,
      ),
    ]);
    voteReceipts[0].result.expectOk().expectBool(true);
    voteReceipts[1].result.expectErr().expectUint(VOTING_CODES.ERR_ALREADY_VOTED);
  },
});

Clarinet.test({
  name: 'Snapshot user token balance to prevent manipulating votes',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const { init } = daoApi(chain, deployer);
    const { receipts } = chain.mineBlock([
      init(BOOTSTRAPS.MEGA_DAO),
    ])
    receipts[0].result.expectOk().expectBool(true);
    const { propose } = submissionApi(chain, deployer);
    const validStartHeight = chain.blockHeight + 144;
    const { receipts: proposalReceipts } = chain.mineBlock([
      propose(
        PROPOSALS.TRANSFER_TOKENS,
        validStartHeight,
      ),
    ]);
    proposalReceipts[0].result.expectOk().expectBool(true);
    const { vote, getProposalData } = votingApi(chain, deployer);
    chain.mineEmptyBlockUntil(147);
    const { receipts: voteReceipts } = chain.mineBlock([
      vote(
        true,
        PROPOSALS.TRANSFER_TOKENS,
        undefined,
      ),
    ]);
    voteReceipts[0].result.expectOk().expectBool(true);
    const { transfer } = tokenApi(chain, deployer);
    const otherWallet = accounts.get('wallet_3')!;
    const { receipts: transferReceipts } = chain.mineBlock([
      transfer(
        150,
        deployer.address,
        otherWallet.address,
      ),
    ]);
    transferReceipts[0].result.expectOk().expectBool(true);
    const { vote: invalidVote } = votingApi(chain, otherWallet);
    chain.mineEmptyBlockUntil(chain.blockHeight + 1);
    const { receipts: invalidVoteReceipts } = chain.mineBlock([
      invalidVote(
        true,
        PROPOSALS.TRANSFER_TOKENS,
        undefined,
      ),
    ]);
    invalidVoteReceipts[0].result.expectErr().expectUint(VOTING_CODES.ERR_UNAUTHORIZED_VOTER);
    const proposal = getProposalData(PROPOSALS.TRANSFER_TOKENS).result;
    assertEquals(proposal.expectSome().expectTuple(), {
      votesFor: types.uint(15000),
      votesAgainst: types.uint(0),
      startBlockHeight: types.uint(validStartHeight),
      endBlockHeight: types.uint(866),
      concluded: types.bool(false),
      passed: types.bool(false),
      proposer: deployer.address,
    });
  },
});

Clarinet.test({
  name: 'Vote as a delegate',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    // TODO: test case for voting as a delegate
  },
});

Clarinet.test({
  name: 'Conclude and execute proposal',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    // TODO
  },
});

Clarinet.test({
  name: 'Conclude and reject proposal',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    // TODO
  },
});