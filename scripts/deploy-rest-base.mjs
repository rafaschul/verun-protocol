import { JsonRpcProvider, Wallet, ContractFactory } from 'ethers';
import fs from 'fs';

const rpc = process.env.BASE_SEPOLIA_RPC_URL || process.env.ARB_SEPOLIA_RPC_URL;
const pk = process.env.DEPLOYER_PRIVATE_KEY;
const mockAddress = process.env.MOCK_USDC_ADDRESS;
if (!rpc || !pk || !mockAddress) throw new Error('Missing rpc/pk/mock');

const v1 = process.env.VALIDATOR_1_ADDRESS;
const v2 = process.env.VALIDATOR_2_ADDRESS;
const v3 = process.env.VALIDATOR_3_ADDRESS;
const treasury = process.env.TREASURY_ADDRESS;
const reserve = process.env.RESERVE_ADDRESS;
if (!v1 || !v2 || !v3 || !treasury || !reserve) throw new Error('Missing addresses');

function loadArtifact(path) { return JSON.parse(fs.readFileSync(path, 'utf8')); }

const provider = new JsonRpcProvider(rpc);
const wallet = new Wallet(pk, provider);
console.log('Deploying with:', wallet.address);

let nonce = await provider.getTransactionCount(wallet.address, 'latest');
console.log('Starting nonce:', nonce);

async function deploy(path, args=[]) {
  const a = loadArtifact(path);
  const f = new ContractFactory(a.abi, a.bytecode, wallet);
  const fee = await provider.getFeeData();
  const txOpts = {
    nonce: nonce++,
    maxFeePerGas: fee.maxFeePerGas ? fee.maxFeePerGas * 2n : undefined,
    maxPriorityFeePerGas: fee.maxPriorityFeePerGas ? fee.maxPriorityFeePerGas * 2n : undefined,
  };
  const c = await f.deploy(...args, txOpts);
  await c.deploymentTransaction().wait(1);
  return c;
}

console.log('MockUSDC (existing):', mockAddress);
const agent = await deploy('./artifacts/contracts/AgentRegistry.sol/AgentRegistry.json');
console.log('AgentRegistry:', await agent.getAddress());

const validator = await deploy('./artifacts/contracts/ValidatorRegistry.sol/ValidatorRegistry.json', [[v1,v2,v3], ['Validator One','Validator Two','Validator Three'], [v1,v2,v3]]);
console.log('ValidatorRegistry:', await validator.getAddress());

const evalEngine = await deploy('./artifacts/contracts/EvaluationEngine.sol/EvaluationEngine.json');
console.log('EvaluationEngine:', await evalEngine.getAddress());

const audit = await deploy('./artifacts/contracts/AuditLog.sol/AuditLog.json');
console.log('AuditLog:', await audit.getAddress());

const feeVault = await deploy('./artifacts/contracts/FeeVault.sol/FeeVault.json', [mockAddress, treasury, reserve]);
console.log('FeeVault:', await feeVault.getAddress());
