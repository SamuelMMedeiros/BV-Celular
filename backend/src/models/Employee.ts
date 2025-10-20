import mongoose, { Schema, Document } from 'mongoose';

export interface IEmployee extends Document {
  name: string;
  email: string;
  password: string;
  store?: mongoose.Types.ObjectId;
}

const EmployeeSchema: Schema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  store: { type: Schema.Types.ObjectId, ref: 'Store' }
}, { timestamps: true });

export default mongoose.model<IEmployee>('Employee', EmployeeSchema);
