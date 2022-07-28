import { 
  Account,
  assertEquals,
  Clarinet,
  Chain,
  Tx,
  types,
} from './utils/deps.ts';
import { BOOTSTRAPS, EXTENSIONS, MEGA_DAO_CODES } from './utils/constants.ts';
import { daoApi } from './api/index.ts';

Clarinet.test({
  name: 'Initialize DAO',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const { init, isExtension } = daoApi(chain, deployer);
    const { receipts } = chain.mineBlock([
      init(BOOTSTRAPS.MEGA_DAO),
    ])
    receipts[0].result.expectOk().expectBool(true);
    isExtension(EXTENSIONS.VAULT).result.expectBool(true);
    isExtension(EXTENSIONS.SUBMISSION).result.expectBool(true);
    isExtension(EXTENSIONS.VOTING).result.expectBool(true);
  },
});

Clarinet.test({
  name: 'Reject duplicate initialization',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const { init } = daoApi(chain, deployer);
    const { receipts } = chain.mineBlock([
      init(BOOTSTRAPS.MEGA_DAO),
      init(BOOTSTRAPS.MEGA_DAO),
    ])
    receipts[0].result.expectOk().expectBool(true);
    receipts[1].result.expectErr().expectUint(MEGA_DAO_CODES.ERR_UNAUTHORIZED);
  },
});
