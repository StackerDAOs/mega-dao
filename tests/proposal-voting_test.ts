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
    const delegateWallet = accounts.get('wallet_1')!;
    const { delegate } = votingApi(chain, deployer);
    const { receipts: delegateReceipts } = chain.mineBlock([
      delegate(delegateWallet.address)
    ]);
    delegateReceipts[0].result.expectOk().expectBool(true);
    chain.mineEmptyBlockUntil(147);
    const { vote, getProposalData } = votingApi(chain, delegateWallet);
    const { receipts: voteReceipts } = chain.mineBlock([
      vote(
        true,
        PROPOSALS.TRANSFER_TOKENS,
        deployer.address,
      ),
    ]);
    voteReceipts[0].result.expectOk().expectBool(true);
    const proposal = getProposalData(PROPOSALS.TRANSFER_TOKENS).result;
    const event = voteReceipts[0].events[0].contract_event?.value
    assertEquals(event.expectTuple(), {
      amount: types.uint(100),
      delegate: types.some(delegateWallet.address),
      event: types.ascii('vote'),
      for: types.bool(true),
      proposal: PROPOSALS.TRANSFER_TOKENS,
      voter: deployer.address,
    })
    assertEquals(proposal.expectSome().expectTuple(), {
      votesFor: types.uint(100),
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
  name: 'Conclude and reject proposal',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const anotherVoter = accounts.get('wallet_1')!;
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
    chain.mineEmptyBlockUntil(147);
    const { vote, getProposalData } = votingApi(chain, deployer);
    const { receipts: voteReceipts } = chain.mineBlock([
      vote(
        true,
        PROPOSALS.TRANSFER_TOKENS,
        undefined,
      ),
    ]);
    voteReceipts[0].result.expectOk().expectBool(true);
    const { vote: anotherVote } = votingApi(chain, anotherVoter);
    const { receipts: anotherVoteReceipts } = chain.mineBlock([
      anotherVote(
        true,
        PROPOSALS.TRANSFER_TOKENS,
        undefined,
      ),
    ]);
    anotherVoteReceipts[0].result.expectOk().expectBool(true);
    assertEquals(getProposalData(PROPOSALS.TRANSFER_TOKENS).result.expectSome().expectTuple(), {
      votesFor: types.uint(15100),
      votesAgainst: types.uint(0),
      startBlockHeight: types.uint(validStartHeight),
      endBlockHeight: types.uint(866),
      concluded: types.bool(false),
      passed: types.bool(false),
      proposer: deployer.address,
    });
    chain.mineEmptyBlockUntil(1110);
    const { conclude } = votingApi(chain, deployer);
    const { receipts: concludeReceipts } = chain.mineBlock([
      conclude(
        PROPOSALS.TRANSFER_TOKENS,
      ),
    ]);
    concludeReceipts[0].result.expectOk().expectBool(false);
    assertEquals(getProposalData(PROPOSALS.TRANSFER_TOKENS).result.expectSome().expectTuple(), {
      votesFor: types.uint(15100),
      votesAgainst: types.uint(0),
      startBlockHeight: types.uint(validStartHeight),
      endBlockHeight: types.uint(866),
      concluded: types.bool(true),
      passed: types.bool(false),
      proposer: deployer.address,
    });
  },
});

Clarinet.test({
  name: 'Conclude and execute proposal',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    // TODO
  },
});