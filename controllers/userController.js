// 유저 crud
const supabase = require('../db');

// 내 정보 조회
exports.getMe = async (req, res) => {
    const userId = req.user.id; // 미들웨어로 체킹
    try {
        const { data, error } = await supabase
        .from('users')
        .select('id,phone,zipcode,addr,detail_addr')
        .eq('id', userId)
        .single();

        if (error) return res.status(500).json({ success:false, message:'DB 오류', detail:error.message });
        if (!data) return res.status(404).json({ success:false, message:'사용자 없음' });

        return res.json({ success:true, user:data });
    } catch (e) {
        return res.status(500).json({ success:false, message:'서버 오류 발생' });
    }
    };

    // 내 정보 수정
    exports.updateUser = async (req, res) => {
    const userId = req.user.id;
    const { name, phone, zipcode, addr, detail_addr } = req.body;

    try {
        const { data, error } = await supabase
        .from('users')
        .update({ name, phone, zipcode, addr, detail_addr })
        .eq('id', userId)
        .select('id,phone,zipcode,addr,detail_addr')
        .single();

        if (error) return res.status(500).json({ success:false, message:'DB 오류', detail:error.message });

        return res.json({ success:true, user:data });
    } catch (e) {
        return res.status(500).json({ success:false, message:'서버 오류 발생' });
    }
};
