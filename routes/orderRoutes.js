const express = require('express');
const router = express.Router();
const { createOrder,getOrderList,getOrderDetail,cancelOrder,getUserDefaultAddr} = require('../controllers/ordersController');

router.get('/order/address',async(req,res)=>{
    const userId = 27;
    try{
        const addr = await getUserDefaultAddr(userId);
        res.json({success:true,address:addr})
    }catch(err){
        res.status(500).json({success:false,message:'조회 실패'})
    }

});

router.post('/order',createOrder);
router.get('/order',getOrderList);
router.get('/order/:orderId',getOrderDetail);
router.patch('/order/:orderId/cancel',cancelOrder);



module.exports = router;