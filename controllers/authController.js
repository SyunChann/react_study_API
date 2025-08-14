const bcrypt = require('bcrypt');
const supabase = require('../db');
const jwt = require('jsonwebtoken');

// 일반 회원가입 (local)
exports.registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  // 필수 값 확인
  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: '이름, 이메일, 비밀번호는 필수입니다.' });
  }

  try {
    // 이메일 중복 확인
    const { data: existingUser, error: selectError } = await supabase
      .from('users')
      .select('email')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(409).json({ success: false, message: '이미 등록된 이메일입니다.' });
    }

    // 비밀번호 암호화
    const hashedPassword = await bcrypt.hash(password, 10);

    // DB 저장 (users table)
    const { data: newUser, error: insertUserError } = await supabase
      .from('users')
      .insert([{ name, email, password: hashedPassword }])
      .select()
      .single();

    if (insertUserError) throw insertUserError;

    // DB 저장 (social_identities table)
    const { error: insertIdentityError } = await supabase
      .from('social_identities')
      .insert({
        user_id: newUser.id,
        provider: 'local',
        provider_id: email,
      });

    if (insertIdentityError) throw insertIdentityError;

    res.status(201).json({ success: true, message: '회원가입 성공. 로그인을 진행해주세요.' });

  } catch (err) {
    console.error('회원가입 에러:', err.message);
    res.status(500).json({ success: false, message: '서버 오류 발생' });
  }
};


// 일반 로그인 (local)
exports.loginUser = async (req, res) => {
  const { email, password } = req.body;

  // 1) 필수 값 확인
  if (!email || !password) {
    return res.status(400).json({ success: false, message: '이메일과 비밀번호는 필수입니다.' });
  }

  try {
    // 2) 사용자 조회
    const { data: user, error: selectError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    // 사용자가 없거나, 비밀번호 필드가 null인 경우 (소셜 로그인 유저)
    if (selectError || !user || !user.password) {
      return res.status(401).json({ success: false, message: '이메일 또는 비밀번호가 틀렸습니다.' });
    }

    // 3) 비밀번호 검증
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ success: false, message: '이메일 또는 비밀번호가 틀렸습니다.' });
    }

    // 4) JWT 발급
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // 5) 응답 (비밀번호 필드 제거)
    delete user.password;
    return res.status(200).json({
      success: true,
      message: '로그인 성공',
      token,
      user,
    });
  } catch (err) {
    console.error('로그인 에러:', err);
    return res.status(500).json({ success: false, message: '서버 오류 발생' });
  }
};