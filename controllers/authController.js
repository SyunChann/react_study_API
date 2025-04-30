const bcrypt = require('bcrypt');
const db = require('../db');
const axios = require('axios');
const jwt = require('jsonwebtoken');

// 일반 회원가입 (local)
exports.registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  // 필수 값 확인
  if (!name || !email || !password) {
    return res.status(400).json({ message: '이름, 이메일, 비밀번호는 필수입니다.' });
  }

  try {
    // 이메일 중복 확인
    const [user] = await db.promise().query('SELECT * FROM users WHERE email = ?', [email]);
    if (user.length > 0) {
      return res.status(409).json({ message: '이미 등록된 이메일입니다.' });
    }

    // 비밀번호 암호화
    const hashedPassword = await bcrypt.hash(password, 10);

    // DB 저장
    await db.promise().query(
      'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
      [name, email, hashedPassword]
    );

    res.status(201).json({ message: '회원가입 성공' });
  } catch (err) {
    console.error('회원가입 에러:', err);
    res.status(500).json({ message: '서버 오류 발생' });
  }
};


// 일반 로그인 (local)
exports.loginUser = async (req, res) => {
  const { email, password } = req.body;

  // 1) 필수 값 확인
  if (!email || !password) {
    return res.status(400).json({ message: '이메일과 비밀번호는 필수입니다.' });
  }

  try {
    // 2) 사용자 조회
    const [rows] = await db.promise().query(
      'SELECT * FROM users WHERE email = ?', [email]
    );

    if (rows.length === 0) {
      // 등록된 이메일이 없음
      return res.status(401).json({ message: '등록되지 않은 이메일이거나 비밀번호가 틀렸습니다.' });
    }

    const user = rows[0];

    // 3) 비밀번호 검증
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ message: '등록되지 않은 이메일이거나 비밀번호가 틀렸습니다.' });
    }

    // 4) JWT 발급
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // 5) 응답
    return res.status(200).json({
      message: '로그인 성공',
      token,
      user: {
        id:    user.id,
        name:  user.name,
        email: user.email,
        provider: user.provider
      }
    });
  } catch (err) {
    console.error('로그인 에러:', err);
    return res.status(500).json({ message: '서버 오류 발생' });
  }
};