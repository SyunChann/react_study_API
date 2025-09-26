const supabase = require('../db');


// 등록
exports.createNotice = async(req,res)=>{
    const { title,content } = req.body;

    if(!title || !content){
        return res.status(400).json({success: false, message:'제목, 내용을 입력해주세요!'})
    }

    try{
        const {data: newNotice,error:insertNoticeError} = await supabase
            .from('notice')
            .insert([{title,content}])
            .select()
            .single();

            if(insertNoticeError) throw insertNoticeError;

            res.status(201).json({success:true,message:'공지등록 성공!',data:newNotice});
    }catch(err){
        console.error('공지등록 에러: ',err.message);
        res.status(500).json({success: false, message:'서버 오류'})
    }
};

// 조회(개별)
exports.getNoticeById = async (req,res) => {
    const { id } = req.params;

    try{
        const{ data: getNotice, error: getNoticeByIdError} = await supabase
        .from('notice')
        .select('*')
        .eq('notice_id',id)
        .single();

        if(getNoticeByIdError){
            console.log('공지 아이디 조회 결과 없음 ', getNoticeByIdError);
            return res.status(404).json({success:false,message:"해당 공지를 찾을 수 없습니다."});           
        }
        return res.json({success: true,data:getNotice})
    }catch(err){
        console.error("공지 아이디 조회 실패: ",err);
        return res.status(500).json({success:false,message:'서버 오류 발생 '});            
    }
};
    //조회(전체)
    exports.getAllNotices= async(req,res)=>{
        try{
            const { data:notices , error:getAllProductsError } = await supabase
                .from('notice')
                .select('*');
            if(!notices || notices.length === 0){
                return res.status(400).json({ success: false, message:'공지를 찾을 수 없습니다.' })
            }

            if(this.getAllNoticesError) throw getAllProductsError;

            return res.json({success:true, data:notices});
        }catch(err){
            console.error('전체 공지 조회 실패: ',err.message);
            return res.status(500).json({success:false,message:'서버 오류 발생'})

        }
    };

    //수정
    exports.updateNotice = async (req,res) => {
        const { id } = req.params;
        const { title, content } = req.body;

        //payload: 실제로 업데이트에 보낼 내용물
        const payload = {
            ...(title !== undefined && {title}),
            ...(content !== undefined && {content}),
            updated_at: new Date().toISOString(),
        };

        try{
            const {data:updatedNotice, error:updateNoticeError} = await supabase
            .from('notice')
            .update(payload)
            .eq('notice_id',id)
            .select()
            .single(); 
            
            if(updateNoticeError) throw updateNoticeError;

        }catch(err){
            console.error('수정 에러',err.message);
            res.status(500).json({success:false,message:'서버 오류 발생'});
        }
    }


    exports.deleteNotice = async(req,res)=>{
        const { id } =req.params;
        try{
            const {data, error} = await supabase
            .from('notice')
            .delete
            .eq('notice_id',id)
            .select();

            if(error){
                console.error('공지사항 삭제 오류',error);
                return res.status(400).json({success:false,message:'삭제 실패'});
            }

            if(!data||data.length ===0){
                return res.status(404).json({success:false,message:"해당 상품이 없습니다."})
            }
            return res.jon({success: true, message:'삭제 성공'});
        }catch(err){
            console.error('삭제 실패',err);
            return res.status(500).json({success:false,message:'서버 오류 발생'});
        }

    }