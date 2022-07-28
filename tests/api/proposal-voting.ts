import { 
  Account,
  Chain,
  Tx,
  types,
} from '../utils/deps.ts';
import { EXTENSIONS } from '../utils/constants.ts';
import { callReadOnlyFn } from '../utils/functions.ts';

const call = (method: string, args: any[], address: string) => {
  return Tx.contractCall('proposal-voting', method, args, address)
};

export const votingApi = (chain: Chain, { address }: Account) => ({
  delegate: (who: string) => call('delegate', [types.principal(who)], address),
  vote: (vote: any, proposal: any, delegator: any) =>
    call(
      'vote',
      [
        types.bool(vote),
        types.principal(proposal),
        delegator ? types.some(types.principal(delegator)) : types.none(),
      ],
      address,
    ),
    getVotingPower: (voter: any, blockHeight: any) =>
    callReadOnlyFn(
      chain,
      EXTENSIONS.VOTING,
      'get-voting-power',
      [
        types.principal(voter),
        types.uint(blockHeight),
      ],
      address
    ),
  getCurrentVotes: (proposal: any, voter: any, governanceContract: any) =>
    callReadOnlyFn(
      chain,
      EXTENSIONS.VOTING,
      'get-current-total-votes',
      [
        types.principal(proposal),
        types.principal(voter),
        types.principal(governanceContract)
      ],
      address
    ),
  getProposalData: (proposal: any) =>
    callReadOnlyFn(
      chain,
      EXTENSIONS.VOTING,
      'get-proposal-data',
      [
        types.principal(proposal),
      ],
      address
    ),
  conclude: (proposal: any) =>
    call('conclude', [types.principal(proposal)], address),
});