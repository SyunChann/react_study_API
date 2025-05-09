const express = require('express');
const router = express.Router();
const { registerUser, loginUser } = require('../controllers/authController');

// 일반 회원가입
router.post('/signup', registerUser);

// 일반 로그인
router.post('/login', loginUser);

module.exports = router;