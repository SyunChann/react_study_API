const bcrypt = require('bcrypt');
const db = require('../db');

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
