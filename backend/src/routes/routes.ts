import express from 'express';
import { createUser, deleteUser, getUsers, searchUsers, updateUserAccess } from '../controllers/controller.js';
import { login, register } from '../controllers/auth.js';
import {
	createFinanceRecord,
	deleteFinanceRecord,
	getAllFinanceRecords,
	getFinanceAnalytics,
	getMyFinanceRecords,
	updateFinanceRecord,
} from '../controllers/financeController.js';
import {
	getAllDataAccessRequests,
	getMyDataAccessRequests,
	requestDataAccess,
	reviewDataAccessRequest,
	revokeDataAccess,
} from '../controllers/permissionController.js';
import { checkRole, protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public
router.post('/login', login);
router.post('/register', register);

// User management (admin full control)
router.post('/create', protect, checkRole('admin'), createUser);
router.get('/', protect, checkRole('admin'), getUsers);
router.get('/search', protect, checkRole('admin', 'analyst'), searchUsers);
router.patch('/manage/:id', protect, checkRole('admin'), updateUserAccess);
router.delete('/manage/:id', protect, checkRole('admin'), deleteUser);

// Role examples for assignment
router.get('/admin', protect, checkRole('admin'), (_req, res) => {
	res.status(200).json({ message: 'Admin route access granted' });
});

router.get('/edit', protect, checkRole('admin', 'analyst'), (_req, res) => {
	res.status(200).json({ message: 'Edit route access granted' });
});

router.get('/view', protect, checkRole('admin', 'analyst', 'viewer'), (_req, res) => {
	res.status(200).json({ message: 'View route access granted' });
});

// Finance rules
router.post('/finance/create', protect, checkRole('admin'), createFinanceRecord);
router.get('/finance', protect, checkRole('admin', 'analyst'), getAllFinanceRecords);
router.get('/finance/analytics', protect, checkRole('admin', 'analyst', 'viewer'), getFinanceAnalytics);
router.get('/finance/my', protect, checkRole('admin', 'analyst', 'viewer'), getMyFinanceRecords);
router.put('/finance/:id', protect, checkRole('admin'), updateFinanceRecord);
router.delete('/finance/:id', protect, checkRole('admin'), deleteFinanceRecord);

// Analyst access requests
router.post('/permissions/request', protect, checkRole('analyst', 'admin'), requestDataAccess);
router.get('/permissions/my', protect, checkRole('analyst', 'admin'), getMyDataAccessRequests);
router.get('/permissions/requests', protect, checkRole('admin'), getAllDataAccessRequests);
router.patch('/permissions/requests/:id', protect, checkRole('admin'), reviewDataAccessRequest);
router.delete('/permissions/requests/:id', protect, checkRole('admin'), revokeDataAccess);

export default router;