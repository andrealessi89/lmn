import { Router } from 'express';
import { createGoogleStructure } from '../controllers/structure.controller.js';

const router = Router();

router.post('/google', createGoogleStructure);

export default router;