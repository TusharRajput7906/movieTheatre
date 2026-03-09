const { Router } = require('express');
const { verifyToken } = require('../middleware/auth.middleware');
const {
  getFavorites,
  syncFavorites,
  toggleFavorite,
  toggleWatchlist,
} = require('../controllers/favorites.controller');

const router = Router();

router.use(verifyToken);

router.get('/',         getFavorites);
router.post('/sync',    syncFavorites);
router.post('/toggle',  toggleFavorite);
router.post('/watchlist/toggle', toggleWatchlist);

module.exports = router;
