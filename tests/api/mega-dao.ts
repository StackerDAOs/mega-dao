import { 
  Account,
  Chain,
  ReadOnlyFn,
  Tx,
  types,
} from '../utils/deps.ts';
import { CONTRACTS } from '../utils/constants.ts';
import { callReadOnlyFn } from '../utils/functions.ts';

const call = (method: string, args: Array<any> = [], address: string) => {
  return Tx.contractCall('mega-dao', method, args, address)
};

export const daoApi = (chain: Chain, { address }: Account) => ({
  init: (proposal: any) =>
    call('init', [types.principal(proposal)], address),
  isExtension: (extension: any) =>
    callReadOnlyFn(chain, CONTRACTS.MEGA_DAO, 'is-extension', [types.principal(extension)], address),
  setExtension: (extension: any, enabled: any) =>
    call('set-extension', [types.principal(extension), types.bool(enabled)], address),
  execute: (proposal: any) =>
    call('execute', [types.principal(proposal)], address),
  executedAt: (proposal: any) =>
    callReadOnlyFn(chain, CONTRACTS.MEGA_DAO, 'executed-at', [types.principal(proposal)], address),
});