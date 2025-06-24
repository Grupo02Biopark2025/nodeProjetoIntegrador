import amqp from 'amqplib';

class QueueService {
  constructor() {
    this.connection = null;
    this.channel = null;
    this.queues = {
      NOTIFICATIONS: 'notifications.send',
      NOTIFICATION_BULK: 'notifications.bulk',
      NOTIFICATION_STATUS: 'notifications.status'
    };
  }

  async connect() {
    try {
      if (this.connection) {
        return this.connection;
      }

      // Configuração do RabbitMQ - ajuste conforme seu ambiente
      const rabbitMQUrl = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
      
      this.connection = await amqp.connect(rabbitMQUrl);
      this.channel = await this.connection.createChannel();

      // Declarar as filas
      await this.channel.assertQueue(this.queues.NOTIFICATIONS, {
        durable: true, // Fila persistente
        arguments: {
          'x-message-ttl': 300000, // TTL de 5 minutos
          'x-dead-letter-exchange': 'notifications.dlx'
        }
      });

      await this.channel.assertQueue(this.queues.NOTIFICATION_BULK, {
        durable: true,
        arguments: {
          'x-message-ttl': 600000, // TTL de 10 minutos para bulk
          'x-dead-letter-exchange': 'notifications.dlx'
        }
      });

      await this.channel.assertQueue(this.queues.NOTIFICATION_STATUS, {
        durable: true
      });

      // Configurar dead letter exchange para mensagens com falha
      await this.channel.assertExchange('notifications.dlx', 'direct', {
        durable: true
      });

      await this.channel.assertQueue('notifications.failed', {
        durable: true
      });

      await this.channel.bindQueue('notifications.failed', 'notifications.dlx', '');

      console.log('✅ RabbitMQ conectado e filas configuradas');
      
      // Event handlers para conexão
      this.connection.on('error', (err) => {
        console.error('❌ Erro na conexão RabbitMQ:', err);
        this.connection = null;
        this.channel = null;
      });

      this.connection.on('close', () => {
        console.log('🔌 Conexão RabbitMQ fechada');
        this.connection = null;
        this.channel = null;
      });

      return this.connection;
    } catch (error) {
      console.error('❌ Erro ao conectar no RabbitMQ:', error);
      throw error;
    }
  }

  async disconnect() {
    try {
      if (this.channel) {
        await this.channel.close();
      }
      if (this.connection) {
        await this.connection.close();
      }
      this.connection = null;
      this.channel = null;
      console.log('🔌 Desconectado do RabbitMQ');
    } catch (error) {
      console.error('❌ Erro ao desconectar do RabbitMQ:', error);
    }
  }

  async ensureConnection() {
    if (!this.connection || !this.channel) {
      await this.connect();
    }
  }

  async publishNotification(notificationData) {
    try {
      await this.ensureConnection();

      const message = {
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'SINGLE_NOTIFICATION',
        timestamp: new Date().toISOString(),
        data: {
          deviceId: notificationData.deviceId,
          title: notificationData.title,
          message: notificationData.message,
          notificationType: notificationData.type || 'alert',
          priority: notificationData.priority || 'normal',
          createdBy: notificationData.createdBy,
          metadata: notificationData.metadata || {}
        },
        retryCount: 0,
        maxRetries: 3
      };

      const messageBuffer = Buffer.from(JSON.stringify(message));

      const published = this.channel.publish(
        '', // exchange vazio = direct para fila
        this.queues.NOTIFICATIONS,
        messageBuffer,
        {
          persistent: true, // Mensagem persistente
          priority: this._getPriorityNumber(notificationData.priority),
          messageId: message.id,
          timestamp: Date.now(),
          headers: {
            'content-type': 'application/json',
            'message-type': 'notification'
          }
        }
      );

      if (published) {
        console.log(`📤 Notificação enviada para fila: ${message.id}`);
        return { success: true, messageId: message.id };
      } else {
        throw new Error('Falha ao publicar mensagem na fila');
      }

    } catch (error) {
      console.error('❌ Erro ao publicar notificação:', error);
      throw error;
    }
  }

  async publishBulkNotification(bulkData) {
    try {
      await this.ensureConnection();

      const message = {
        id: `bulk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'BULK_NOTIFICATION',
        timestamp: new Date().toISOString(),
        data: {
          deviceIds: bulkData.deviceIds,
          title: bulkData.title,
          message: bulkData.message,
          notificationType: bulkData.type || 'alert',
          priority: bulkData.priority || 'normal',
          createdBy: bulkData.createdBy,
          metadata: bulkData.metadata || {},
          batchSize: bulkData.batchSize || 10 // Processar em lotes
        },
        retryCount: 0,
        maxRetries: 3
      };

      const messageBuffer = Buffer.from(JSON.stringify(message));

      const published = this.channel.publish(
        '',
        this.queues.NOTIFICATION_BULK,
        messageBuffer,
        {
          persistent: true,
          priority: this._getPriorityNumber(bulkData.priority),
          messageId: message.id,
          timestamp: Date.now(),
          headers: {
            'content-type': 'application/json',
            'message-type': 'bulk-notification'
          }
        }
      );

      if (published) {
        console.log(`📤 Notificação em lote enviada para fila: ${message.id}`);
        return { success: true, messageId: message.id };
      } else {
        throw new Error('Falha ao publicar mensagem em lote na fila');
      }

    } catch (error) {
      console.error('❌ Erro ao publicar notificação em lote:', error);
      throw error;
    }
  }

  async publishStatusUpdate(statusData) {
    try {
      await this.ensureConnection();

      const message = {
        id: `status_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'STATUS_UPDATE',
        timestamp: new Date().toISOString(),
        data: statusData
      };

      const messageBuffer = Buffer.from(JSON.stringify(message));

      const published = this.channel.publish(
        '',
        this.queues.NOTIFICATION_STATUS,
        messageBuffer,
        {
          persistent: true,
          messageId: message.id,
          timestamp: Date.now()
        }
      );

      if (published) {
        console.log(`📤 Status update enviado: ${message.id}`);
        return { success: true, messageId: message.id };
      }

    } catch (error) {
      console.error('❌ Erro ao publicar status update:', error);
      throw error;
    }
  }

  _getPriorityNumber(priority) {
    const priorityMap = {
      'low': 1,
      'normal': 5,
      'high': 8,
      'urgent': 10
    };
    return priorityMap[priority] || 5;
  }

  async getQueueStats() {
    try {
      await this.ensureConnection();

      const stats = {};
      
      for (const [name, queueName] of Object.entries(this.queues)) {
        try {
          const queueInfo = await this.channel.checkQueue(queueName);
          stats[name.toLowerCase()] = {
            messageCount: queueInfo.messageCount,
            consumerCount: queueInfo.consumerCount
          };
        } catch (error) {
          stats[name.toLowerCase()] = {
            messageCount: 0,
            consumerCount: 0,
            error: error.message
          };
        }
      }

      return stats;
    } catch (error) {
      console.error('❌ Erro ao obter estatísticas das filas:', error);
      throw error;
    }
  }

  async purgeQueue(queueName) {
    try {
      await this.ensureConnection();
      
      if (!Object.values(this.queues).includes(queueName)) {
        throw new Error('Nome da fila inválido');
      }

      const result = await this.channel.purgeQueue(queueName);
      console.log(`🗑️ Fila ${queueName} limpa. ${result.messageCount} mensagens removidas`);
      
      return { success: true, messagesRemoved: result.messageCount };
    } catch (error) {
      console.error('❌ Erro ao limpar fila:', error);
      throw error;
    }
  }
}

export default new QueueService();