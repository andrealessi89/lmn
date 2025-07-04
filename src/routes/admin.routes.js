import { Router } from 'express';
import { 
  getAuthStatus,
  updateRedTrackAuth,
  clearRedTrackAuth,
  updateRedTrackCredentials
} from '../controllers/admin.controller.js';

const router = Router();

// RedTrack Authentication Management
router.get('/redtrack/auth/status', getAuthStatus);
router.post('/redtrack/auth', updateRedTrackAuth);
router.delete('/redtrack/auth', clearRedTrackAuth);
router.post('/redtrack/credentials', updateRedTrackCredentials);

export default router;