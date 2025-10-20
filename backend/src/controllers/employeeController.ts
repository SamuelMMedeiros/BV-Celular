import { Request, Response } from 'express';
import Employee from '../models/Employee';
import bcrypt from 'bcryptjs';

export const getEmployees = async (req: Request, res: Response) => {
  const employees = await Employee.find().populate('store');
  res.json(employees);
};

export const createEmployee = async (req: Request, res: Response) => {
  const { name, email, password, store } = req.body;
  const hashed = await bcrypt.hash(password, 10);
  const emp = new Employee({ name, email, password: hashed, store });
  await emp.save();
  res.status(201).json(emp);
};

export const updateEmployee = async (req: Request, res: Response) => {
  const { password, ...rest } = req.body;
  const updateData: any = { ...rest };
  if (password) updateData.password = await bcrypt.hash(password, 10);
  const emp = await Employee.findByIdAndUpdate(req.params.id, updateData, { new: true });
  if (!emp) return res.status(404).json({ message: 'Funcionário não encontrado' });
  res.json(emp);
};

export const deleteEmployee = async (req: Request, res: Response) => {
  await Employee.findByIdAndDelete(req.params.id);
  res.json({ message: 'Funcionário removido' });
};
