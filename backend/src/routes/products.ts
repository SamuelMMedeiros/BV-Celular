import express from 'express';
import { getProducts, getProduct, createProduct, updateProduct, deleteProduct } from '../controllers/productController';
import { verifyToken } from '../middlewares/authMiddleware';
import { upload } from '../services/multer';
const router = express.Router();

router.get('/', getProducts);
router.get('/:id', getProduct);
// create with multipart form-data, images under field 'images'
router.post('/', verifyToken, upload.array('images', 3), createProduct);
router.put('/:id', verifyToken, upload.array('images', 3), updateProduct);
router.delete('/:id', verifyToken, deleteProduct);

export default router;
