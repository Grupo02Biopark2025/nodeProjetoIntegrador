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

  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

  await prisma.user.update({
    where: { email },
    data: {
      resetToken: token,
      resetTokenExpires: expires,
    },
  });

  await sendPasswordResetEmail(email, token);

  return res.json({ message: "E-mail de redefinição enviado!" });
}

// Redefinir senha usando o token
export async function resetPassword(req, res) {
  const { token, password } = req.body;

  const user = await prisma.user.findFirst({
    where: {
      resetToken: token,
      resetTokenExpires: {
        gte: new Date(),
      },
    },
  });

  if (!user) {
    return res.status(400).json({ error: "Token inválido ou expirado." });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      resetToken: null,
      resetTokenExpires: null,
    },
  });

  return res.json({ message: "Senha redefinida com sucesso!" });
}