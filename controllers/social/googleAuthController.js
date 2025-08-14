const supabase = require('../../db');
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
      return res.status(400).json({ success: false, message: 'Google 계정 정보가 충분하지 않습니다.' });
    }

    // 3. 사용자 조회
    const { data: existingUser, error: selectError } = await supabase
      .from('users')
      .select('*')
      .or(`google_id.eq.${id},email.eq.${email}`)
      .single();

    // ✅ 로그인 시도일 경우
    if (mode === 'login') {
      if (selectError || !existingUser) {
        return res.status(404).json({
          success: false,
          message: '등록되지 않은 사용자입니다.',
          status: 'not_found'
        });
      }

      const token = jwt.sign({ userId: existingUser.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

      return res.status(200).json({
        success: true,
        message: '로그인 성공',
        token,
        user: existingUser,
        status: 'login',
      });
    }

    // ✅ 회원가입 시도일 경우
    if (existingUser) {
      return res.status(200).json({
        success: true,
        message: '이미 가입된 사용자입니다.',
        user: existingUser,
        status: 'exists',
      });
    }

    // 4. 신규 가입 처리
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert([{ name, email, google_id: id, provider: 'google' }])
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    const token = jwt.sign({ userId: newUser.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    return res.status(201).json({
      success: true,
      message: '회원가입 성공',
      token,
      user: newUser,
      status: 'new',
    });

  } catch (err) {
    console.error('Google 인증 오류:', err?.response?.data || err);
    return res.status(500).json({ success: false, message: 'Google 인증 실패' });
  }
};