import * as dotenv from "dotenv";

import { abi as EscrowFactoryABI } from "../artifacts/contracts/EscrowFactory.sol/EscrowFactory.json";
import { abi as StakingABI } from "../artifacts/contracts/Staking.sol/Staking.json";
import { abi as ERC20ABI } from "../artifacts/@openzeppelin/contracts/token/ERC20/ERC20.sol/ERC20.json";

dotenv.config();

export default {
  ethers: {
    network: process.env.NETWORK,
    providerURL: process.env.PROVIDER_URL
  },
  protocol: {
    address: {
      escrowFactory: process.env.ESCROW_FACTORY_ADDRESS || "",
      staking: process.env.STAKING_ADDRESS || "",
      hmtToken: process.env.HMT_TOKEN_ADDRESS || "",
    },
    abi: {
      escrowFactory: EscrowFactoryABI,
      staking: StakingABI,
      erc20: ERC20ABI,
    },
    operatorKey: process.env.OPERATOR_KEY || "",
    launcherKey: process.env.LAUNCHER_KEY || "",
  },
  api: {
    operatorKey: process.env.API_KEY_OPERATOR,
  },
};
