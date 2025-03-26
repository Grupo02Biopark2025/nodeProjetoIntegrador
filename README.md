# Node PostgreSQL App

## Descrição
Este projeto é uma aplicação Node.js que utiliza PostgreSQL como banco de dados. A aplicação é construída com Express e inclui middleware para segurança e gerenciamento de erros.

## Estrutura do Projeto
```
node-postgres-app
├── src
│   ├── app.js                # Ponto de entrada da aplicação
│   ├── config
│   │   └── database.js       # Configuração do banco de dados PostgreSQL
│   ├── controllers
│   │   └── index.js          # Controladores para gerenciar a lógica de negócios
│   ├── middlewares
│   │   ├── appError.js       # Classe para erros personalizados
│   │   └── errorHandler.js    # Middleware para captura de erros
│   ├── models
│   │   └── index.js          # Definições de modelos de dados
│   ├── routes
│       └── index.js          # Definição das rotas da aplicação
│   
├── package.json               # Configuração do npm e dependências
├── .env                       # Variáveis de ambiente
└── README.md                  # Documentação do projeto
```

## Instalação
1. Clone o repositório:
   ```
   git clone https://github.com/Grupo02Biopark2025/nodeProjetoIntegrador.git
   ```
2. Navegue até o diretório do projeto:
   ```
   cd node-postgres-app
   ```
3. Instale as dependências:
   ```
   npm install
   ```

## Uso
1. Configure suas variáveis de ambiente no arquivo `.env`:
   ```
   DB_USER=seu_usuario
   DB_PASSWORD=sua_senha
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=seu_banco_de_dados
   ```
2. Inicie a aplicação:
   ```
   npm start
   ```

## Contribuição
Contribuições são bem-vindas! Sinta-se à vontade para abrir uma issue ou enviar um pull request.

## Licença
Este projeto está licenciado sob a Licença ISC.