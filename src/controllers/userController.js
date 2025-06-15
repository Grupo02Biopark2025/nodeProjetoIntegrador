import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { successResponse, errorResponse } from '../utils/responseHelper.js';

const prisma = new PrismaClient();

const userSelect = {
  id: true,
  name: true,
  email: true,
  isAdmin: true,
  profileImage: true,
  ultimoLogin: true,
  ultimaAtualizacao: true,
  qtdLogins: true,
  qtdClicks: true,
  createdAt: true,
};

const calculateDiasNoSistema = (createdAt) => 
  createdAt ? Math.floor((new Date() - new Date(createdAt)) / (1000 * 60 * 60 * 24)) : 0;

export const createUser = async (req, res) => {
  try {
    const { name, email, password, isAdmin, profileImage } = req.body;

    if (!name || !email || !password) {
      return errorResponse(res, 'Campos obrigatórios: name, email e password', 400);
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return errorResponse(res, 'Email inválido', 400);
    }

    if (password.length < 6) {
      return errorResponse(res, 'Senha deve ter pelo menos 6 caracteres', 400);
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return errorResponse(res, 'Email já cadastrado', 400);
    }

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: await bcrypt.hash(password, 10),
        isAdmin: isAdmin ?? false,
        profileImage,
        qtdLogins: 0,
        qtdClicks: 0,
      },
      select: userSelect
    });

    return successResponse(res, { user }, 'Usuário criado com sucesso', 201);
  } catch (error) {
    return errorResponse(res, 'Erro ao criar usuário', 500);
  }
};

export const getUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({ select: userSelect });
    const usersWithStats = users.map(user => ({
      ...user,
      diasNoSistema: calculateDiasNoSistema(user.createdAt)
    }));

    return successResponse(res, { users: usersWithStats });
  } catch (error) {
    return errorResponse(res, 'Erro ao listar usuários', 500);
  }
};

export const getUserById = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(req.params.id) },
      select: userSelect
    });

    if (!user) return errorResponse(res, 'Usuário não encontrado', 404);

    const userWithStats = {
      ...user,
      diasNoSistema: calculateDiasNoSistema(user.createdAt)
    };

    return successResponse(res, { user: userWithStats });
  } catch (error) {
    return errorResponse(res, 'Erro ao buscar usuário', 500);
  }
};

export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, password, isAdmin, profileImage } = req.body;

    const updateData = {
      name,
      email,
      isAdmin: isAdmin ?? undefined,
      profileImage,
      ultimaAtualizacao: new Date(),
      ...(password && { password: await bcrypt.hash(password, 10) })
    };

    const user = await prisma.user.update({
      where: { id: parseInt(id) },
      data: updateData,
      select: userSelect
    });

    const userWithStats = {
      ...user,
      diasNoSistema: calculateDiasNoSistema(user.createdAt)
    };

    return successResponse(res, { user: userWithStats }, 'Usuário atualizado com sucesso');
  } catch (error) {
    if (error.code === 'P2002') return errorResponse(res, 'Email já está em uso', 400);
    if (error.code === 'P2025') return errorResponse(res, 'Usuário não encontrado', 404);
    return errorResponse(res, 'Erro ao atualizar usuário', 500);
  }
};

export const deleteUser = async (req, res) => {
  try {
    await prisma.user.delete({
      where: { id: parseInt(req.params.id) }
    });
    return successResponse(res, null, 'Usuário deletado com sucesso');
  } catch (error) {
    if (error.code === 'P2025') return errorResponse(res, 'Usuário não encontrado', 404);
    return errorResponse(res, 'Erro ao deletar usuário', 500);
  }
};

export const registerLogin = async (req, res) => {
  try {
    const user = await prisma.user.update({
      where: { id: parseInt(req.params.id) },
      data: {
        ultimoLogin: new Date(),
        qtdLogins: { increment: 1 }
      },
      select: userSelect
    });

    return successResponse(res, { user }, 'Login registrado com sucesso');
  } catch (error) {
    if (error.code === 'P2025') return errorResponse(res, 'Usuário não encontrado', 404);
    return errorResponse(res, 'Erro ao registrar login', 500);
  }
};

export const registerClick = async (req, res) => {
  try {
    const user = await prisma.user.update({
      where: { id: parseInt(req.params.id) },
      data: { qtdClicks: { increment: 1 } },
      select: userSelect
    });

    return successResponse(res, { user }, 'Click registrado com sucesso');
  } catch (error) {
    if (error.code === 'P2025') return errorResponse(res, 'Usuário não encontrado', 404);
    return errorResponse(res, 'Erro ao registrar click', 500);
  }
};

export const getUserStats = async (req, res) => {
  try {
    const [
      totalUsers,
      adminUsers,
      recentLogins,
      { _sum: { qtdLogins = 0 } = {} },
      { _sum: { qtdClicks = 0 } = {} }
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isAdmin: true } }),
      prisma.user.count({
        where: {
          ultimoLogin: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      }),
      prisma.user.aggregate({ _sum: { qtdLogins: true } }),
      prisma.user.aggregate({ _sum: { qtdClicks: true } })
    ]);

    const stats = {
      totalUsers,
      adminUsers,
      regularUsers: totalUsers - adminUsers,
      recentLogins,
      totalLogins: qtdLogins,
      totalClicks: qtdClicks,
      generatedAt: new Date()
    };

    return successResponse(res, { stats });
  } catch (error) {
    return errorResponse(res, 'Erro ao obter estatísticas', 500);
  }
};