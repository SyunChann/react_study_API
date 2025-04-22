const express = require('express');
const router = express.Router();
const { registerUser, loginUser, authWithKakao } = require('../controllers/authController');

// 일반 회원가입
router.post('/signup', registerUser);

// 카카오 인증 통합
router.post('/auth/kakao', authWithKakao);

// 일반 로그인 - 구현 시 주석 해제
// router.post('/login', loginUser);

module.exports = router;
