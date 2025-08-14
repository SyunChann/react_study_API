const supabase = require('../../db');
const axios = require('axios');
const jwt = require('jsonwebtoken');

exports.authWithKakao = async (req, res) => {
  const { code, mode = 'signup' } = req.body;
  const redirectUri = `http://localhost:3000/kakao-redirect?mode=${mode}`;

  try {
    const tokenRes = await axios.post("https://kauth.kakao.com/oauth/token", null, {
      params: {
        grant_type: "authorization_code",
        client_id: process.env.KAKAO_REST_API_KEY,
        redirect_uri: redirectUri,
        code,
      },
      headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=utf-8"
      },
    });

    const accessToken = tokenRes.data.access_token;

    const userRes = await axios.get("https://kapi.kakao.com/v2/user/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const kakaoData = userRes.data;
    const kakaoId = kakaoData.id;
    const email = kakaoData.kakao_account?.email;
    const name = kakaoData.kakao_account?.profile?.nickname;

    if (!email || !name) {
      return res.status(400).json({ success: false, message: '카카오 계정 정보가 충분하지 않습니다.' });
    }

    const { data: existingUser, error: selectError } = await supabase
      .from('users')
      .select('*')
      .or(`kakao_id.eq.${kakaoId},email.eq.${email}`)
      .single();

    // 로그인 시도
    if (mode === 'login') {
      if (selectError || !existingUser) {
        return res.status(404).json({
          success: false,
          message: '등록되지 않은 사용자입니다.',
          status: 'not_found'
        });
      }

      const token = jwt.sign({ userId: existingUser.id }, process.env.JWT_SECRET, {
        expiresIn: '7d',
      });

      return res.status(200).json({
        success: true,
        message: '로그인 성공',
        token,
        user: existingUser,
        status: 'login',
      });
    }

    // 회원가입 시도
    if (existingUser) {
      return res.status(200).json({
        success: true,
        message: '이미 가입된 사용자입니다.',
        user: existingUser,
        status: 'exists',
      });
    }

    // 신규 가입
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert([{ name, email, kakao_id: kakaoId, provider: 'kakao' }])
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    const token = jwt.sign({ userId: newUser.id }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    return res.status(201).json({
      success: true,
      message: '회원가입 성공',
      token,
      user: newUser,
      status: 'new',
    });

  } catch (err) {
    console.error("카카오 인증 오류:", err?.response?.data || err);
    return res.status(500).json({ success: false, message: "카카오 인증 실패" });
  }
};