import { Router } from 'express';
import {
  getWalletBalance,
  buyGold,
  sellGold,
  depositMoney,
  withdrawMoney,
  transferFunds,
  requestPhysicalCollection
} from '../controllers/wallet.controller';
import { validateRequest } from '../middleware/validateRequest';
import { walletSchemas } from '../schemas/wallet.schema';

const router = Router();

router.get('/balance', getWalletBalance);
router.post('/buy-gold', validateRequest(walletSchemas.buyGold), buyGold);
router.post('/sell-gold', validateRequest(walletSchemas.sellGold), sellGold);
router.post('/deposit', validateRequest(walletSchemas.deposit), depositMoney);
router.post('/withdraw', validateRequest(walletSchemas.withdraw), withdrawMoney);
router.post('/transfer', validateRequest(walletSchemas.transfer), transferFunds);
router.post('/physical-collection', validateRequest(walletSchemas.physicalCollection), requestPhysicalCollection);

export default router;