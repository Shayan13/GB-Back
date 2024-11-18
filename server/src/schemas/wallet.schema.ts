import { z } from 'zod';

export const walletSchemas = {
  buyGold: z.object({
    body: z.object({
      amount: z.number().positive(),
      currentGoldPrice: z.number().positive()
    })
  }),

  sellGold: z.object({
    body: z.object({
      amount: z.number().positive(),
      currentGoldPrice: z.number().positive()
    })
  }),

  deposit: z.object({
    body: z.object({
      amount: z.number().positive(),
      bankAccountId: z.string().uuid()
    })
  }),

  withdraw: z.object({
    body: z.object({
      amount: z.number().positive(),
      bankAccountId: z.string().uuid()
    })
  }),

  transfer: z.object({
    body: z.object({
      receiverPhone: z.string(),
      amount: z.number().positive(),
      assetType: z.enum(['GOLD', 'MONEY'])
    })
  }),

  physicalCollection: z.object({
    body: z.object({
      amount: z.number().positive(),
      collectionAddress: z.string().min(10)
    })
  })
};