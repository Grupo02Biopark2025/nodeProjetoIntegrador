import { PrismaClient } from '@prisma/client';
import { sendPasswordResetEmail } from '../services/emailService.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { successResponse, errorResponse } from '../utils/responseHelper.js';

const prisma = new PrismaClient();
const SECRET_KEY = process.env.SECRET_KEY;

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return errorResponse(res, 'Usuário não encontrado', 404);
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return errorResponse(res, 'Email ou senha inválidos', 401);
    }

    const token = jwt.sign({ id: user.id }, SECRET_KEY, { expiresIn: '1h' });

    await prisma.user.update({
      where: { id: user.id },
      data: {
        qtdLogins: { increment: 1 },
        ultimoLogin: new Date(),
      },
    });

    return successResponse(res, { token, user }, 'Login bem-sucedido!');
  } catch (error) {
    return errorResponse(res, 'Erro ao fazer login', 500);
  }
};

export const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return errorResponse(res, 'Usuário não encontrado.', 404);
    }

    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.user.update({
      where: { email },
      data: { resetCode, resetCodeExpires: expires },
    });

    await sendPasswordResetEmail(email, resetCode);

    return successResponse(res, null, 'E-mail de redefinição enviado!');
  } catch (error) {
    return errorResponse(res, 'Erro ao solicitar redefinição de senha', 500);
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return errorResponse(res, 'Email e nova senha são obrigatórios.', 400);
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return errorResponse(res, 'Usuário não encontrado.', 404);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.user.update({
      where: { email },
      data: {
        password: hashedPassword,
        resetCode: null,
        resetCodeExpires: null,
      },
    });

    return successResponse(res, null, 'Senha redefinida com sucesso.');
  } catch (error) {
    return errorResponse(res, 'Erro interno ao redefinir senha.', 500);
  }
};

export const verifyResetCode = async (req, res) => {
  try {
    const { email, code } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || user.resetCode !== code || user.resetCodeExpires < new Date()) {
      return errorResponse(res, 'Código inválido ou expirado.', 400);
    }

    return successResponse(res, null, 'Código válido!');
  } catch (error) {
    return errorResponse(res, 'Erro ao verificar código', 500);
  }
};