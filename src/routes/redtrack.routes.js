import { Router } from 'express';
import { 
  registerDomain,
  registerMultipleDomains,
  checkDomainStatus,
  getDomainInfo,
  listDomains
} from '../controllers/redtrack.controller.js';

const router = Router();

router.post('/domains', registerDomain);
router.post('/domains/batch', registerMultipleDomains);
router.get('/domains', listDomains);
router.get('/domains/:domain/status', checkDomainStatus);
router.get('/domains/:domain/info', getDomainInfo);

export default router;