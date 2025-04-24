const db = require('../../db');
const axios = require('axios');
const jwt = require('jsonwebtoken');

exports.authWithGoogle = async (req, res) => {
  const { code, mode = 'signup' } = req.body;
  const redirectUri = `http://localhost:3000/google-redirect?mode=${mode}`;

  try {
    // 1. Google 토큰 요청
    const tokenRes = await axios.post('https://oauth2.googleapis.com/token', {
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    });

    const { access_token } = tokenRes.data;

    // 2. 사용자 정보 요청
    const userRes = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    const { id, email, name } = userRes.data;
    if (!email || !name) {
      return res.status(400).json({ message: 'Google 계정 정보가 충분하지 않습니다.' });
    }

    // 3. 사용자 조회
    const [existingUsers] = await db
      .promise()
      .query("SELECT * FROM users WHERE google_id = ? OR email = ?", [id, email]);

    // ✅ 로그인 시도일 경우
    if (mode === 'login') {
      if (existingUsers.length === 0) {
        return res.status(404).json({
          message: '등록되지 않은 사용자입니다.',
          status: 'not_found'
        });
      }

      const user = existingUsers[0];
      const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

      return res.status(200).json({
        message: '로그인 성공',
        token,
        user,
        status: 'login',
      });
    }

    // ✅ 회원가입 시도일 경우
    if (existingUsers.length > 0) {
      return res.status(200).json({
        message: '이미 가입된 사용자입니다.',
        user: existingUsers[0],
        status: 'exists',
      });
    }

    // 4. 신규 가입 처리
    await db.promise().query(
      "INSERT INTO users (name, email, google_id, provider) VALUES (?, ?, ?, ?)",
      [name, email, id, 'google']
    );

    const [newUser] = await db
      .promise()
      .query("SELECT * FROM users WHERE google_id = ?", [id]);

    const user = newUser[0];
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    return res.status(201).json({
      message: '회원가입 성공',
      token,
      user,
      status: 'new',
    });

  } catch (err) {
    console.error('Google 인증 오류:', err?.response?.data || err);
    return res.status(500).json({ message: 'Google 인증 실패' });
  }
};