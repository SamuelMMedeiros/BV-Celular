import mongoose, { Schema, Document } from 'mongoose';

export interface IProduct extends Document {
  name: string;
  description?: string;
  price: number;
  storage?: string;
  ram?: string;
  colors?: string[];
  isPromotion?: boolean;
  category: 'aparelho' | 'acessorio';
  stores: mongoose.Types.ObjectId[];
  images: string[];
}

const ProductSchema: Schema = new Schema({
  name: { type: String, required: true },
  description: { type: String },
  price: { type: Number, default: 0 },
  storage: { type: String },
  ram: { type: String },
  colors: [{ type: String }],
  isPromotion: { type: Boolean, default: false },
  category: { type: String, enum: ['aparelho', 'acessorio'], default: 'aparelho' },
  stores: [{ type: Schema.Types.ObjectId, ref: 'Store' }],
  images: [{ type: String }]
}, { timestamps: true });

export default mongoose.model<IProduct>('Product', ProductSchema);
