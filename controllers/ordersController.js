const supabase = require('../db');

const userId = 27;

// 사용자 기본주소 조회
async function getUserDefaultAddr(userId) {
    const {data:userAddr,error:userAddrError} = await supabase
        .from('users')
        .select('zipcode,addr,detail_addr,name,phone')
        .eq('id',userId)
        .single();

    if(userAddrError) throw userAddrError;
    
    return {  
        zipcode:userAddr.zipcode,
        addr:userAddr.addr,
        detailAddr:userAddr.detail_addr,
        receiverName:userAddr.name,
        receiverPhone:userAddr.phone
    };
}

exports.getUserDefaultAddr = getUserDefaultAddr;

// 상품 조회
async function getProduct(productId) {

    const {data:product,error:productError} = await supabase
        .from('product')
        .select('id,name,price,stock_quantity')
        .eq('id',productId)
        .single();
             
    if(productError) throw productError;
    return product;
    
}

// 주문 생성
async function createOrderHeader(userId, finalAddr, totalPrice){
    const{data:order,error:orderError} = await supabase
        .from('orders')
        .insert({
            user_id:userId,
            order_date:new Date().toISOString(),
            total_price: totalPrice,
            zipcode:finalAddr.zipcode,
            addr:finalAddr.addr,
            detail_addr:finalAddr.detailAddr,
            receiver_name:finalAddr.receiverName,
            receiver_phone:finalAddr.receiverPhone
        })
        .select()
        .single();

    if(orderError) throw orderError;
    return order;   
}

// 주문 상세 생성
async function createOrderDetail(orderId,product,quantity) {
    const {data:orderDetail,error:orderDetailError} = await supabase
        .from('orders_detail')
        .insert({
            order_id:orderId,
            product_id:product.id,
            product_price:product.price,
            quantity:quantity,
            status:'상품준비중'
        })
        .select()
        .single();

    if (orderDetailError) throw orderDetailError;
    return orderDetail;
}

// 재고 차감
async function updateStock(productId,stock,quantity) {
    const {data:qty,error:qtyError} = await supabase
        .from('product')
        .update({stock_quantity:stock - quantity})
        .eq('id',productId)
        .select('id,stock_quantity')
        .single();
        
    if(qtyError) throw qtyError;
    return qty;
}

// 장바구니 조회
async function getCartList(userId) {
    const {data:cartItems,error:cartItemError} = await supabase
    .from('product_cart')
    .select('id,product_id,quantity')
    .eq('user_id',userId);

    if(cartItemError) throw cartItemError;
    if(!cartItems || cartItems.length === 0){
        throw new Error('장바구니가 비어 있습니다.');
    }
    if(cartItems.some(item => item.quantity < 1)){
        throw new Error('잘못된 수량이 포함되어 있습니다.');
    }
    return cartItems;
}

// 장바구니 삭제
async function deleteCartItem(userId,productId){
    const {data:cartItem,error:cartItemError} = await supabase
    .from('product_cart')
    .delete()
    .eq('user_id',userId)
    .eq('product_id',productId)
    .select();

    if (cartItemError) throw cartItemError; 
    
    return cartItem;
}

// 주문 생성(장바구니, 바로주문)
exports.createOrder = async(req,res)=>{
    // console.log("📦 [CREATE ORDER] req.body =", req.body);
    try {
        const userAddr = await getUserDefaultAddr(userId);
        const { productId, quantity, zipcode, addr, detailAddr, receiverName, receiverPhone, cartItemIds } = req.body;
        const finalAddr = {...userAddr,zipcode,addr,detailAddr,receiverName,receiverPhone};

        if(!finalAddr.zipcode || !finalAddr.addr || !finalAddr.detailAddr || !finalAddr.receiverName || !finalAddr.receiverPhone){
        return res.status(400).json({success:false,message:'주소나 수령인 정보를 확인해주세요'})
        }

        if(productId){
        // 바로 주문
            const product = await getProduct(productId);
             if(product.stock_quantity<quantity){
                return res.status(409).json({success:false,message:'재고가 부족합니다.'});
             }
             
            const totalPrice = product.price * quantity;
            const order = await createOrderHeader(userId,finalAddr,totalPrice);
            await createOrderDetail(order.id,product,quantity);
            await updateStock(productId,product.stock_quantity,quantity);

            return res.status(201).json({success:true,message:'주문생성',orderId:order.id});
        
        }else{
        //장바구니
        const cartList = await getCartList(userId);
        let targetCartItems = cartList;
        if(Array.isArray(cartItemIds) && cartItemIds.length>0){
            targetCartItems= cartList.filter(item=>cartItemIds.includes(item.id));
        }
        if(targetCartItems.length === 0){
            return res.status(400).json({
                success:false,
                message:'상품을 선택해주세요'
            });
        }
        for(const item of targetCartItems){
            const product = await getProduct(item.product_id);
            if(product.stock_quantity<item.quantity){
                return res.status(409).json({success:false,message:'재고가 부족합니다.'});
            }
            item.product = product;

        }
        const totalPrice = targetCartItems.reduce(
            (sum,item) => sum + item.product.price * item.quantity,0
        );

        const order = await createOrderHeader(userId,finalAddr,totalPrice)
        for(const item of targetCartItems){
            await createOrderDetail(order.id,item.product,item.quantity);
            await updateStock(item.product.id,item.product.stock_quantity,item.quantity);    
            await deleteCartItem(userId,item.product.id);
        }
        return res.status(201).json({success:true,message:'주문생성',orderId:order.id});  
    }
    }catch (error) {
        console.error('주문 생성 에러',error.message);
        return res.status(500).json({success:false,message:'서버 에러'});
    }
};

