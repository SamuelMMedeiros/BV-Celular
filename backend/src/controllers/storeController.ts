import { Request, Response } from 'express';
import Store from '../models/Store';

export const getStores = async (req: Request, res: Response) => {
  const stores = await Store.find();
  res.json(stores);
};

export const createStore = async (req: Request, res: Response) => {
  const { name, whatsapp, city } = req.body;
  const store = new Store({ name, whatsapp, city });
  await store.save();
  res.status(201).json(store);
};

export const updateStore = async (req: Request, res: Response) => {
  const store = await Store.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!store) return res.status(404).json({ message: 'Loja não encontrada' });
  res.json(store);
};

export const deleteStore = async (req: Request, res: Response) => {
  await Store.findByIdAndDelete(req.params.id);
  res.json({ message: 'Loja removida' });
};
