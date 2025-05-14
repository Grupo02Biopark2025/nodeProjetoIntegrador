import { Router } from 'express';
import { syncDevice, listDevices, listDeviceLogs } from '../controllers/devicesController.js';

const router = Router();

router.post('/sync', syncDevice);

//Rota para listar os dispositivos
router.get('/', listDevices);

// Rota para listar os logs de um dispositivo específico
router.get('/:deviceId/logs', listDeviceLogs);

export default router;