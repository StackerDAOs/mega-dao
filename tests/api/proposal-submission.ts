import { 
  Account,
  Chain,
  Tx,
  types,
} from '../utils/deps.ts';
import { EXTENSIONS } from '../utils/constants.ts';
import { callReadOnlyFn } from '../utils/functions.ts';

const call = (method: string, args: any[], address: string) => {
  return Tx.contractCall('proposal-submission', method, args, address)
};

export const submissionApi = (chain: Chain, { address }: Account) => ({
  propose: (proposal: any, startBlockHeight: any) =>
    call(
      'propose',
      [
        types.principal(proposal),
        types.uint(startBlockHeight),
      ],
      address,
    ),
    canPropose: (who: any, tokenThreshold: any) =>
    callReadOnlyFn(
      chain,
      EXTENSIONS.SUBMISSION,
      'can-propose',
      [
        types.principal(who),
        types.uint(tokenThreshold),
      ],
      address
    ),
  setParameter: (parameter: any, value: any) =>
    call('set-parameter', [types.ascii(parameter), types.bool(value)], address),
  getParameter: (parameter: any) =>
    callReadOnlyFn(
      chain,
      EXTENSIONS.SUBMISSION,
      'get-parameter',
      [types.ascii(parameter)],
      address
    ),
});