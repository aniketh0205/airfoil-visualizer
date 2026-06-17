const express = require('express');
const router = express.Router();
const { login, requireAuth } = require('../middleware/auth');
const { getAll, create, update, remove } = require('../controllers/contentController');

router.post('/auth/login', login);
router.get('/content', getAll);
router.post('/content', requireAuth, create);
router.put('/content/:id', requireAuth, update);
router.delete('/content/:id', requireAuth, remove);

module.exports = router;
