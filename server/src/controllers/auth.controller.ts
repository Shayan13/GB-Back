import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { AppError } from '../utils/appError';

const prisma = new PrismaClient();


export const sendOtp = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { phoneNumber } = req.body;

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // ToDo: Send OTP via Twilio
    // await twilio.messages.create({
    //   body: `Your OTP is: ${otp}`,
    //   to: phoneNumber,
    //   from: process.env.TWILIO_PHONE_NUMBER
    // });

    // Store OTP in cache (implement proper OTP storage in production)
    // For demo, we're using a fixed OTP

    res.status(200).json({
      status: 'success',
      message: 'OTP sent successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const verifyOtp = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { phoneNumber, otp } = req.body;

    // Verify OTP (implement proper verification in production)
    // For demo, we're accepting any OTP

    let user = await prisma.user.findUnique({
      where: { phoneNumber }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          phoneNumber,
          goldWallet: { create: {} },
          moneyWallet: { create: {} }
        }
      });
    }

    const token = jwt.sign(
      { id: user.id, phoneNumber },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );

    res.status(200).json({
      status: 'success',
      data: {
        token,
        user: {
          id: user.id,
          phoneNumber: user.phoneNumber,
          isKycVerified: user.isKycVerified
        }
      }
    });
  } catch (error) {
    next(error);
  }
};