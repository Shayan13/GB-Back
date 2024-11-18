import { z } from 'zod';

export const profileSchemas = {
  updateProfile: z.object({
    body: z.object({
      name: z.string().min(2).max(100)
    })
  }),

  bankAccount: z.object({
    body: z.object({
      bankName: z.string().min(2).max(100),
      accountNumber: z.string().min(8).max(30),
      accountType: z.enum(['SAVINGS', 'CHECKING', 'CURRENT'])
    })
  }),

  creditCard: z.object({
    body: z.object({
      lastFourDigits: z.string().length(4).regex(/^\d+$/),
      cardType: z.enum(['VISA', 'MASTERCARD', 'AMEX']),
      expiryMonth: z.number().min(1).max(12),
      expiryYear: z.number().min(new Date().getFullYear())
    })
  }),

  kyc: z.object({
    body: z.object({
      nationalId: z.string().min(5).max(30)
    })
  })
};