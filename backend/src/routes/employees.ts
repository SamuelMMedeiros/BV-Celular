import express from 'express';
import { getEmployees, createEmployee, updateEmployee, deleteEmployee } from '../controllers/employeeController';
import { verifyToken, requireAdmin } from '../middlewares/authMiddleware';
const router = express.Router();

router.get('/', verifyToken, getEmployees);
router.post('/', verifyToken, requireAdmin, createEmployee);
router.put('/:id', verifyToken, requireAdmin, updateEmployee);
router.delete('/:id', verifyToken, requireAdmin, deleteEmployee);

export default router;
