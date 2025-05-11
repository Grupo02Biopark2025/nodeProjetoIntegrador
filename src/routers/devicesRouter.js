import { Router } from 'express';
import { syncDevice, listDevices } from '../controllers/devicesController.js';

const router = Router();

router.post('/sync', syncDevice);

//Rota para listar os dispositivos
router.get('/', listDevices);

export default router;