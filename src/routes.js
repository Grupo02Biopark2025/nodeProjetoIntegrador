import { Router } from 'express';
import UserRouter from "./routers/userRouter.js";
import AuthRouter from "./routers/authRouter.js";
import DevicesRouter from "./routers/devicesRouter.js";
import DashboardRouter from "./routers/dashboard.js";
import { requestPasswordReset, resetPassword } from "./controllers/authController.js";
import NotificationRouter from "./routers/notificationRouter.js";

const routes = Router()
    .use('/api/users', UserRouter)
    .use('/api/auth', AuthRouter)
    .use('/api/devices', DevicesRouter)
    .use('/api/dashboard', DashboardRouter)
    .use('/api/notifications', NotificationRouter)
    .post('/api/auth/request-reset', requestPasswordReset)
    .post('/api/auth/reset-password', resetPassword)
    .get('/', (req, res) => {
        res.send('🚀 Servidor rodando com sucesso!');
    });

export default routes;
