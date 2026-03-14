import { JsonRpcProvider, Wallet, ContractFactory } from 'ethers';
import fs from 'fs';

const rpc = process.env.ARB_SEPOLIA_RPC_URL;
const pk = process.env.DEPLOYER_PRIVATE_KEY;
if (!rpc || !pk) throw new Error('Missing ARB_SEPOLIA_RPC_URL or DEPLOYER_PRIVATE_KEY');

const v1 = process.env.VALIDATOR_1_ADDRESS;
const v2 = process.env.VALIDATOR_2_ADDRESS;
const v3 = process.env.VALIDATOR_3_ADDRESS;
const treasury = process.env.TREASURY_ADDRESS;
const reserve = process.env.RESERVE_ADDRESS;
if (!v1 || !v2 || !v3 || !treasury || !reserve) throw new Error('Missing addresses');

function loadArtifact(path) {
  return JSON.parse(fs.readFileSync(path, 'utf8'));
}

const provider = new JsonRpcProvider(rpc);
const wallet = new Wallet(pk, provider);
console.log('Deploying with:', wallet.address);

async function deploy(path, args=[]) {
  const a = loadArtifact(path);
  const f = new ContractFactory(a.abi, a.bytecode, wallet);
  const c = await f.deploy(...args);
  await c.waitForDeployment();
  return c;
}

const mock = await deploy('./artifacts/contracts/MockUSDC.sol/MockUSDC.json');
console.log('MockUSDC:', await mock.getAddress());

const agent = await deploy('./artifacts/contracts/AgentRegistry.sol/AgentRegistry.json');
console.log('AgentRegistry:', await agent.getAddress());

const validator = await deploy('./artifacts/contracts/ValidatorRegistry.sol/ValidatorRegistry.json', [[v1,v2,v3], ['Validator One','Validator Two','Validator Three'], [v1,v2,v3]]);
console.log('ValidatorRegistry:', await validator.getAddress());

const evalEngine = await deploy('./artifacts/contracts/EvaluationEngine.sol/EvaluationEngine.json');
console.log('EvaluationEngine:', await evalEngine.getAddress());

const audit = await deploy('./artifacts/contracts/AuditLog.sol/AuditLog.json');
console.log('AuditLog:', await audit.getAddress());

const feeVault = await deploy('./artifacts/contracts/FeeVault.sol/FeeVault.json', [await mock.getAddress(), treasury, reserve]);
console.log('FeeVault:', await feeVault.getAddress());
