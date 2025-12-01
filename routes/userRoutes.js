const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth'); // 내가 준 미들웨어
const { getMe, updateUser } = require('../controllers/userController');

router.get('/user', auth, getMe);
router.put('/user', auth, updateUser);

module.exports = router;