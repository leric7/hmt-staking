import { Request, Response } from "express";
import logger from "../common/logger";
import {
  escrowFactoryContract,
  hmtTokenContract,
  launcher,
  operator,
  stakingContract,
} from "../utils/ethers";

export const stake = async (req: Request, res: Response) => {
  try {
    const { amount } = req.body;

    await hmtTokenContract
      .connect(operator)
      .approve(stakingContract.address, amount);
    await stakingContract.connect(operator).stake(amount);

    const data = {
      statusCode: 200,
      body: {
        success: true,
        message: "Staked successfully",
        data: {
          amount,
        },
      },
    };

    res.status(data.statusCode).send(data.body);
  } catch (e: any) {
    logger.error(e.message);

    res.status(500).send({
      success: false,
      message: e.message,
    });
  }
};

export const escrow = async (req: Request, res: Response) => {
  try {
    const { trustedHandlers } = req.body;

    await escrowFactoryContract.connect(operator).createEscrow(trustedHandlers);

    const data = {
      statusCode: 200,
      body: {
        success: true,
        message: "Created escrow successfully",
        data: {
          trustedHandlers,
        },
      },
    };

    res.status(data.statusCode).send(data.body);
  } catch (e: any) {
    logger.error(e.message);

    res.status(500).send({
      success: false,
      message: e.message,
    });
  }
};
