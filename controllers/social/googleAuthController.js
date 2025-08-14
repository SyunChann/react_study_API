const supabase = require('../../db');
const axios = require('axios');
const jwt = require('jsonwebtoken');

exports.authWithGoogle = async (req, res) => {
  const { code } = req.body;
  const redirectUri = `http://localhost:3000/google-redirect`;

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

    const { id: googleId, email, name } = userRes.data;
    if (!email || !name) {
      return res.status(400).json({ success: false, message: 'Google 계정 정보가 충분하지 않습니다.' });
    }

    // 3. id 확인
    let { data: identity, error: identityError } = await supabase
      .from('social_identities')
      .select('*, users(*)')
      .eq('provider', 'google')
      .eq('provider_id', googleId)
      .single();

    if (identity) {
      const user = identity.users;
      const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
      return res.status(200).json({
        success: true,
        message: '로그인 성공',
        token,
        user,
      });
    }

    // 4. 이메일로 확인
    let { data: existingUser, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (existingUser) {
      const { error: newIdentityError } = await supabase
        .from('social_identities')
        .insert({
          user_id: existingUser.id,
          provider: 'google',
          provider_id: googleId,
        });

      if (newIdentityError) throw newIdentityError;

      const token = jwt.sign({ userId: existingUser.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
      return res.status(200).json({
        success: true,
        message: '기존 계정에 Google 계정을 연결하고 로그인했습니다.',
        token,
        user: existingUser,
      });
    }

    // 5. 신규처리
    const { data: newUser, error: newUserError } = await supabase
      .from('users')
      .insert({ name, email })
      .select()
      .single();

    if (newUserError) throw newUserError;

    const { error: finalIdentityError } = await supabase
      .from('social_identities')
      .insert({
        user_id: newUser.id,
        provider: 'google',
        provider_id: googleId,
      });

    if (finalIdentityError) throw finalIdentityError;

    const token = jwt.sign({ userId: newUser.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    return res.status(201).json({
      success: true,
      message: '새로운 계정을 생성하고 로그인했습니다.',
      token,
      user: newUser,
    });

  } catch (err) {
    console.error('Google 인증 오류:', err?.response?.data || err.message);
    return res.status(500).json({ success: false, message: 'Google 인증 중 서버 오류가 발생했습니다.' });
  }
};