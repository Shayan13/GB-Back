import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../utils/appError';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export const getWalletBalance = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;

    const [goldWallet, moneyWallet] = await Promise.all([
      prisma.goldWallet.findUnique({ where: { userId } }),
      prisma.moneyWallet.findUnique({ where: { userId } })
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        goldBalance: goldWallet?.balance || 0,
        moneyBalance: moneyWallet?.balance || 0
      }
    });
  } catch (error) {
    next(error);
  }
};

export const buyGold = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;
    const { amount, currentGoldPrice } = req.body;
    const totalCost = amount * currentGoldPrice;

    const transaction = await prisma.$transaction(async (prisma) => {
      const moneyWallet = await prisma.moneyWallet.findUnique({
        where: { userId }
      });

      if (!moneyWallet || moneyWallet.balance < totalCost) {
        throw new AppError('Insufficient funds in money wallet', 400);
      }

      // Update money wallet
      await prisma.moneyWallet.update({
        where: { userId },
        data: { balance: { decrement: totalCost } }
      });

      // Update gold wallet
      await prisma.goldWallet.update({
        where: { userId },
        data: { balance: { increment: amount } }
      });

      // Create transaction record
      return prisma.transaction.create({
        data: {
          type: 'BUY_GOLD',
          senderId: userId,
          amount,
          assetType: 'GOLD',
          status: 'COMPLETED',
          description: `Bought ${amount}g of gold at ${currentGoldPrice} per gram`
        }
      });
    });

    res.status(200).json({
      status: 'success',
      data: { transaction }
    });
  } catch (error) {
    next(error);
  }
};

export const sellGold = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;
    const { amount, currentGoldPrice } = req.body;
    const totalValue = amount * currentGoldPrice;

    const transaction = await prisma.$transaction(async (prisma) => {
      const goldWallet = await prisma.goldWallet.findUnique({
        where: { userId }
      });

      if (!goldWallet || goldWallet.balance < amount) {
        throw new AppError('Insufficient gold balance', 400);
      }

      // Update gold wallet
      await prisma.goldWallet.update({
        where: { userId },
        data: { balance: { decrement: amount } }
      });

      // Update money wallet
      await prisma.moneyWallet.update({
        where: { userId },
        data: { balance: { increment: totalValue } }
      });

      // Create transaction record
      return prisma.transaction.create({
        data: {
          type: 'SELL_GOLD',
          senderId: userId,
          amount,
          assetType: 'GOLD',
          status: 'COMPLETED',
          description: `Sold ${amount}g of gold at ${currentGoldPrice} per gram`
        }
      });
    });

    res.status(200).json({
      status: 'success',
      data: { transaction }
    });
  } catch (error) {
    next(error);
  }
};

export const depositMoney = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;
    const { amount, bankAccountId } = req.body;

    // Verify bank account belongs to user
    const bankAccount = await prisma.bankAccount.findFirst({
      where: {
        id: bankAccountId,
        userId,
        isVerified: true
      }
    });

    if (!bankAccount) {
      throw new AppError('Invalid or unverified bank account', 400);
    }

    const transaction = await prisma.$transaction(async (prisma) => {
      // Update money wallet
      await prisma.moneyWallet.update({
        where: { userId },
        data: { balance: { increment: amount } }
      });

      // Create transaction record
      return prisma.transaction.create({
        data: {
          type: 'DEPOSIT',
          senderId: userId,
          amount,
          assetType: 'MONEY',
          status: 'COMPLETED',
          description: `Deposit from bank account ${bankAccount.accountNumber}`
        }
      });
    });

    res.status(200).json({
      status: 'success',
      data: { transaction }
    });
  } catch (error) {
    next(error);
  }
};

export const withdrawMoney = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;
    const { amount, bankAccountId } = req.body;

    // Verify bank account belongs to user
    const bankAccount = await prisma.bankAccount.findFirst({
      where: {
        id: bankAccountId,
        userId,
        isVerified: true
      }
    });

    if (!bankAccount) {
      throw new AppError('Invalid or unverified bank account', 400);
    }

    const transaction = await prisma.$transaction(async (prisma) => {
      const moneyWallet = await prisma.moneyWallet.findUnique({
        where: { userId }
      });

      if (!moneyWallet || moneyWallet.balance < amount) {
        throw new AppError('Insufficient funds', 400);
      }

      // Update money wallet
      await prisma.moneyWallet.update({
        where: { userId },
        data: { balance: { decrement: amount } }
      });

      // Create transaction record
      return prisma.transaction.create({
        data: {
          type: 'WITHDRAW',
          senderId: userId,
          amount,
          assetType: 'MONEY',
          status: 'COMPLETED',
          description: `Withdrawal to bank account ${bankAccount.accountNumber}`
        }
      });
    });

    res.status(200).json({
      status: 'success',
      data: { transaction }
    });
  } catch (error) {
    next(error);
  }
};

