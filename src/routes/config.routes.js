import { Router } from 'express';
import { getConfigs, saveConfig } from '../controllers/config.controller.js';

const router = Router();

router.get('/', getConfigs);
router.post('/', saveConfig);

export default router;