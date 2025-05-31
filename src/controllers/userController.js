import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
import bcrypt from "bcryptjs";

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Cria um novo usuário
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 example: Gustavo Domingos
 *               email:
 *                 type: string
 *                 example: gusta@mdm.com
 *               password:
 *                 type: string
 *                 example: 123456
 *               isAdmin:
 *                 type: boolean
 *                 example: false
 *               profileImage:
 *                 type: string
 *                 example: base64_string_here
 *     responses:
 *       201:
 *         description: Usuário criado com sucesso
 *       400:
 *         description: Email já cadastrado
 *       500:
 *         description: Erro ao criar usuário
 */

// Criar um novo usuário
export async function createUser(req, res) {
  try {
    const { name, email, password, isAdmin, profileImage } = req.body;

    // Validação dos campos obrigatórios
    if (!name || !email || !password) {
      return res.status(400).json({ 
        error: "Campos obrigatórios: name, email e password" 
      });
    }

    // Validação básica de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        error: "Email inválido" 
      });
    }

    // Validação de senha (mínimo 6 caracteres)
    if (password.length < 6) {
      return res.status(400).json({ 
        error: "Senha deve ter pelo menos 6 caracteres" 
      });
    }

    // Verifica se o email já está cadastrado
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: "Email já cadastrado." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const userData = {
      name,
      email,
      password: hashedPassword,
      isAdmin: isAdmin !== undefined ? isAdmin : false,
      // Inicializar estatísticas
      qtdLogins: 0,
      qtdClicks: 0,
    };

    if (profileImage !== undefined) {
      userData.profileImage = profileImage;
    }

    console.log('Criando usuário:', {
      name,
      email,
      isAdmin: userData.isAdmin,
      hasProfileImage: !!profileImage
    });

    const user = await prisma.user.create({
      data: userData,
    });

    const { password: _, ...userWithoutPassword } = user;

    return res.status(201).json({ 
      message: "Usuário criado com sucesso!", 
      user: userWithoutPassword 
    });
  } catch (error) {
    console.error("Erro ao criar usuário:", error);
    
    if (error.code === 'P2002') {
      return res.status(400).json({ 
        error: "Email já está em uso" 
      });
    }

    return res.status(500).json({ 
      error: "Erro interno do servidor",
      details: error.message 
    });
  }
}

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Retorna todos os usuários com estatísticas
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Lista de usuários retornada com sucesso
 *       500:
 *         description: Erro ao obter usuários
 */

// Obter todos os usuários com estatísticas calculadas
export async function getUsers(req, res) {
  try {
    const users = await prisma.user.findMany({
      select: {
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
      }
    });

    // Calcular dias no sistema para cada usuário
    const usersWithStats = users.map(user => {
      const diasNoSistema = user.createdAt 
        ? Math.floor((new Date() - new Date(user.createdAt)) / (1000 * 60 * 60 * 24))
        : 0;

      return {
        ...user,
        diasNoSistema
      };
    });

    return res.status(200).json(usersWithStats);
  } catch (error) {
    console.error('Erro ao obter usuários:', error);
    return res.status(500).json({ error: 'Erro ao obter usuários' });
  }
}

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Retorna um usuário pelo ID com estatísticas
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do usuário
 *     responses:
 *       200:
 *         description: Usuário encontrado
 *       404:
 *         description: Usuário não encontrado
 *       500:
 *         description: Erro ao obter usuário
 */

// Obter um único usuário pelo ID com estatísticas
export async function getUserById(req, res) {
  const { id } = req.params;
  try {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
      select: {
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
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Calcular dias no sistema
    const diasNoSistema = user.createdAt 
      ? Math.floor((new Date() - new Date(user.createdAt)) / (1000 * 60 * 60 * 24))
      : 0;

    const userWithStats = {
      ...user,
      diasNoSistema
    };

    return res.status(200).json(userWithStats);
  } catch (error) {
    console.error('Erro ao obter usuário:', error);
    return res.status(500).json({ error: 'Erro ao obter usuário' });
  }
}

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Atualiza um usuário existente
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do usuário
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Gustavo Atualizado
 *               email:
 *                 type: string
 *                 example: novo@email.com
 *               password:
 *                 type: string
 *                 example: novaSenha123
 *               isAdmin:
 *                 type: boolean
 *                 example: true
 *               profileImage:
 *                 type: string
 *                 example: base64_string_here
 *     responses:
 *       200:
 *         description: Usuário atualizado
 *       500:
 *         description: Erro ao atualizar usuário
 */

// Atualizar um usuário
export async function updateUser(req, res) {
  const { id } = req.params;
  const { name, email, password, isAdmin, profileImage } = req.body;

  try {
    let updateData = { 
      name, 
      email,
      isAdmin: isAdmin !== undefined ? isAdmin : false,
      ultimaAtualizacao: new Date(), // Atualizar timestamp de última atualização
    };

    if (password && password.trim() !== '') {
      updateData.password = await bcrypt.hash(password, 10);
    }

    if (profileImage !== undefined) {
      updateData.profileImage = profileImage;
    }

    console.log('Atualizando usuário:', {
      id: parseInt(id),
      updateData: {
        ...updateData,
        profileImage: updateData.profileImage ? 'Base64 string presente' : 'Nenhuma imagem'
      }
    });

    const updatedUser = await prisma.user.update({
      where: { id: parseInt(id) },
      data: updateData,
      select: {
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
      }
    });

    // Calcular dias no sistema
    const diasNoSistema = updatedUser.createdAt 
      ? Math.floor((new Date() - new Date(updatedUser.createdAt)) / (1000 * 60 * 60 * 24))
      : 0;

    const userWithStats = {
      ...updatedUser,
      diasNoSistema
    };

    return res.status(200).json(userWithStats);
  } catch (error) {
    console.error('❌ Erro ao atualizar usuário:', error);
    
    if (error.code === 'P2002') {
      return res.status(400).json({ 
        error: "Email já está em uso por outro usuário" 
      });
    }
    
    if (error.code === 'P2025') {
      return res.status(404).json({ 
        error: "Usuário não encontrado" 
      });
    }

    return res.status(500).json({ 
      error: "Erro ao atualizar usuário",
      details: error.message 
    });
  }
}

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Deleta um usuário pelo ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do usuário
 *     responses:
 *       200:
 *         description: Usuário deletado com sucesso
 *       500:
 *         description: Erro ao deletar usuário
 */

// Deletar um usuário
export async function deleteUser(req, res) {
  const { id } = req.params;
  try {
    await prisma.user.delete({
      where: { id: parseInt(id) },
    });
    return res.status(200).json({ message: 'Usuário deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar usuário:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({ 
        error: "Usuário não encontrado" 
      });
    }
    
    return res.status(500).json({ error: 'Erro ao deletar usuário' });
  }
}

