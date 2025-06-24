import { PrismaClient } from '@prisma/client';
import queueService from './queueService.js';

const prisma = new PrismaClient();

class NotificationService {
  async createNotification(data) {
    try {
      const { deviceId, title, message, type = 'alert', priority = 'normal', createdBy } = data;

      // Verificar se o dispositivo existe
      const device = await prisma.device.findUnique({
        where: { deviceId }
      });

      if (!device) {
        throw new Error('Dispositivo não encontrado');
      }

      // Criar a notificação no banco (com status pending)
      const notification = await prisma.notification.create({
        data: {
          deviceId,
          title,
          message,
          type,
          priority,
          createdBy,
          status: 'pending'
        }
      });

      // Enviar para a fila do RabbitMQ
      const queueResult = await queueService.publishNotification({
        notificationId: notification.id, // ID da notificação criada
        deviceId,
        title,
        message,
        type,
        priority,
        createdBy,
        metadata: {
          createdAt: notification.createdAt.toISOString(),
          deviceModel: device.model,
          deviceManufacturer: device.manufacturer
        }
      });

      if (queueResult.success) {
        // Atualizar com o messageId da fila
        await prisma.notification.update({
          where: { id: notification.id },
          data: {
            data: {
              queueMessageId: queueResult.messageId
            }
          }
        });

        console.log(`✅ Notificação ${notification.id} criada e enviada para fila`);
      }

      return {
        ...notification,
        queueMessageId: queueResult.messageId
      };

    } catch (error) {
      console.error('Erro no NotificationService.createNotification:', error);
      throw error;
    }
  }

  async bulkSendNotification(data) {
    try {
      const { deviceIds, title, message, type = 'alert', priority = 'normal', createdBy } = data;

      // Verificar se todos os dispositivos existem
      const devices = await prisma.device.findMany({
        where: {
          deviceId: {
            in: deviceIds
          }
        },
        select: {
          deviceId: true,
          model: true,
          manufacturer: true
        }
      });

      const foundDeviceIds = devices.map(d => d.deviceId);
      const notFoundDevices = deviceIds.filter(id => !foundDeviceIds.includes(id));

      if (notFoundDevices.length > 0) {
        console.warn(`⚠️ Dispositivos não encontrados: ${notFoundDevices.join(', ')}`);
      }

      // Criar notificações em lote para dispositivos válidos
      const notificationsData = foundDeviceIds.map(deviceId => ({
        deviceId,
        title,
        message,
        type,
        priority,
        createdBy,
        status: 'pending'
      }));

      const notifications = await prisma.notification.createMany({
        data: notificationsData
      });

      // Buscar as notificações criadas para obter os IDs
      const createdNotifications = await prisma.notification.findMany({
        where: {
          deviceId: { in: foundDeviceIds },
          title,
          message,
          createdAt: {
            gte: new Date(Date.now() - 10000) // Últimos 10 segundos
          }
        },
        orderBy: { createdAt: 'desc' },
        take: foundDeviceIds.length
      });

      // Enviar para a fila do RabbitMQ
      const queueResult = await queueService.publishBulkNotification({
        notificationIds: createdNotifications.map(n => n.id),
        deviceIds: foundDeviceIds,
        title,
        message,
        type,
        priority,
        createdBy,
        metadata: {
          totalDevices: foundDeviceIds.length,
          devicesInfo: devices,
          batchId: `batch_${Date.now()}`
        }
      });

      if (queueResult.success) {
        // Atualizar todas as notificações com o messageId da fila
        await prisma.notification.updateMany({
          where: {
            id: {
              in: createdNotifications.map(n => n.id)
            }
          },
          data: {
            data: {
              queueMessageId: queueResult.messageId
            }
          }
        });

        console.log(`✅ ${foundDeviceIds.length} notificações criadas e enviadas para fila em lote`);
      }

      return {
        total: deviceIds.length,
        successful: foundDeviceIds.length,
        failed: notFoundDevices.length,
        notFoundDevices,
        queueMessageId: queueResult.messageId,
        notifications: createdNotifications
      };

    } catch (error) {
      console.error('Erro no NotificationService.bulkSendNotification:', error);
      throw error;
    }
  }

  async getNotificationsByDevice(deviceId, options = {}) {
    try {
      const { page = 1, limit = 10, status } = options;

      const where = { deviceId };
      if (status) where.status = status;

      const notifications = await prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: parseInt(limit)
      });

      const total = await prisma.notification.count({ where });

