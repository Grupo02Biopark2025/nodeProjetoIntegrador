import queueService from '../services/queueService.js';

class RabbitMQConfig {
  static async initialize() {
    try {
      console.log('🚀 Inicializando conexão com RabbitMQ...');
      
      await queueService.connect();
      
      console.log('✅ RabbitMQ configurado com sucesso!');
      
      // Event listeners para graceful shutdown
      process.on('SIGINT', async () => {
        console.log('📤 Recebido SIGINT, fechando conexões...');
        await RabbitMQConfig.cleanup();
        process.exit(0);
      });

      process.on('SIGTERM', async () => {
        console.log('📤 Recebido SIGTERM, fechando conexões...');
        await RabbitMQConfig.cleanup();
        process.exit(0);
      });

      process.on('uncaughtException', async (error) => {
        console.error('❌ Erro não capturado:', error);
        await RabbitMQConfig.cleanup();
        process.exit(1);
      });

      process.on('unhandledRejection', async (reason, promise) => {
        console.error('❌ Promise rejeitada não tratada:', reason);
        await RabbitMQConfig.cleanup();
        process.exit(1);
      });

    } catch (error) {
      console.error('❌ Erro ao inicializar RabbitMQ:', error);
      
      // Se não conseguir conectar, continue sem o RabbitMQ
      // (você pode ajustar este comportamento conforme necessário)
      console.warn('⚠️ Continuando sem RabbitMQ. Notificações serão processadas localmente.');
    }
  }

  static async cleanup() {
    try {
      console.log('🧹 Limpando recursos do RabbitMQ...');
      await queueService.disconnect();
      console.log('✅ Cleanup do RabbitMQ concluído');
    } catch (error) {
      console.error('❌ Erro durante cleanup do RabbitMQ:', error);
    }
  }

  static async healthCheck() {
    try {
      const stats = await queueService.getQueueStats();
      return {
        status: 'healthy',
        queues: stats,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

export default RabbitMQConfig;