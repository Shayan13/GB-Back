import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../utils/appError';

const prisma = new PrismaClient();

export const getTransactionHistory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;
    const { page = 1, limit = 10, type, status } = req.query;

    const where = {
      OR: [
        { senderId: userId },
        { receiverId: userId }
      ],
      ...(type && { type: String(type) }),
      ...(status && { status: String(status) })
    };

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        include: {
          sender: { select: { phoneNumber: true } },
          receiver: { select: { phoneNumber: true } }
        }
      }),
      prisma.transaction.count({ where })
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        transactions,
        pagination: {
          total,
          pages: Math.ceil(total / Number(limit)),
          page: Number(page),
          limit: Number(limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getTransactionById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const transaction = await prisma.transaction.findFirst({
      where: {
        id,
        OR: [
          { senderId: userId },
          { receiverId: userId }
        ]
      },
      include: {
        sender: { select: { phoneNumber: true } },
        receiver: { select: { phoneNumber: true } }
      }
    });

    if (!transaction) {
      throw new AppError('Transaction not found', 404);
    }

    res.status(200).json({
      status: 'success',
      data: { transaction }
    });
  } catch (error) {
    next(error);
  }
};

export const getDailyReport = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;
    const { date } = req.query;

    const dateStr = typeof date === 'string' ? date : new Date();

    const startDate = new Date(dateStr);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(dateStr);
    endDate.setHours(23, 59, 59, 999);

    const transactions = await prisma.transaction.findMany({
      where: {
        OR: [
          { senderId: userId },
          { receiverId: userId }
        ],
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const summary = transactions.reduce((acc, tx) => {
      const isOutgoing = tx.senderId === userId;
      const type = tx.assetType;

      if (!acc[type]) {
        acc[type] = { incoming: 0, outgoing: 0 };
      }

      if (isOutgoing) {
        acc[type].outgoing += tx.amount;
      } else {
        acc[type].incoming += tx.amount;
      }

      return acc;
    }, {} as Record<string, { incoming: number; outgoing: number }>);

    res.status(200).json({
      status: 'success',
      data: {
        date: startDate,
        transactions,
        summary
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getMonthlyReport = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;
    const { month = new Date().getMonth() + 1, year = new Date().getFullYear() } = req.query;

    const startDate = new Date(Number(year), Number(month) - 1, 1);
    const endDate = new Date(Number(year), Number(month), 0, 23, 59, 59, 999);

    const transactions = await prisma.transaction.findMany({
      where: {
        OR: [
          { senderId: userId },
          { receiverId: userId }
        ],
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const summary = transactions.reduce((acc, tx) => {
      const isOutgoing = tx.senderId === userId;
      const type = tx.assetType;
      const txType = tx.type;

      if (!acc[type]) {
        acc[type] = {
          incoming: 0,
          outgoing: 0,
          byType: {}
        };
      }

      if (!acc[type].byType[txType]) {
        acc[type].byType[txType] = {
          count: 0,
          total: 0
        };
      }

      if (isOutgoing) {
        acc[type].outgoing += tx.amount;
      } else {
        acc[type].incoming += tx.amount;
      }

      acc[type].byType[txType].count += 1;
      acc[type].byType[txType].total += tx.amount;

      return acc;
    }, {} as Record<string, {
      incoming: number;
      outgoing: number;
      byType: Record<string, { count: number; total: number }>
    }>);

    res.status(200).json({
      status: 'success',
      data: {
        month: Number(month),
        year: Number(year),
        transactions,
        summary
      }
    });
  } catch (error) {
    next(error);
  }
};