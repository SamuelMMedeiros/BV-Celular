import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User';
import bcrypt from 'bcryptjs';
import connectDB from '../config/db';
dotenv.config();

const run = async () => {
  await connectDB();
  const email = process.env.SEED_ADMIN_EMAIL || 'admin@martins.tech';
  const password = process.env.SEED_ADMIN_PASS || 'admin123';
  const existing = await User.findOne({ email });
  if (existing) {
    console.log('Admin já existe');
    process.exit(0);
  }
  const hashed = await bcrypt.hash(password, 10);
  const user = new User({ name: 'Admin', email, password: hashed, role: 'admin' });
  await user.save();
  console.log('Admin criado:', email, '/', password);
  process.exit(0);
};

run();
