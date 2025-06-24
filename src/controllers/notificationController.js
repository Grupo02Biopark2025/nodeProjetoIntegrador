import notificationService from '../services/notificationService.js';

class NotificationController {
  async sendNotification(req, res) {
    try {
      const { deviceId, title, message, type, priority, createdBy } = req.body;

      // Validações básicas
      if (!deviceId || !title || !message) {
        return res.status(400).json({
          success: false,
          error: 'deviceId, title e message são obrigatórios'
        });
      }

      if (title.length > 100) {
        return res.status(400).json({
          success: false,
          error: 'Título deve ter no máximo 100 caracteres'
        });
      }

      if (message.length > 500) {
        return res.status(400).json({
          success: false,
          error: 'Mensagem deve ter no máximo 500 caracteres'
        });
      }

      const validTypes = ['alert', 'warning', 'info'];
      if (type && !validTypes.includes(type)) {
        return res.status(400).json({
          success: false,
          error: 'Tipo deve ser: alert, warning ou info'
        });
      }

      const validPriorities = ['low', 'normal', 'high', 'urgent'];
      if (priority && !validPriorities.includes(priority)) {
        return res.status(400).json({
          success: false,
          error: 'Prioridade deve ser: low, normal, high ou urgent'
        });
      }

      const notification = await notificationService.createNotification({
        deviceId,
        title: title.trim(),
        message: message.trim(),
        type,
        priority,
        createdBy
      });

      res.status(201).json({
        success: true,
        message: 'Notificação enviada para processamento',
        notification: {
          id: notification.id,
          deviceId: notification.deviceId,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          priority: notification.priority,
          status: notification.status,
          createdAt: notification.createdAt,
          queueMessageId: notification.queueMessageId
        }
      });

    } catch (error) {
      console.error('Erro no NotificationController.sendNotification:', error);
      
      if (error.message === 'Dispositivo não encontrado') {
        return res.status(404).json({
          success: false,
          error: error.message
        });
      }

      if (error.message.includes('RabbitMQ') || error.message.includes('fila')) {
        return res.status(503).json({
          success: false,
          error: 'Serviço de notificações temporariamente indisponível'
        });
      }

      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  async getDeviceNotifications(req, res) {
    try {
      const { deviceId } = req.params;
      const { page, limit, status } = req.query;

      const result = await notificationService.getNotificationsByDevice(deviceId, {
        page,
        limit,
        status
      });

      res.json({
        success: true,
        ...result
      });

    } catch (error) {
      console.error('Erro no NotificationController.getDeviceNotifications:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  async markAsDelivered(req, res) {
    try {
      const { id } = req.params;

      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          error: 'ID da notificação inválido'
        });
      }

      const notification = await notificationService.markAsDelivered(id);

      res.json({
        success: true,
        notification: {
          id: notification.id,
          status: notification.status,
          deliveredAt: notification.deliveredAt
        }
      });

    } catch (error) {
      console.error('Erro no NotificationController.markAsDelivered:', error);
      
      if (error.code === 'P2025') {
        return res.status(404).json({
          success: false,
          error: 'Notificação não encontrada'
        });
      }

      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  async getAllNotifications(req, res) {
    try {
      const { page, limit, status, deviceId, type } = req.query;

      const result = await notificationService.getAllNotifications({
        page,
        limit,
        status,
        deviceId,
        type
      });

      res.json({
        success: true,
        ...result
      });

    } catch (error) {
      console.error('Erro no NotificationController.getAllNotifications:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  async getNotificationStats(req, res) {
    try {
      const { deviceId } = req.query;

      const stats = await notificationService.getNotificationStats(deviceId);

      res.json({
        success: true,
        stats
      });

    } catch (error) {
      console.error('Erro no NotificationController.getNotificationStats:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  async deleteNotification(req, res) {
    try {
      const { id } = req.params;

      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          error: 'ID da notificação inválido'
        });
      }

      await notificationService.deleteNotification(id);

      res.json({
        success: true,
        message: 'Notificação deletada com sucesso'
      });

    } catch (error) {
      console.error('Erro no NotificationController.deleteNotification:', error);
      
      if (error.code === 'P2025') {
        return res.status(404).json({
          success: false,
          error: 'Notificação não encontrada'
        });
      }

      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  async bulkSendNotification(req, res) {
    try {
      const { deviceIds, title, message, type, priority, createdBy } = req.body;

      // Validações
      if (!Array.isArray(deviceIds) || deviceIds.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'deviceIds deve ser um array não vazio'
        });
      }

      if (!title || !message) {
        return res.status(400).json({
          success: false,
          error: 'title e message são obrigatórios'
        });
      }

      if (deviceIds.length > 100) {
        return res.status(400).json({
          success: false,
          error: 'Máximo de 100 dispositivos por vez'
        });
      }

      const results = await notificationService.bulkSendNotification({
        deviceIds,
        title: title.trim(),
        message: message.trim(),
        type,
        priority,
        createdBy
      });

      res.status(201).json({
        success: true,
        message: 'Notificações enviadas para processamento em lote',
        summary: {
          total: results.total,
          successful: results.successful,
          failed: results.failed
        },
        queueMessageId: results.queueMessageId,
        notFoundDevices: results.notFoundDevices
      });

    } catch (error) {
      console.error('Erro no NotificationController.bulkSendNotification:', error);
      
      if (error.message.includes('RabbitMQ') || error.message.includes('fila')) {
        return res.status(503).json({
          success: false,
          error: 'Serviço de notificações temporariamente indisponível'
        });
      }

      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  async retryNotification(req, res) {
    try {
      const { id } = req.params;

      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          error: 'ID da notificação inválido'
        });
      }

      const result = await notificationService.retryFailedNotification(id);

      res.json({
        success: true,
        message: 'Notificação reenviada para processamento',
        notification: {
          id: result.notification.id,
          status: 'pending',
          queueMessageId: result.queueMessageId
        }
      });

    } catch (error) {
      console.error('Erro no NotificationController.retryNotification:', error);
      
      if (error.message === 'Notificação não encontrada') {
        return res.status(404).json({
          success: false,
          error: error.message
        });
      }

      if (error.message.includes('apenas notificações com falha')) {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  async getQueueStats(req, res) {
    try {
      const stats = await notificationService.getNotificationStats();

      res.json({
        success: true,
        stats
      });

    } catch (error) {
      console.error('Erro no NotificationController.getQueueStats:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }
}

export default new NotificationController();