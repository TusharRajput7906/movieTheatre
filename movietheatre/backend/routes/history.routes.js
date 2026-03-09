const { Router } = require('express');
const { verifyToken } = require('../middleware/auth.middleware');
const { getHistory, addToHistory, clearHistory } = require('../controllers/history.controller');

const router = Router();

router.use(verifyToken);

router.get('/',    getHistory);
router.post('/',   addToHistory);
router.delete('/', clearHistory);

module.exports = router;
