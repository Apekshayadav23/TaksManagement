import { Router } from 'express';
import bcrypt from 'bcryptjs';
import asyncHandler from '../utils/asyncHandler.js';
import { User } from '../models/index.js';
import { signToken } from '../utils/auth.js';
import { authenticate } from '../middleware/authenticate.js';
import { badRequest, unauthorized } from '../utils/httpError.js';

const router = Router();

function sanitizeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

router.post(
  '/signup',
  asyncHandler(async (req, res) => {
    const { name, email, password } = req.body ?? {};

    if (!name || name.trim().length < 2) {
      throw badRequest('Name must be at least 2 characters');
    }

    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      throw badRequest('A valid email is required');
    }

    if (!password || password.length < 6) {
      throw badRequest('Password must be at least 6 characters');
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await User.findOne({ where: { email: normalizedEmail } });
    if (existing) {
      throw badRequest('Email already exists');
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: 'member',
    });

    const token = signToken(user);
    res.status(201).json({ token, user: sanitizeUser(user) });
  }),
);

router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { email, password } = req.body ?? {};

    if (!email || !password) {
      throw badRequest('Email and password are required');
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ where: { email: normalizedEmail } });
    if (!user) {
      throw unauthorized('Invalid credentials');
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      throw unauthorized('Invalid credentials');
    }

    const token = signToken(user);
    res.json({ token, user: sanitizeUser(user) });
  }),
);

router.get(
  '/me',
  authenticate,
  asyncHandler(async (req, res) => {
    const user = await User.findByPk(req.user.id);
    if (!user) throw unauthorized('Invalid session');

    res.json({ user: sanitizeUser(user) });
  }),
);

export default router;