export const transferFunds = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const senderId = req.user!.id;
    const { receiverPhone, amount, assetType } = req.body;

    const receiver = await prisma.user.findUnique({
      where: { phoneNumber: receiverPhone }
    });

    if (!receiver) {
      throw new AppError('Receiver not found', 404);
    }

    const transaction = await prisma.$transaction(async (prisma) => {

      const walletType = assetType === 'GOLD' ? 'goldWallet' : 'moneyWallet';
      // If the asset type is gold, transfer gold
      if (walletType === 'goldWallet') {

        // Check sender's balance
        const senderWallet = await prisma[walletType].findUnique({
          where: { userId: senderId }
        });

        if (!senderWallet || senderWallet.balance < amount) {
          throw new AppError('Insufficient funds', 400);
        }

        // Update sender's wallet
        await prisma[walletType].update({
          where: { userId: senderId },
          data: { balance: { decrement: amount } }
        });

        // Update receiver's wallet
        await prisma[walletType].update({
          where: { userId: receiver.id },
          data: { balance: { increment: amount } }
        });

        // Create transaction record
        return prisma.transaction.create({
          data: {
            type: 'TRANSFER',
            senderId,
            receiverId: receiver.id,
            amount,
            assetType,
            status: 'COMPLETED',
            description: `Transfer ${amount} ${assetType} to ${receiverPhone}`
          }
        });
        // If the asset type is money, transfer money
      } else {
        // Check sender's balance
        const senderWallet = await prisma[walletType].findUnique({
          where: { userId: senderId }
        });

        if (!senderWallet || senderWallet.balance < amount) {
          throw new AppError('Insufficient funds', 400);
        }

        // Update sender's wallet
        await prisma[walletType].update({
          where: { userId: senderId },
          data: { balance: { decrement: amount } }
        });

        // Update receiver's wallet
        await prisma[walletType].update({
          where: { userId: receiver.id },
          data: { balance: { increment: amount } }
        });

        // Create transaction record
        return prisma.transaction.create({
          data: {
            type: 'TRANSFER',
            senderId,
            receiverId: receiver.id,
            amount,
            assetType,
            status: 'COMPLETED',
            description: `Transfer ${amount} ${assetType} to ${receiverPhone}`
          }
        });
      }


    });

    res.status(200).json({
      status: 'success',
      data: { transaction }
    });
  } catch (error) {
    next(error);
  }
};

export const requestPhysicalCollection = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;
    const { amount, collectionAddress } = req.body;

    const goldWallet = await prisma.goldWallet.findUnique({
      where: { userId }
    });

    if (!goldWallet || goldWallet.balance < amount) {
      throw new AppError('Insufficient gold balance', 400);
    }

    const transaction = await prisma.$transaction(async (prisma) => {
      // Lock gold amount
      await prisma.goldWallet.update({
        where: { userId },
        data: { balance: { decrement: amount } }
      });

      // Create collection request
      return prisma.transaction.create({
        data: {
          type: 'PHYSICAL_COLLECTION',
          senderId: userId,
          amount,
          assetType: 'GOLD',
          status: 'PENDING',
          description: `Physical collection request for ${amount}g of gold at ${collectionAddress}`
        }
      });
    });

    res.status(200).json({
      status: 'success',
      data: { transaction }
    });
  } catch (error) {
    next(error);
  }
};

// ToDo: Integrate actual payment portal responses into the  buy-gold/deposit-money api flows, and also complete the flow of withdrawing from money wallet.
// ToDo: add actual admin functionality to change the pending physical-gold-collection transactions status from "PENDING" to "FAILED" or "COMPLETED".
// ToDo: Integrate accounting software api into user payed endpoints to generate factors for each transaction.