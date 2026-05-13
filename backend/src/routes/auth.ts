import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';

const router = Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'animefox-super-secret-jwt-key-2026';

// REGISTER
router.post('/register', [
  body('email').isEmail().withMessage('Geçerli bir e-posta adresi giriniz.'),
  body('username').isLength({ min: 3, max: 20 }).withMessage('Kullanıcı adı 3-20 karakter arasında olmalıdır.'),
  body('password').isLength({ min: 8 }).withMessage('Şifre en az 8 karakter olmalıdır.'),
], async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg });
  }

  const { email, username, password, birthDate, bio, publicProfile, nsfwOk, favoriteAnime } = req.body;

  try {
    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) {
      return res.status(409).json({ message: 'Bu e-posta adresi zaten kullanılıyor.' });
    }

    const existingUsername = await prisma.user.findUnique({ where: { username } });
    if (existingUsername) {
      return res.status(409).json({ message: 'Bu kullanıcı adı alınmış.' });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        username,
        passwordHash,
        bio: bio || null,
        birthDate: birthDate || null,
        publicProfile: publicProfile !== undefined ? publicProfile : true,
        nsfwOk: nsfwOk || false,
        favoriteAnime: favoriteAnime && favoriteAnime.length > 0 ? {
          create: favoriteAnime.map((a: any) => ({
            malId: a.mal_id,
            title: a.title,
            imageUrl: a.image_url || null,
          }))
        } : undefined,
      },
    });

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '30d' });

    return res.status(201).json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      }
    });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ message: 'Kayıt sırasında bir sorun oluştu. Lütfen tekrar deneyin.' });
  }
});

// LOGIN
router.post('/login', [
  body('email').notEmpty().withMessage('E-posta veya kullanıcı adı gereklidir.'),
  body('password').notEmpty().withMessage('Şifre gereklidir.'),
], async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg });
  }

  const { email, password } = req.body;

  try {
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email },
          { username: email }
        ]
      },
    });

    if (!user) {
      return res.status(401).json({ message: 'E-posta veya şifre hatalı.' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ message: 'E-posta veya şifre hatalı.' });
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '30d' });

    return res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ message: 'Giriş sırasında bir sorun oluştu.' });
  }
});

// GET CURRENT USER
router.get('/me', async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Yetkilendirme gerekli.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        username: true,
        bio: true,
        avatar: true,
        xp: true,
        itibar: true,
        level: true,
        isPremium: true,
        premiumType: true,
        createdAt: true,
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
    }

    return res.json({ user });
  } catch (err) {
    return res.status(401).json({ message: 'Geçersiz token.' });
  }
});

export default router;