// 주문 목록 조회(사용자 주문 내역 전체 조회)
exports.getOrderList = async(req,res)=>{
    try{
        const {data:orderList,error:orderListError} = await supabase
        .from('orders')
        .select('id,order_date,total_price')
        .eq('user_id',userId)
        .order('order_date',{ascending:false});

        if(orderListError) throw orderListError;

        const orderIds = orderList.map(o=>o.id);
        
        const{data:summary,error:summaryError} = await supabase
        .from('orders_detail' )
        .select(`order_id,product_id,product_price,quantity,status,product:product_id(name)`)
        .in('order_id',orderIds);

        if(summaryError) throw summaryError;
        
        const detailMap= {};
        summary.forEach(row => {
            if(!detailMap[row.order_id]){
                detailMap[row.order_id] = [];
            }
            detailMap[row.order_id].push({
                productId:row.product_id,
                productName:row.product?.name,
                productPrice:row.product_price,
                quantity:row.quantity,
                status:row.status
            });
        });
       
        const result = orderList.map(order=>({
            ...order,
            items:detailMap[order.id] || []
        }));


        return res.status(200).json({success:true,message:'주문 목록 조회 성공',data:result});

    }
    catch(error){
        console.error('주문 목록 조회 에러',error.message);
        return res.status(500).json({success:false,message:'서버 에러'});
    }
};

// 주문 상세 조회(특정 주문의 상세)
exports.getOrderDetail = async(req,res)=>{
    const orderId = req.params.orderId;
    try {
        const {data:order,error:orderError} = await supabase
        .from('orders')
        .select('id,order_date,total_price,zipcode,addr,detail_addr,receiver_name,receiver_phone')
        .eq('id',orderId)
        .single();

        if(orderError) throw orderError;

        const {data:orderDetail,error:orderDetailError} = await supabase
        .from('orders_detail')
        .select('product_id,product_price,quantity,status,product:product_id(name)')
        .eq('order_id',orderId)

        if(orderDetailError) throw orderDetailError;

        return res.status(200).json({success:true, message:'주문 상세 조회 성공',order,items:orderDetail})
        
    } catch (error) {
        console.log('주문 상세 조회 에러',error.message);
        return res.status(500).json({success:false,message:'서버 에러'});
    }
};

// 주문 취소
exports.cancelOrder = async(req,res)=>{
    const{ orderId } = req.params;
    try {
        const {data:cancelOrder, error:cancelOrderError} = await supabase
        .from('orders_detail')
        .select(`order_id,product_id,status,orders(id,user_id)`)
        .eq('order_id',orderId);
        
        if(cancelOrderError) throw cancelOrderError;
        if(!cancelOrder || cancelOrder.length === 0){
            return res.status(404).json({success:false,message:'해당 주문을 찾을 수 없습니다.'});
        }

        if(cancelOrder[0].orders.user_id !== userId){
            return res.status(403).json({success:false,message: '사용자가 일치하지않습니다.'});
        }

       
        const{data:updateStatus,error:updateStatusError} = await supabase
        .from('orders_detail')
        .update({status:'취소완료'})
        .eq('order_id',orderId)
        .select('order_id');
        
        if (updateStatusError) throw updateStatusError;
       
        return res.status(200).json({success:true, message:'주문 취소 성공',data:updateStatus});
        
    } catch (error) {
        console.log('주문 취소 에러',error.message);
        return res.status(500).json({success:false,message:'서버 에러'});
        
    }
}


