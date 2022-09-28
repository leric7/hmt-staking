import path from "path";
import fs from "fs";
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
// @ts-ignore
import { accounts } from "./test-wallets.js";

require(`${path.join(__dirname, "tasks")}/misc.ts`);
require(`${path.join(__dirname, "tasks")}/full.ts`);

const BUIDLEREVM_CHAINID = 31337;

const config: HardhatUserConfig = {
  solidity: "0.6.2",
  networks: {
    localhost: {
      hardfork: "london",
      url: "http://localhost:8545",
      chainId: BUIDLEREVM_CHAINID,
      // accounts: accounts.map(
      //   ({ secretKey, balance }: { secretKey: string; balance: string }) =>
      //     secretKey
      // ),
    },
  },
};

export default config;
