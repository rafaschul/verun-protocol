import { ethers } from 'hardhat';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log('Deployer:', deployer.address);

  const v1 = process.env.VALIDATOR_1 || deployer.address;
  const v2 = process.env.VALIDATOR_2 || deployer.address;
  const v3 = process.env.VALIDATOR_3 || deployer.address;

  const AgentRegistry = await ethers.getContractFactory('AgentRegistry');
  const agentRegistry = await AgentRegistry.deploy();
  await agentRegistry.waitForDeployment();

  const ValidatorRegistry = await ethers.getContractFactory('ValidatorRegistry');
  const validatorRegistry = await ValidatorRegistry.deploy([v1, v2, v3]);
  await validatorRegistry.waitForDeployment();

  const EvaluationEngine = await ethers.getContractFactory('EvaluationEngine');
  const evaluationEngine = await EvaluationEngine.deploy();
  await evaluationEngine.waitForDeployment();

  const AuditLog = await ethers.getContractFactory('AuditLog');
  const auditLog = await AuditLog.deploy();
  await auditLog.waitForDeployment();

  const usdc = process.env.USDC_TESTNET_ADDRESS || '0x0000000000000000000000000000000000000000';
  const treasury = process.env.TREASURY_ADDRESS || deployer.address;
  const feeAmount = process.env.FEE_AMOUNT_WEI || '1000';

  const FeeVault = await ethers.getContractFactory('FeeVault');
  const feeVault = await FeeVault.deploy(usdc, treasury, feeAmount);
  await feeVault.waitForDeployment();

  console.log('AgentRegistry:', await agentRegistry.getAddress());
  console.log('ValidatorRegistry:', await validatorRegistry.getAddress());
  console.log('EvaluationEngine:', await evaluationEngine.getAddress());
  console.log('AuditLog:', await auditLog.getAddress());
  console.log('FeeVault:', await feeVault.getAddress());
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
