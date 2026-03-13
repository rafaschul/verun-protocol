import { network } from 'hardhat';

async function main() {
  const { ethers } = await network.connect();
  const [deployer] = await ethers.getSigners();
  console.log('Deploying with:', deployer.address);

  const v1 = process.env.VALIDATOR_1_ADDRESS;
  const v2 = process.env.VALIDATOR_2_ADDRESS;
  const v3 = process.env.VALIDATOR_3_ADDRESS;

  if (!v1 || !v2 || !v3) {
    throw new Error('Missing VALIDATOR_1_ADDRESS / VALIDATOR_2_ADDRESS / VALIDATOR_3_ADDRESS');
  }

  const MockUSDC = await ethers.deployContract('MockUSDC');
  await MockUSDC.waitForDeployment();
  console.log('MockUSDC:', await MockUSDC.getAddress());

  const AgentRegistry = await ethers.deployContract('AgentRegistry');
  await AgentRegistry.waitForDeployment();
  console.log('AgentRegistry:', await AgentRegistry.getAddress());

  const ValidatorRegistry = await ethers.deployContract('ValidatorRegistry', [[v1, v2, v3]]);
  await ValidatorRegistry.waitForDeployment();
  console.log('ValidatorRegistry:', await ValidatorRegistry.getAddress());

  const EvaluationEngine = await ethers.deployContract('EvaluationEngine');
  await EvaluationEngine.waitForDeployment();
  console.log('EvaluationEngine:', await EvaluationEngine.getAddress());

  const AuditLog = await ethers.deployContract('AuditLog');
  await AuditLog.waitForDeployment();
  console.log('AuditLog:', await AuditLog.getAddress());

  const treasury = process.env.TREASURY_ADDRESS || deployer.address;
  const feeAmount = process.env.FEE_AMOUNT_WEI || '1000';
  const FeeVault = await ethers.deployContract('FeeVault', [await MockUSDC.getAddress(), treasury, feeAmount]);
  await FeeVault.waitForDeployment();
  console.log('FeeVault:', await FeeVault.getAddress());

  console.log('\n✅ All contracts deployed on Arbitrum Sepolia');
  console.log('Explorer: https://sepolia.arbiscan.io');
}

main().catch(console.error);
