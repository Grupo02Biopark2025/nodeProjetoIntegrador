import { Router } from 'express';

import UserRouter  from "./routers/userRouter.js";
import AuthRouter from "./routers/authRouter.js";
import DevicesRouter from "./routers/devicesRouter.js";


const routes = Router()
    .use('/api/users', UserRouter)
    .use('/api/auth', AuthRouter)
    .use('/api/devices', DevicesRouter)
    .get('/', (req, res) => {
        res.send('🚀 Servidor rodando com sucesso!');
    });

export default routes;