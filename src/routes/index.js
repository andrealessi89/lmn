import { Router } from 'express';
import configRoutes from './config.routes.js';
import domainRoutes from './domain.routes.js';
import structureRoutes from './structure.routes.js';
import cloudflareRoutes from './cloudflare.routes.js';
import redtrackRoutes from './redtrack.routes.js';

const router = Router();

router.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'Campaign Automation API',
    version: '1.0.0'
  });
});

router.use('/config', configRoutes);
router.use('/domains', domainRoutes);
router.use('/structure', structureRoutes);
router.use('/cloudflare', cloudflareRoutes);
router.use('/redtrack', redtrackRoutes);

export default router;