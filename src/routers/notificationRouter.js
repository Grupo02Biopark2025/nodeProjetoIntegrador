import { Router } from 'express';
import notificationController from '../controllers/notificationController.js';

const router = Router();

// Enviar notificação para um dispositivo específico
router.post('/send', notificationController.sendNotification);

// Enviar notificação para múltiplos dispositivos
router.post('/send/bulk', notificationController.bulkSendNotification);

// Buscar todas as notificações (com filtros opcionais)
router.get('/', notificationController.getAllNotifications);

// Buscar estatísticas das notificações e filas
router.get('/stats', notificationController.getQueueStats);

// Buscar notificações de um dispositivo específico
router.get('/device/:deviceId', notificationController.getDeviceNotifications);

// Marcar notificação como entregue (usado pelos dispositivos)
router.patch('/:id/delivered', notificationController.markAsDelivered);

// Reenviar notificação com falha
router.post('/:id/retry', notificationController.retryNotification);

// Deletar uma notificação
router.delete('/:id', notificationController.deleteNotification);

export default router;