const express = require('express');
const router = express.Router();
const { createPaymentPending, mockPaymentSuccess, updatePaymentStatus, getPaymentByOrderDetail } = require('../controllers/paymentController');

router.post('/payments', createPaymentPending); // 결제 시도(pending) 생성
router.post('/payments/:id/mock-success', mockPaymentSuccess); // PG 없이 성공 처리
router.patch('/payments/:id/status', updatePaymentStatus); // 취소/환불 등
router.get('/orders-detail/:odId/payment', getPaymentByOrderDetail); // 주문상세 -> 결제 조회

module.exports = router;
