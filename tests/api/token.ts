import { 
  Account,
  Chain,
  Tx,
  types,
} from '../utils/deps.ts';

const call = (method: string, args: any[], address: string) => {
  return Tx.contractCall('token', method, args, address)
};

export const tokenApi = (chain: Chain, { address }: Account) => ({
  transfer: (amount: any, sender: any, recipient: any) =>
    call(
      'transfer',
      [
        types.uint(amount),
        types.principal(sender),
        types.principal(recipient),
        types.none(),
      ],
      address,
    ),
});