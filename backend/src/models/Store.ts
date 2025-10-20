import mongoose, { Schema, Document } from 'mongoose';

export interface IStore extends Document {
  name: string;
  whatsapp: string;
  city?: string;
}

const StoreSchema: Schema = new Schema({
  name: { type: String, required: true },
  whatsapp: { type: String, required: true },
  city: { type: String }
}, { timestamps: true });

export default mongoose.model<IStore>('Store', StoreSchema);
