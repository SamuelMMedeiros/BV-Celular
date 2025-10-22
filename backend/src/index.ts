import express from 'express';
import dotenv from 'dotenv';
//@ets-ignore
import cors from 'cors';
import connectDB from './config/db';
import productRoutes from './routes/products';
import storeRoutes from './routes/stores';
import employeeRoutes from './routes/employees';
import authRoutes from './routes/auth';
import { errorHandler } from './middlewares/errorHandler';

dotenv.config();

const PORT = process.env.PORT || 5000;
const app = express();

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(cors({
  origin: process.env.CORS_ORIGIN || '*'
}));

connectDB();

// routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/employees', employeeRoutes);

// error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
