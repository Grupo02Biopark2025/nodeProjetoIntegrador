import { Router } from 'express';
import { syncDevice, listDevices, getDeviceById, listDeviceLogs } from '../controllers/devicesController.js';

const router = Router();

router.post('/sync', syncDevice);

router.get('/', listDevices);

router.get('/:id', getDeviceById);

router.get('/:deviceId/logs', listDeviceLogs);


export default router;