      return {
        notifications,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Erro no NotificationService.getNotificationsByDevice:', error);
      throw error;
    }
  }

  async markAsDelivered(notificationId) {
    try {
      const notification = await prisma.notification.update({
        where: { id: parseInt(notificationId) },
        data: {
          status: 'delivered',
          deliveredAt: new Date()
        }
      });

      return notification;
    } catch (error) {
      console.error('Erro no NotificationService.markAsDelivered:', error);
      throw error;
    }
  }

  async updateNotificationStatus(notificationId, status, additionalData = {}) {
    try {
      const updateData = {
        status,
        ...additionalData
      };

      if (status === 'sent') {
        updateData.sentAt = new Date();
      } else if (status === 'delivered') {
        updateData.deliveredAt = new Date();
      }

      const notification = await prisma.notification.update({
        where: { id: parseInt(notificationId) },
        data: updateData
      });

      // Publicar update de status na fila para auditoria/logging
      await queueService.publishStatusUpdate({
        notificationId: notification.id,
        deviceId: notification.deviceId,
        previousStatus: notification.status,
        newStatus: status,
        timestamp: new Date().toISOString(),
        additionalData
      });

      return notification;
    } catch (error) {
      console.error('Erro no NotificationService.updateNotificationStatus:', error);
      throw error;
    }
  }

  async getAllNotifications(options = {}) {
    try {
      const { page = 1, limit = 20, status, deviceId, type } = options;

      const where = {};
      if (status) where.status = status;
      if (deviceId) where.deviceId = deviceId;
      if (type) where.type = type;

      const notifications = await prisma.notification.findMany({
        where,
        include: {
          device: {
            select: {
              deviceId: true,
              model: true,
              manufacturer: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: parseInt(limit)
      });

      const total = await prisma.notification.count({ where });

      return {
        notifications,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Erro no NotificationService.getAllNotifications:', error);
      throw error;
    }
  }

  async getNotificationStats(deviceId = null) {
    try {
      const where = deviceId ? { deviceId } : {};

      const stats = await prisma.notification.groupBy({
        by: ['status'],
        where,
        _count: {
          status: true
        }
      });

      const formattedStats = {
        total: 0,
        pending: 0,
        sent: 0,
        delivered: 0,
        failed: 0
      };

      stats.forEach(stat => {
        formattedStats[stat.status] = stat._count.status;
        formattedStats.total += stat._count.status;
      });

      // Adicionar estatísticas da fila
      try {
        const queueStats = await queueService.getQueueStats();
        formattedStats.queueStats = queueStats;
      } catch (error) {
        console.warn('Não foi possível obter estatísticas da fila:', error.message);
        formattedStats.queueStats = null;
      }

      return formattedStats;
    } catch (error) {
      console.error('Erro no NotificationService.getNotificationStats:', error);
      throw error;
    }
  }

  async deleteNotification(notificationId) {
    try {
      const notification = await prisma.notification.delete({
        where: { id: parseInt(notificationId) }
      });

      return notification;
    } catch (error) {
      console.error('Erro no NotificationService.deleteNotification:', error);
      throw error;
    }
  }

  async retryFailedNotification(notificationId) {
    try {
      const notification = await prisma.notification.findUnique({
        where: { id: parseInt(notificationId) },
        include: {
          device: true
        }
      });

      if (!notification) {
        throw new Error('Notificação não encontrada');
      }

      if (notification.status !== 'failed') {
        throw new Error('Apenas notificações com falha podem ser reenviadas');
      }

      // Reenviar para a fila
      const queueResult = await queueService.publishNotification({
        notificationId: notification.id,
        deviceId: notification.deviceId,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        priority: notification.priority,
        createdBy: notification.createdBy,
        metadata: {
          isRetry: true,
          originalCreatedAt: notification.createdAt.toISOString(),
          retryAt: new Date().toISOString()
        }
      });

      if (queueResult.success) {
        // Atualizar status para pending
        await prisma.notification.update({
          where: { id: notification.id },
          data: {
            status: 'pending',
            data: {
              ...notification.data,
              queueMessageId: queueResult.messageId,
              retryCount: (notification.data?.retryCount || 0) + 1
            }
          }
        });
      }

      return {
        success: true,
        notification,
        queueMessageId: queueResult.messageId
      };
    } catch (error) {
      console.error('Erro no NotificationService.retryFailedNotification:', error);
      throw error;
    }
  }
}

export default new NotificationService();