import { expect } from "chai";
import { Signer, BigNumber } from "ethers";
import { ethers, network } from "hardhat";
import {
  EscrowFactory,
  Governance,
  HMTToken,
  RewardPool,
  Staking,
} from "../typechain-types";

const toDecimal = (amount: number, decimal: number = 18) => {
  return BigNumber.from(10).pow(decimal).mul(amount);
};

describe("e2e", function () {
  let alice: Signer;
  let bob: Signer;
  let carol: Signer;

  let validator1: Signer;
  let validator2: Signer;
  let validator3: Signer;

  let launcher1: Signer;

  let tokenHMT: HMTToken;
  let rewardPool: RewardPool;
  let staking: Staking;
  let governance: Governance;
  let escrowFactory: EscrowFactory;

  beforeEach(async () => {
    [, alice, bob, carol, validator1, validator2, validator3, launcher1] =
      await ethers.getSigners();

    // Deploy HMT Token
    const HMTTokenFactory = await ethers.getContractFactory("HMTToken");
    tokenHMT = await HMTTokenFactory.deploy("HMT Token", "HMT");

    // Mint 10000 HMT Token for each signer
    [alice, bob, carol, validator1, validator2, validator3, launcher1].forEach(
      async (signer) => {
        await tokenHMT.connect(signer).mint(toDecimal(10000));
      }
    );

    // Deploy Reward Pool
    const RewardPoolFactory = await ethers.getContractFactory("RewardPool");
    rewardPool = await RewardPoolFactory.deploy(tokenHMT.address);

    // Deploy Staking
    const StakingFactory = await ethers.getContractFactory("Staking");
    staking = await StakingFactory.deploy(tokenHMT.address, rewardPool.address);

    // Deploy Governance
    const GovernanceFactory = await ethers.getContractFactory("Governance");
    governance = await GovernanceFactory.deploy(staking.address);

    // Configure Staking with Governance
    await staking.setGovernance(governance.address);

    // Deploy Escrow Factory
    const EscrowFactoryFactory = await ethers.getContractFactory(
      "EscrowFactory"
    );
    escrowFactory = await EscrowFactoryFactory.deploy(
      tokenHMT.address,
      staking.address
    );
  });

  const stake = async (staker: Signer, amount: BigNumber) => {
    await tokenHMT.connect(staker).approve(staking.address, amount);
    await staking.connect(staker).stake(amount);
  };

  const unstake = async (staker: Signer, amount: BigNumber) => {
    await tokenHMT.connect(staker).approve(staking.address, amount);
    await staking.connect(staker).unstake(amount);
  };

  describe("Staking", () => {
    it("Alice can stake 10 HMT", async () => {
      await stake(alice, toDecimal(10));

      expect(
        await (await staking.amountStaked(await alice.getAddress())).toString()
      ).to.equal(toDecimal(10).toString());
    });
    it("Alice can stake another 10 HMT", async () => {
      await stake(alice, toDecimal(10));

      await stake(alice, toDecimal(10));

      expect(
        await (await staking.amountStaked(await alice.getAddress())).toString()
      ).to.equal(toDecimal(20).toString());
    });
    it("Alice can unstake 5 HMT", async () => {
      await stake(alice, toDecimal(10));

      await unstake(alice, toDecimal(5));

      expect(
        await (await staking.amountStaked(await alice.getAddress())).toString()
      ).to.equal(toDecimal(5).toString());
    });
    it("Alice is not a validator by staking 10 HMT", async () => {
      await stake(alice, toDecimal(10));

      expect(await staking.isValidator(await alice.getAddress())).to.equal(
        false
      );
    });
    it("Alice is a validator by staking 1000 HMT", async () => {
      await stake(alice, toDecimal(1000));

      expect(await staking.isValidator(await alice.getAddress())).to.equal(
        true
      );
    });
    it("Alice can't slash Bob's staking", async () => {
      await stake(alice, toDecimal(1000));
      await stake(bob, toDecimal(1000));

      await expect(
        staking.connect(alice).slash(await bob.getAddress(), toDecimal(500))
      ).to.be.revertedWith("not governance call");
    });
  });
  describe("Governance", () => {
    it("Alice can't create proposal", async () => {
      await expect(
        governance
          .connect(alice)
          .createSlashProposal(await bob.getAddress(), toDecimal(500))
      ).to.be.revertedWith("only owner");
    });
    it("Can't create invalid proposal", async () => {
      await expect(
        governance.createSlashProposal(await bob.getAddress(), toDecimal(500))
      ).to.be.revertedWith("invalid proposal");
    });
    it("Owner can create proposal", async () => {
      await stake(bob, toDecimal(1000));
      expect(
        await governance.createSlashProposal(
          await bob.getAddress(),
          toDecimal(500)
        )
      )
        .to.emit(governance, "SlashProposalCreated")
        .withArgs(await bob.getAddress(), toDecimal(500));

      const proposal = await governance.proposals(0);
      expect(proposal.user).to.equal(await bob.getAddress());
      expect(proposal.amount).to.equal(toDecimal(500));
      expect(proposal.amountTotalVoted).to.equal(0);
      expect(proposal.amountUpVoted).to.equal(0);
      expect(proposal.finished).to.equal(false);
    });
    it("Alice can't vote against proposal, cause she's not a validator", async () => {
      await stake(alice, toDecimal(500));
      await stake(bob, toDecimal(1000));

      await governance.createSlashProposal(
        await bob.getAddress(),
        toDecimal(500)
      );

      await expect(
        governance.connect(alice).voteSlashProposal(0, true)
      ).to.be.revertedWith("only validator");
    });
    it("Alice can vote against proposal, once she's a validator", async () => {
      await stake(alice, toDecimal(1000));
      await stake(bob, toDecimal(1000));

      await governance.createSlashProposal(
        await bob.getAddress(),
        toDecimal(500)
      );

      expect(await governance.connect(alice).voteSlashProposal(0, true))
        .to.emit(governance, "SlashProposalVoted")
        .withArgs(0, await alice.getAddress(), true);

      const proposal = await governance.proposals(0);
      expect(proposal.user).to.equal(await bob.getAddress());
      expect(proposal.amount).to.equal(toDecimal(500));
      expect(proposal.amountTotalVoted).to.equal(1);
      expect(proposal.amountUpVoted).to.equal(1);
      expect(proposal.finished).to.equal(false);
    });
    it("Carol can vote against proposal, once she's a validator", async () => {
      await stake(alice, toDecimal(1000));
      await stake(carol, toDecimal(1000));
      await stake(bob, toDecimal(1000));

      await governance.createSlashProposal(
        await bob.getAddress(),
        toDecimal(500)
      );

      expect(await governance.connect(alice).voteSlashProposal(0, true))
        .to.emit(governance, "SlashProposalVoted")
        .withArgs(0, await alice.getAddress(), true);

      expect(await governance.connect(carol).voteSlashProposal(0, false))
        .to.emit(governance, "SlashProposalVoted")
        .withArgs(0, await carol.getAddress(), false);

      const proposal = await governance.proposals(0);
      expect(proposal.user).to.equal(await bob.getAddress());
      expect(proposal.amount).to.equal(toDecimal(500));
      expect(proposal.amountTotalVoted).to.equal(2);
      expect(proposal.amountUpVoted).to.equal(1);
      expect(proposal.finished).to.equal(false);
    });
    it("Alice can't finish vote", async () => {
      await stake(alice, toDecimal(1000));
      await stake(bob, toDecimal(1000));

      await governance.createSlashProposal(
        await bob.getAddress(),
        toDecimal(500)
      );

      await expect(
        governance.connect(alice).finishSlashProposal(0)
      ).to.be.revertedWith("only owner");
    });
    it("Owner can finish vote", async () => {
      await stake(alice, toDecimal(1000));
      await stake(bob, toDecimal(1000));

      await governance.createSlashProposal(
        await bob.getAddress(),
        toDecimal(500)
      );

      expect(await governance.finishSlashProposal(0))
        .to.emit(governance, "SlashProposalFinished")
        .withArgs(0);
    });
    it("Owner can't finish finished vote", async () => {
      await stake(alice, toDecimal(1000));
      await stake(bob, toDecimal(1000));

      await governance.createSlashProposal(
        await bob.getAddress(),
        toDecimal(500)
      );

      await governance.finishSlashProposal(0);

      await expect(governance.finishSlashProposal(0)).to.be.revertedWith(
        "vote finished"
      );
    });
    it("Alice can't vote against finished vote", async () => {
      await stake(alice, toDecimal(1000));
      await stake(bob, toDecimal(1000));

      await governance.createSlashProposal(
        await bob.getAddress(),
        toDecimal(500)
      );

      await governance.finishSlashProposal(0);

      await expect(
        governance.connect(alice).voteSlashProposal(0, true)
      ).to.be.revertedWith("vote finished");
    });
  });
  describe("Staking & Governance & Reward Pool", () => {
    it("Bob's staking can be slashed by governance, and moved to reward pool", async () => {
      await stake(alice, toDecimal(1000));
      await stake(bob, toDecimal(1000));

      await stake(validator1, toDecimal(1000));
      await stake(validator2, toDecimal(1000));
      await stake(validator3, toDecimal(1000));

      await governance.createSlashProposal(
        await bob.getAddress(),
        toDecimal(500)
      );
      await governance.connect(validator1).voteSlashProposal(0, true);
      await governance.connect(validator2).voteSlashProposal(0, true);
      await governance.connect(validator3).voteSlashProposal(0, true);
      expect(await governance.finishSlashProposal(0))
        .to.emit(staking, "StakeSlashed")
        .withArgs(await bob.getAddress(), toDecimal(500));

      expect(
        await (await staking.amountStaked(await bob.getAddress())).toString()
      ).to.equal(toDecimal(500).toString());

      expect(await rewardPool.getBalance()).to.equal(toDecimal(500));
    });

    it("Bob's staking should not be slashed, when rejected by governance", async () => {
      await stake(alice, toDecimal(1000));
      await stake(bob, toDecimal(1000));

      await stake(validator1, toDecimal(1000));
      await stake(validator2, toDecimal(1000));
      await stake(validator3, toDecimal(1000));

      await governance.createSlashProposal(
        await bob.getAddress(),
        toDecimal(500)
      );
      await governance.connect(validator1).voteSlashProposal(0, true);
      await governance.connect(validator2).voteSlashProposal(0, false);
      await governance.connect(validator3).voteSlashProposal(0, false);
      await governance.finishSlashProposal(0);

      expect(
        await (await staking.amountStaked(await bob.getAddress())).toString()
      ).to.equal(toDecimal(1000).toString());
    });
  });

  describe("Escrow Factory", () => {
    it("can't create escrow before staking HMT", async () => {
      await expect(
        escrowFactory
          .connect(launcher1)
          .createEscrow([await carol.getAddress()])
      ).to.be.revertedWith("not staked HMT");
    });

    it("can create escrow after staking HMT", async () => {
      await stake(launcher1, toDecimal(10));

      expect(
        await escrowFactory
          .connect(launcher1)
          .createEscrow([await alice.getAddress()])
      ).to.emit(escrowFactory, "Launched");
    });

    it("can't create escrow after slashed by validators", async () => {
      await stake(launcher1, toDecimal(10));

      await stake(validator1, toDecimal(1000));
      await stake(validator2, toDecimal(1000));
      await stake(validator3, toDecimal(1000));

      await governance.createSlashProposal(
        await launcher1.getAddress(),
        toDecimal(10)
      );
      await governance.connect(validator1).voteSlashProposal(0, true);
      await governance.connect(validator1).voteSlashProposal(0, true);
      await governance.connect(validator1).voteSlashProposal(0, true);
      await governance.finishSlashProposal(0);

      await expect(
        escrowFactory
          .connect(launcher1)
          .createEscrow([await alice.getAddress()])
      ).to.be.revertedWith("not staked HMT");
    });
  });
});
