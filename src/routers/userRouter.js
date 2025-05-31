import { Router } from 'express';

import {
    createUser,
    deleteUser,
    getUserById,
    getUsers,
    updateUser,
    registerLogin,
    registerClick,
    getUserStats
} from '../controllers/userController.js';

const router = Router();
router.get('/', getUsers);
router.get('/:id', getUserById);
router.get('/stats/summary', getUserStats);
router.post('/', createUser);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

router.post('/:id/login', registerLogin);   
router.post('/:id/click', registerClick);

export default router;