/**
 * @swagger
 * /api/users/{id}/login:
 *   post:
 *     summary: Registra um login do usuário (atualiza estatísticas)
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do usuário
 *     responses:
 *       200:
 *         description: Login registrado com sucesso
 *       404:
 *         description: Usuário não encontrado
 *       500:
 *         description: Erro ao registrar login
 */

// Registrar login do usuário (atualizar estatísticas)
export async function registerLogin(req, res) {
  const { id } = req.params;
  
  try {
    const updatedUser = await prisma.user.update({
      where: { id: parseInt(id) },
      data: {
        ultimoLogin: new Date(),
        qtdLogins: {
          increment: 1
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        ultimoLogin: true,
        qtdLogins: true,
      }
    });

    console.log(`Login registrado para usuário ${updatedUser.name} (ID: ${id})`);
    
    return res.status(200).json({
      message: 'Login registrado com sucesso',
      user: updatedUser
    });
  } catch (error) {
    console.error('Erro ao registrar login:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({ 
        error: "Usuário não encontrado" 
      });
    }
    
    return res.status(500).json({ 
      error: 'Erro ao registrar login',
      details: error.message 
    });
  }
}

/**
 * @swagger
 * /api/users/{id}/click:
 *   post:
 *     summary: Registra um click do usuário (atualiza estatísticas)
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do usuário
 *     responses:
 *       200:
 *         description: Click registrado com sucesso
 *       404:
 *         description: Usuário não encontrado
 *       500:
 *         description: Erro ao registrar click
 */

// Registrar click do usuário (atualizar estatísticas)
export async function registerClick(req, res) {
  const { id } = req.params;
  
  try {
    const updatedUser = await prisma.user.update({
      where: { id: parseInt(id) },
      data: {
        qtdClicks: {
          increment: 1
        }
      },
      select: {
        id: true,
        name: true,
        qtdClicks: true,
      }
    });

    return res.status(200).json({
      message: 'Click registrado com sucesso',
      user: updatedUser
    });
  } catch (error) {
    console.error('Erro ao registrar click:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({ 
        error: "Usuário não encontrado" 
      });
    }
    
    return res.status(500).json({ 
      error: 'Erro ao registrar click',
      details: error.message 
    });
  }
}

/**
 * @swagger
 * /api/users/stats/summary:
 *   get:
 *     summary: Retorna estatísticas gerais dos usuários
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Estatísticas retornadas com sucesso
 *       500:
 *         description: Erro ao obter estatísticas
 */

// Obter estatísticas gerais dos usuários
export async function getUserStats(req, res) {
  try {
    const totalUsers = await prisma.user.count();
    const adminUsers = await prisma.user.count({
      where: { isAdmin: true }
    });
    
    const recentLogins = await prisma.user.count({
      where: {
        ultimoLogin: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Últimos 7 dias
        }
      }
    });

    const totalLogins = await prisma.user.aggregate({
      _sum: {
        qtdLogins: true
      }
    });

    const totalClicks = await prisma.user.aggregate({
      _sum: {
        qtdClicks: true
      }
    });

    const stats = {
      totalUsers,
      adminUsers,
      regularUsers: totalUsers - adminUsers,
      recentLogins,
      totalLogins: totalLogins._sum.qtdLogins || 0,
      totalClicks: totalClicks._sum.qtdClicks || 0,
      generatedAt: new Date()
    };

    return res.status(200).json(stats);
  } catch (error) {
    console.error('Erro ao obter estatísticas:', error);
    return res.status(500).json({ 
      error: 'Erro ao obter estatísticas',
      details: error.message 
    });
  }
}