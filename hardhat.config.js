import '@nomicfoundation/hardhat-ethers';
import dotenv from 'dotenv';
dotenv.config();

const networks = {};
if (process.env.ARB_SEPOLIA_RPC_URL) {
  networks.arbitrumSepolia = {
    type: 'http',
    url: process.env.ARB_SEPOLIA_RPC_URL,
    accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
    chainId: 421614,
  };
}

export default {
  solidity: '0.8.24',
  networks,
};
