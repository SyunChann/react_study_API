const express = require('express');
const router = express.Router();
const { registerUser, kakaoSignup, loginUser } = require('../controllers/authController');

// 회원가입
router.post('/signup', registerUser);

// 카카오 회원가입
router.post('/auth/kakao/signup', kakaoSignup);

// 로그인 (테스트로 인한 주석)
// router.post('/login', loginUser);

module.exports = router;