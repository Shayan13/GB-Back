import { Router } from 'express';
import {
  getTransactionHistory,
  getTransactionById,
  getDailyReport,
  getMonthlyReport
} from '../controllers/transaction.controller';
import { validateRequest } from '../middleware/validateRequest';
import { transactionSchemas } from '../schemas/transaction.schema';

const router = Router();

router.get('/history', getTransactionHistory);
router.get('/daily-report', getDailyReport);
router.get('/monthly-report', getMonthlyReport);
router.get('/:id', validateRequest(transactionSchemas.getTransaction), getTransactionById);

export default router;