import { Request, Response } from 'express';
import User from '../models/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ message: 'Credenciais inválidas' });

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(401).json({ message: 'Credenciais inválidas' });

  const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, process.env.JWT_SECRET as string, { expiresIn: '7d' });
  res.json({ token, user: { name: user.name, email: user.email, role: user.role } });
};
