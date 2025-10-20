import { Request, Response } from 'express';
import Product from '../models/Product';
import Store from '../models/Store';

/**
 * For create/update: this controller expects multipart/form-data.
 * Files are processed by multer + Cloudinary and are available at req.files (array).
 * Other fields come in req.body (strings). For arrays (colors, stores) the frontend should send JSON strings or multiple fields.
 */

const parseArrayField = (field: any) => {
  if (!field) return [];
  if (Array.isArray(field)) return field;
  try { return JSON.parse(field); } catch { return [field]; }
};

export const getProducts = async (req: Request, res: Response) => {
  const { q, store, minPrice, maxPrice, category, isPromotion } = req.query as any;
  const filter: any = {};

  if (q) filter.name = { $regex: q, $options: 'i' };
  if (store) filter.stores = store;
  if (category) filter.category = category;
  if (isPromotion !== undefined) filter.isPromotion = isPromotion === 'true';
  if (minPrice || maxPrice) filter.price = {};
  if (minPrice) filter.price.$gte = Number(minPrice);
  if (maxPrice) filter.price.$lte = Number(maxPrice);

  const products = await Product.find(filter).populate('stores');
  res.json(products);
};

export const getProduct = async (req: Request, res: Response) => {
  const product = await Product.findById(req.params.id).populate('stores');
  if (!product) return res.status(404).json({ message: 'Produto não encontrado' });
  res.json(product);
};

export const createProduct = async (req: Request, res: Response) => {
  try {
    const { name, description, price, storage, ram, colors, isPromotion, category, stores } = req.body;

    const images: string[] = [];
    const files = req.files as Express.Multer.File[] | undefined;
    if (files && files.length) {
      for (const f of files.slice(0,3)) {
        if ((f as any).path) images.push((f as any).path);
        else if ((f as any).secure_url) images.push((f as any).secure_url);
      }
    }

    const storesIds = parseArrayField(stores);
    const colorsArr = parseArrayField(colors);

    const product = new Product({
      name, description, price: Number(price) || 0, storage, ram,
      colors: colorsArr,
      isPromotion: isPromotion === 'true' || isPromotion === true,
      category: category || 'aparelho',
      stores: storesIds,
      images
    });
    await product.save();
    const populated = await product.populate('stores');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao criar produto', error: err });
  }
};

export const updateProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { colors, stores, isPromotion, price, ...rest } = req.body;
    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ message: 'Produto não encontrado' });

    // handle files
    const files = req.files as Express.Multer.File[] | undefined;
    if (files && files.length) {
      const images: string[] = [];
      for (const f of files.slice(0,3)) {
        if ((f as any).path) images.push((f as any).path);
        else if ((f as any).secure_url) images.push((f as any).secure_url);
      }
      product.images = images;
    }

    if (colors) product.colors = parseArrayField(colors);
    if (stores) product.stores = parseArrayField(stores);
    if (price) product.price = Number(price);

    Object.assign(product, rest);
    await product.save();
    res.json(await product.populate('stores'));
  } catch (err) {
    res.status(500).json({ message: 'Erro ao atualizar produto', error: err });
  }
};

export const deleteProduct = async (req: Request, res: Response) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: 'Produto removido' });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao remover produto', error: err });
  }
};
