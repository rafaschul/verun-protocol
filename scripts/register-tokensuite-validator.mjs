import 'dotenv/config';
import { JsonRpcProvider, Wallet, Contract } from 'ethers';

const RPC_URL = process.env.BASE_SEPOLIA_RPC_URL;
const OWNER_PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY;
const VALIDATOR_REGISTRY_ADDRESS = process.env.VALIDATOR_REGISTRY_ADDRESS || '0x838EEf0E97D6c4b5dAd520c662f0cA80c1549fAA';
const TOKENSUITE_REVENUE_WALLET = process.env.TOKENSUITE_WALLET;

if (!RPC_URL) throw new Error('BASE_SEPOLIA_RPC_URL missing');
if (!OWNER_PRIVATE_KEY) throw new Error('DEPLOYER_PRIVATE_KEY missing');
if (!TOKENSUITE_REVENUE_WALLET) {
  throw new Error('TOKENSUITE_WALLET missing (must be a real EVM address)');
}

const provider = new JsonRpcProvider(RPC_URL);
const owner = new Wallet(OWNER_PRIVATE_KEY, provider);

const validatorRegistryAbi = [
  'function addValidator(address v, string name, address revenueWallet) external',
  'function validators(address) view returns (tuple(string name,address validatorAddress,address revenueWallet,uint256 totalEarned,uint256 userCount,bool active))',
  'event ValidatorAdded(address indexed validator, string name, address revenueWallet)'
];

const validatorRegistry = new Contract(VALIDATOR_REGISTRY_ADDRESS, validatorRegistryAbi, owner);

async function main() {
  const name = 'TokenForge TokenSuite';

  const tx = await validatorRegistry.addValidator(
    TOKENSUITE_REVENUE_WALLET,
    name,
    TOKENSUITE_REVENUE_WALLET,
    { gasLimit: 400000 }
  );
  await tx.wait(1);

  console.log('═══════════════════════════════════════');
  console.log('TokenForge TokenSuite Validator registered');
  console.log('Name:', name);
  console.log('Revenue wallet:', TOKENSUITE_REVENUE_WALLET);
  console.log('Revenue share: 10% of all evaluations');
  console.log('BaseScan tx:', `https://sepolia.basescan.org/tx/${tx.hash}`);
  console.log('═══════════════════════════════════════');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
