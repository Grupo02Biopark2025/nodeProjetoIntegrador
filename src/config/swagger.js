import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'CorpSync API',
      version: '1.0.0',
      description: 'API para gerenciamento de dispositivos corporativos',
      contact: {
        name: 'Suporte CorpSync',
        email: 'suporte@corpsync.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:4040',
        description: 'Servidor de Desenvolvimento'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            email: { type: 'string', format: 'email' },
            isAdmin: { type: 'boolean' },
            profileImage: { type: 'string' },
            qtdLogins: { type: 'integer' },
            qtdClicks: { type: 'integer' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        Device: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            deviceId: { type: 'string' },
            model: { type: 'string' },
            os: { type: 'string' },
            manufacturer: { type: 'string' },
            isOnline: { type: 'boolean' },
            lastSync: { type: 'string', format: 'date-time' }
          }
        }
      }
    },
    tags: [
      { name: 'Auth', description: 'Endpoints de autenticação' },
      { name: 'Users', description: 'Gerenciamento de usuários' },
      { name: 'Devices', description: 'Gerenciamento de dispositivos' }
    ],
    security: [{ bearerAuth: [] }]
  },
  apis: [
    './src/docs/auth.docs.js',
    './src/docs/users.docs.js',
    './src/docs/devices.docs.js'
  ]
};

const swaggerSpec = swaggerJSDoc(options);

const setupSwagger = (app) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
};

export default setupSwagger;