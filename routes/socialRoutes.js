const express = require('express');
const router = express.Router();
const { authWithKakao } = require('../controllers/social/kakaoAuthController');
const { authWithGoogle } = require('../controllers/social/googleAuthController');

// 카카오
router.post('/auth/kakao', authWithKakao);

// 구글
router.post('/auth/google', authWithGoogle);

module.exports = router;
