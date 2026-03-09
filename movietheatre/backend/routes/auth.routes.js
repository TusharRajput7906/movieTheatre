const { Router } = require('express');
const { body } = require('express-validator');
const { register, login, getProfile, promoteAdmin } = require('../controllers/auth.controller');
const { verifyToken } = require('../middleware/auth.middleware');

const router = Router();

router.post(
  '/register',
  [
    body('name').trim().isLength({ min: 2, max: 50 }).withMessage('Name must be 2–50 chars'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 chars'),
  ],
  register
);

router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password required'),
  ],
  login
);

router.get('/profile', verifyToken, getProfile);

// One-time admin promotion (requires ADMIN_SETUP_CODE env var)
router.post('/promote-admin', promoteAdmin);

module.exports = router;
