const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const errorHandler = require('./middlewares/errorHandler');
const routes = require('./routes/index');
const AppError = require('./middlewares/appError');

const app = express();

app.use(cors());
app.use(helmet());
app.use(express.json());

app.use('/api', routes);

app.use((req, res, next) => {
    next(new AppError('Not Found', 404));
});

app.use(errorHandler);

module.exports = app;