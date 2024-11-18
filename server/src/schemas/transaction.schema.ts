import { z } from 'zod';

export const transactionSchemas = {
  getTransaction: z.object({
    params: z.object({
      id: z.string().uuid()
    })
  }),

  listTransactions: z.object({
    query: z.object({
      page: z.string().optional(),
      limit: z.string().optional(),
      type: z.enum(['DEPOSIT', 'WITHDRAW', 'TRANSFER', 'BUY_GOLD', 'SELL_GOLD', 'PHYSICAL_COLLECTION']).optional(),
      status: z.enum(['PENDING', 'COMPLETED', 'FAILED']).optional()
    })
  }),

  dailyReport: z.object({
    query: z.object({
      date: z.string().optional()
    })
  }),

  monthlyReport: z.object({
    query: z.object({
      month: z.string().optional(),
      year: z.string().optional()
    })
  })
};