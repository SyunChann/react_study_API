const express = require('express');
const router = express.Router();
const { registerUser, loginUser } = require('../controllers/authController');

// 회원가입
router.post('/signup', registerUser);

// 로그인 (테스트로 인한 주석)
// router.post('/login', loginUser);

module.exports = router;