// src/routes/dashboard.js
import { Router } from 'express';
import {
    devicesByBrand,
    devicesByOSVersion,
    devicesOnlineOffline,
    averageScreenTime
} from '../controllers/devicesController.js';

const router = Router();

router.get('/kpi/brands', devicesByBrand);
router.get('/kpi/os-versions', devicesByOSVersion);
router.get('/kpi/average-screen-time', averageScreenTime);
router.get('/kpi/online-offline', devicesOnlineOffline);


export default router;
