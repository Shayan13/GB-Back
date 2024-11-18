import { Router } from 'express';
import { 
  updateProfile, 
  addBankAccount, 
  addCreditCard,
  getBankAccounts,
  getCreditCards,
  removeBankAccount,
  removeCreditCard,
  submitKyc,
  getKycStatus
} from '../controllers/profile.controller';
import { validateRequest } from '../middleware/validateRequest';
import { profileSchemas } from '../schemas/profile.schema';

const router = Router();

router.put('/update', validateRequest(profileSchemas.updateProfile), updateProfile);

router.post('/kyc', validateRequest(profileSchemas.kyc), submitKyc);
router.get('/kyc/status', getKycStatus);

router.post('/bank-account', validateRequest(profileSchemas.bankAccount), addBankAccount);
router.post('/credit-card', validateRequest(profileSchemas.creditCard), addCreditCard);

router.get('/bank-accounts', getBankAccounts);
router.get('/credit-cards', getCreditCards);

router.delete('/bank-account/:id', removeBankAccount);
router.delete('/credit-card/:id', removeCreditCard);

export default router;