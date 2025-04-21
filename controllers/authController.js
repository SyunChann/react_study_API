const bcrypt = require('bcrypt');
const db = require('../db');
const axios = require('axios');

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



//카카오 회원가입 테스트
exports.kakaoSignup = async (req, res) => {
  const { code } = req.body;

  try {
    // 1. 카카오 토큰 요청
    const tokenRes = await axios.post("https://kauth.kakao.com/oauth/token", null, {
      params: {
        grant_type: "authorization_code",
        client_id: process.env.KAKAO_REST_API_KEY,
        redirect_uri: "http://localhost:3000/kakao-redirect",
        code,
      },
      headers: { "Content-Type": "application/x-www-form-urlencoded;charset=utf-8" },
    });

    const accessToken = tokenRes.data.access_token;

    // 2. 사용자 정보 요청
    const userRes = await axios.get("https://kapi.kakao.com/v2/user/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const kakaoData = userRes.data;
    const kakaoId = kakaoData.id;
    const email = kakaoData.kakao_account.email;
    const name = kakaoData.kakao_account.profile.nickname;

    // 3. MySQL에서 카카오 ID or 이메일로 기존 유저 확인
    const [existingUsers] = await db
      .promise()
      .query("SELECT * FROM users WHERE kakao_id = ? OR email = ?", [kakaoId, email]);

    let user;

    if (existingUsers.length > 0) {
      user = existingUsers[0]; // 이미 존재하는 유저
    } else {
      // 4. 신규 유저 등록
      await db
        .promise()
        .query("INSERT INTO users (name, email, kakao_id, provider) VALUES (?, ?, ?, ?)", [
          name,
          email,
          kakaoId,
          'kakao',
        ]);

      // 새로 등록된 유저 정보 조회
      const [newUser] = await db
        .promise()
        .query("SELECT * FROM users WHERE kakao_id = ?", [kakaoId]);

      user = newUser[0];
    }

    // 5. JWT 발급
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    // 프론트에 전달 (ex: localStorage 저장 or HttpOnly 쿠키 설정)
    res.json({ token, user });
  } catch (err) {
    console.error("카카오 인증 오류:", err);
    res.status(500).json({ message: "카카오 로그인 실패" });
  }
};
