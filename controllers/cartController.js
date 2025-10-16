const supabase = require('../db');

// 장바구니 조회(product조인)
exports.getCart = async(req,res)=>{
    try{
        const userId = req.user.userId;
        const {data:getCart, error:getCartError}=await supabase
        .from('product_cart')
        .select(`id,product_id,user_id,quantity,
            product:product_id(name,price)`)
        .eq('user_id',userId);

        if(getCartError) throw getCartError;

        if(!getCart || getCart.length === 0){
            return res.status(200).json({success:true,message:'등록된 상품이 없습니다.',data:[]})
        }
        return res.json({success:true,data:getCart})
    }catch(err){
        console.error('장바구니 조회 실패:',err.message);
        return res.status(500).json({success:false,message:'서버오류'})

    }
};

// 장바구니 담기
// 있는 상품 -> 수량 추가
// 없는 상품 -> new

exports.addCart = async(req,res) =>{
    const userId = req.user.userId;
    const {productId,quantity} = req.body;

  try{
    const {data:existingCart,error:existingCartError} = await supabase
    .from('product_cart')
    .select('id,quantity')
    .eq('user_id',userId)
    .eq('product_id',productId)
    .single();
  

    if(existingCartError && existingCartError.code !== 'PGRST116')throw existingCartError; 
    if(!existingCart){
            const {data:addCart,error:addCartError} = await supabase
            .from('product_cart')
            .insert([{product_id:productId,user_id:userId,quantity}])
            .select();

            if (addCartError) throw addCartError;

            res.status(201).json({success:true,message:'장바구니 추가 성공',data:addCart});
        }else{
           

            const newQty = existingCart.quantity +quantity

            const {data:updateCart,error:updateCartError} = await supabase
            .from('product_cart')
            .update({quantity:newQty})
            .eq('product_id',productId)
            .eq('user_id',userId)
            .select();

            if(updateCartError) throw updateCartError;
            return res.json({success:true,message:'수정 성공',data:updateCart});
        }
    }catch(err){
            console.error('장바구니 추가 에러: ',err.message);
            res.status(500).json({success:false,message:'서버 오류'});
        }
}





// 항목 삭제
exports.deleteCart = async(req,res)=>{
    const userId = req.user.userId;
    const {cartId} = req.body;
    try{
        const { data:deleteCart,error:deleteCartError } = await supabase
        .from('product_cart')
        .delete()
        .eq('user_id',userId)
        .eq('id',cartId);
    
        if(deleteCartError){
            console.error('상품 삭제 오류',deleteCartError);
            return res.status(400).json({success:false,message:'삭제 실패'});
        }

        if(!deleteCart || deleteCart.length === 0 ){ // 삭제 명령은 성공, 실제로 지워진 행은 없음 => supabase가 조건에 맞는 데이터를 못 찾았을 때
            return res.status(404).json({success:false,message:'해당 상품이 장바구니에 없습니다.'})
        }
        return res.json({success:true,message:'삭제 성공'})

    }catch(err){
        console.error('삭제 실패',err);
        return res.status(500).json({success:false,message:'서버 오류'});
    }
}








// 전체 삭제 
exports.clearCart = async(req,res)=>{
    const userId = req.user.userId;
    try{
        const {data:clearCart,error:clearCartError} = await supabase
        .from('product_cart')
        .delete()
        .eq('user_id',userId);

        if(clearCartError){
            console.error('장바구니 비우기 오류',clearCartError);
            return res.status(400).json({success:false,message:'비우기 실패'});
        }
        if(!clearCart || clearCart.length === 0) {
            return res.status(200).json({success:true,message:'이미 비어있는 장바구니입니다.'})
        }
        return res.status(200).json({success:true,message:'비우기 성공'});

    }catch(err){
        console.error('비우기 실패', err);
        return res.status(500).json({success:false,message:'서버 오류'});

    }
};