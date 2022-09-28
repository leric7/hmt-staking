import { ethers, Contract, Wallet } from "ethers";

import config from "../config";

/*******************************************
 *                Ethers.js                *
 *******************************************/

// Network & Provider
export const network = config.ethers.network;

export const provider = new ethers.providers.JsonRpcProvider(
  config.ethers.providerURL
);

// Contracts
export const stakingContract = new Contract(
  config.protocol.address.staking,
  config.protocol.abi.staking,
  provider
);

export const escrowFactoryContract = new Contract(
  config.protocol.address.escrowFactory,
  config.protocol.abi.escrowFactory,
  provider
);

export const hmtTokenContract = new Contract(
  config.protocol.address.hmtToken,
  config.protocol.abi.erc20,
  provider
)

export const operator = new Wallet(config.protocol.operatorKey, provider);

export const launcher = new Wallet(config.protocol.launcherKey, provider);
