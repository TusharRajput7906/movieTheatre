const { Router } = require('express');
const { verifyToken } = require('../middleware/auth.middleware');
const { verifyAdmin } = require('../middleware/admin.middleware');
const {
  getStats,
  getAllUsers, banUser, unbanUser, deleteUser,
  getCustomMovies, addCustomMovie, updateCustomMovie, deleteCustomMovie,
} = require('../controllers/admin.controller');

const router = Router();

// All admin routes require valid JWT + admin role
router.use(verifyToken, verifyAdmin);

/* ── Stats ──────────────────────────────── */
router.get('/stats', getStats);

/* ── User management ────────────────────── */
router.get('/users',              getAllUsers);
router.put('/users/:id/ban',      banUser);
router.put('/users/:id/unban',    unbanUser);
router.delete('/users/:id',       deleteUser);

/* ── Custom movie management ────────────── */
router.get('/movies',             getCustomMovies);
router.post('/movies',            addCustomMovie);
router.put('/movies/:id',         updateCustomMovie);
router.delete('/movies/:id',      deleteCustomMovie);

module.exports = router;
