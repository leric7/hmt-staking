import { task } from "hardhat/config";
import { BigNumber } from "ethers";

const toDecimal = (amount: number, decimal: number = 18) => {
  return BigNumber.from(10).pow(decimal).mul(amount);
};

task("deploy:full", "Deploy full environment").setAction(async (_, HRE) => {
  await HRE.run("set-HRE");

  // Deploy HMT Token
  const HMTTokenFactory = await HRE.ethers.getContractFactory("HMTToken");
  const tokenHMT = await HMTTokenFactory.deploy("HMT Token", "HMT");
  console.log(`HMT Token: ${tokenHMT.address}`);

  const apiOperator = (await HRE.ethers.getSigners())[1];
  await tokenHMT.connect(apiOperator).mint(toDecimal(10000));

  // Deploy Reward Pool
  const RewardPoolFactory = await HRE.ethers.getContractFactory("RewardPool");
  const rewardPool = await RewardPoolFactory.deploy(tokenHMT.address);
  console.log(`Reward Pool: ${rewardPool.address}`);

  // Deploy Staking
  const StakingFactory = await HRE.ethers.getContractFactory("Staking");
  const staking = await StakingFactory.deploy(
    tokenHMT.address,
    rewardPool.address
  );
  console.log(`Staking: ${staking.address}`);

  // Deploy Governance
  const GovernanceFactory = await HRE.ethers.getContractFactory("Governance");
  const governance = await GovernanceFactory.deploy(staking.address);
  console.log(`Governance: ${governance.address}`);

  // Configure Staking with Governance
  await staking.setGovernance(governance.address);

  // Deploy Escrow Factory
  const EscrowFactoryFactory = await HRE.ethers.getContractFactory(
    "EscrowFactory"
  );
  const escrowFactory = await EscrowFactoryFactory.deploy(
    tokenHMT.address,
    staking.address
  );
  console.log(`Escrow Factory: ${escrowFactory.address}`);
});
