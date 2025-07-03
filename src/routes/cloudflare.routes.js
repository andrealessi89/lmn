import { Router } from 'express';
import { 
  createDNSRecords, 
  listDNSRecords,
  createDefaultDNSRecords 
} from '../controllers/cloudflare.controller.js';

const router = Router();

router.post('/dns', createDNSRecords);
router.post('/dns/default', createDefaultDNSRecords);
router.get('/dns/:domain', listDNSRecords);

export default router;