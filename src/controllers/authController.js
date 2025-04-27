import { PrismaClient } from "@prisma/client";
import { sendPasswordResetEmail } from "../services/emailService.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();
const SECRET_KEY = process.env.SECRET_KEY;

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Rotas de autenticação

 * /api/auth/login:
 *   post:
 *     summary: Autenticar usuário e retornar token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: gusta@mdm.com
 *               password:
 *                 type: string
 *                 example: 123456
 *     responses:
 *       200:
 *         description: Login bem-sucedido
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Login bem-sucedido!
 *                 token:
 *                   type: string
 *                   example: JWT_TOKEN_AQUI
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *       401:
 *         description: Email ou senha inválidos
 *       404:
 *         description: Usuário não encontrado
 *       500:
 *         description: Erro no servidor
 */


export async function login(req, res) {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: "Email ou senha inválidos" });
    }

    const token = jwt.sign({ id: user.id }, SECRET_KEY, {
      expiresIn: "1h",
    });

    return res.status(200).json({ message: "Login bem-sucedido!", token, user });
  } catch (error) {
    console.log("Erro ao fazer login:", error);
    return res.status(500).json({ error: "Erro ao fazer login" });
  }
}

export async function requestPasswordReset(req, res) {
  const { email } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(404).json({ error: "Usuário não encontrado." });
  }

  const resetCode = Math.floor(100000 + Math.random() * 900000).toString(); // gera código 6 dígitos
  const expires = new Date(Date.now() + 10 * 60 * 1000); // expira em 10 minutos

  await prisma.user.update({
    where: { email },
    data: {
      resetCode,
      resetCodeExpires: expires,
    },
  });

  await sendPasswordResetEmail(email, resetCode);

  return res.json({ message: "E-mail de redefinição enviado!" });
}

export async function resetPassword(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email e nova senha são obrigatórios." });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { email },
      data: {
        password: hashedPassword,
        resetCode: null,          // limpa o código
        resetCodeExpires: null,   // limpa expiração também
      },
    });

    return res.status(200).json({ message: "Senha redefinida com sucesso." });

  } catch (error) {
    console.error("Erro ao redefinir senha:", error);
    return res.status(500).json({ error: "Erro interno ao redefinir senha." });
  }
}

export async function verifyResetCode(req, res) {
  const { email, code } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || user.resetCode !== code || user.resetCodeExpires < new Date()) {
    return res.status(400).json({ error: "Código inválido ou expirado." });
  }

  res.json({ message: "Código válido!" });
}