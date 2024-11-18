import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../utils/appError';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export const updateProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;
    const { name } = req.body;

    const user = await prisma.user.update({
      where: { id: userId },
      data: { name }
    });

    res.status(200).json({
      status: 'success',
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

export const submitKyc = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;
    const { nationalId } = req.body;

    // Check if KYC already exists
    const existingKyc = await prisma.kycDetails.findUnique({
      where: { userId }
    });

    if (existingKyc) {
      throw new AppError('KYC already submitted', 400);
    }

    // Simulate external KYC verification API call
    const verificationResult = await simulateKycVerification(nationalId);

    const kycDetails = await prisma.kycDetails.create({
      data: {
        userId,
        nationalId,
        status: verificationResult.success ? 'VERIFIED' : 'REJECTED',
        verifiedAt: verificationResult.success ? new Date() : null
      }
    });

    if (verificationResult.success) {
      await prisma.user.update({
        where: { id: userId },
        data: { isKycVerified: true }
      });
    }

    res.status(200).json({
      status: 'success',
      data: { kycDetails }
    });
  } catch (error) {
    next(error);
  }
};

export const getKycStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;

    const kycDetails = await prisma.kycDetails.findUnique({
      where: { userId }
    });

    res.status(200).json({
      status: 'success',
      data: { kycDetails }
    });
  } catch (error) {
    next(error);
  }
};

export const addBankAccount = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;
    const { bankName, accountNumber, accountType } = req.body;

    // Check if bank account already exists
    const existingAccount = await prisma.bankAccount.findFirst({
      where: {
        userId,
        accountNumber
      }
    });

    if (existingAccount) {
      throw new AppError('Bank account already exists', 400);
    }

    const bankAccount = await prisma.bankAccount.create({
      data: {
        userId,
        bankName,
        accountNumber,
        accountType
      }
    });

    res.status(201).json({
      status: 'success',
      data: { bankAccount }
    });
  } catch (error) {
    next(error);
  }
};

export const addCreditCard = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;
    const { lastFourDigits, cardType, expiryMonth, expiryYear } = req.body;

    const creditCard = await prisma.creditCard.create({
      data: {
        userId,
        lastFourDigits,
        cardType,
        expiryMonth,
        expiryYear
      }
    });

    res.status(201).json({
      status: 'success',
      data: { creditCard }
    });
  } catch (error) {
    next(error);
  }
};

export const getBankAccounts = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;

    const bankAccounts = await prisma.bankAccount.findMany({
      where: { userId }
    });

    res.status(200).json({
      status: 'success',
      data: { bankAccounts }
    });
  } catch (error) {
    next(error);
  }
};

export const getCreditCards = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;

    const creditCards = await prisma.creditCard.findMany({
      where: { userId }
    });

    res.status(200).json({
      status: 'success',
      data: { creditCards }
    });
  } catch (error) {
    next(error);
  }
};

export const removeBankAccount = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const bankAccount = await prisma.bankAccount.findFirst({
      where: {
        id,
        userId
      }
    });

    if (!bankAccount) {
      throw new AppError('Bank account not found', 404);
    }

    await prisma.bankAccount.delete({
      where: { id }
    });

    res.status(200).json({
      status: 'success',
      message: 'Bank account removed successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const removeCreditCard = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const creditCard = await prisma.creditCard.findFirst({
      where: {
        id,
        userId
      }
    });

    if (!creditCard) {
      throw new AppError('Credit card not found', 404);
    }

    await prisma.creditCard.delete({
      where: { id }
    });

    res.status(200).json({
      status: 'success',
      message: 'Credit card removed successfully'
    });
  } catch (error) {
    next(error);
  }
};


// ToDo: Implement KYC verification function
// Simulate KYC verification with external service
const simulateKycVerification = async (nationalId: string) => {
  // In production, this would be an actual API call to a KYC service
  return { success: true };
};