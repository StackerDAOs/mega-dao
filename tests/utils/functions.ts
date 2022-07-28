import { Chain, ReadOnlyFn } from './deps.ts';
import { CONTRACTS } from './constants.ts';

export const callReadOnlyFn = (
  chain: Chain,
  contractName: string,
  method: string,
  args: Array<any> = [],
  address: string,
): ReadOnlyFn => {
  const result = chain.callReadOnlyFn(
    contractName,
    method,
    args,
    address,
  );

  return result;
}