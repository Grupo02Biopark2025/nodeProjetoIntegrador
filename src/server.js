import http from "node:http";
import app from "./app.js";
import dotenv from "dotenv";
import RabbitMQConfig from "./config/rabbitmq.js"; // 👈 Adicionar import

dotenv.config();

const error = (err) => {
  console.error(`An error has occurred on start server\n ${err.message}`);
  throw err;
};

const listening = () => {
  console.log(`Server running on port ${process.env.PORT}`);
};

// 👇 Função para inicializar tudo
async function startServer() {
  try {
    // 1. Primeiro inicializar RabbitMQ
    console.log('🔄 Inicializando RabbitMQ...');
    await RabbitMQConfig.initialize();
    
    // 2. Depois iniciar o servidor HTTP
    const server = http.createServer(app);
    server.listen(process.env.PORT || 4040);
    server.on("error", error);
    server.on("listening", listening);

    console.log('✅ Sistema inicializado com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
}

startServer();