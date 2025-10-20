import express from 'express';
import { getStores, createStore, updateStore, deleteStore } from '../controllers/storeController';
import { verifyToken } from '../middlewares/authMiddleware';
const router = express.Router();

router.get('/', getStores);
router.post('/', verifyToken, createStore);
router.put('/:id', verifyToken, updateStore);
router.delete('/:id', verifyToken, deleteStore);

export default router;
