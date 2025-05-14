import { Router } from 'express';
import { syncDevice, listDevices, getDeviceById } from '../controllers/devicesController.js';

const router = Router();

router.post('/sync', syncDevice);

router.get('/', listDevices);

router.get('/:id', getDeviceById);

export default router;