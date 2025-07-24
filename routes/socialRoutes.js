const express = require('express');
const router = express.Router();
const { authWithKakao } = require('../controllers/social/kakaoAuthController');
const { authWithGoogle } = require('../controllers/social/googleAuthController');

/**
 * @swagger
 * tags:
 *   name: Social Authentication
 *   description: Social media authentication
 */

/**
 * @swagger
 * /api/auth/kakao:
 *   post:
 *     summary: Authenticate with Kakao
 *     tags: [Social Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               accessToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: User authenticated successfully
 *       401:
 *         description: Unauthorized
 */

// 카카오
router.post('/auth/kakao', authWithKakao);

/**
 * @swagger
 * /api/auth/google:
 *   post:
 *     summary: Authenticate with Google
 *     tags: [Social Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               accessToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: User authenticated successfully
 *       401:
 *         description: Unauthorized
 */

// 구글
router.post('/auth/google', authWithGoogle);

module.exports = router;
