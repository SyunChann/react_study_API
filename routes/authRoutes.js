const express = require('express');
const router = express.Router();
const { registerUser, loginUser, kakaoSignup  } = require('../controllers/authController');

// 회원가입
router.post('/signup', registerUser);

// 카카오 회원가입
router.post('/auth/kakao/signup', kakaoSignup);

// 로그인 (테스트로 인한 주석)
// router.post('/login', loginUser);

//카카오 회원가입
router.post('/auth/kakao/signup', kakaoSignup);

module.exports = router;