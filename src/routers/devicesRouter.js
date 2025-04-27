import { Router } from 'express';
import { syncDevice } from '../controllers/devicesController.js';

const router = Router();

router.post('/sync', syncDevice);

export default router;