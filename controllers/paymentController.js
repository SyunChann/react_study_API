const supabase = require('../db');
const crypto = require('crypto');

// 주문 집계: 모든 상세가 결제완료면 주문도 결제완료
async function recalcOrderStatus(order_id) {
    const { data: details, error } = await supabase
        .from('orders_detail')
        .select('status')
        .eq('order_id', order_id);
    if (error || !details) return;

    const allPaid = details.every(d => d.status === '결제완료');
    const anyPaid = details.some(d => d.status === '결제완료');

    let next = '주문';
    if (allPaid) next = '결제완료';
    else if (anyPaid) next = '부분결제'; // 필요 없으면 제거

    await supabase.from('orders').update({ status: next }).eq('id', order_id);
    }

    function newMerchantUid() {
    return 'm_' + crypto.randomBytes(12).toString('hex');
}

/**
 * POST /api/payments
 * body: { orders_detail_id, pg_provider?, method? }
 * - orders_detail에서 금액 계산 -> payment pending 생성
 */
exports.createPaymentPending = async (req, res) => {
    const { orders_detail_id, pg_provider = 'mock', method = 'card' } = req.body;
    if (!orders_detail_id) {
        return res.status(400).json({ success: false, message: 'orders_detail_id 필수' });
    }

    try {
        // 주문상세 조회 + 서버 금액 계산
        const { data: od, error: odErr } = await supabase
        .from('orders_detail')
        .select('id, order_id, product_price, quantity, status')
        .eq('id', orders_detail_id)
        .single();
        if (odErr || !od) return res.status(404).json({ success: false, message: '주문상세 없음' });

        const requested_amount = Number(od.product_price) * Number(od.quantity);

        // 기존 결제 있으면 갱신(멱등)
        const { data: exists, error: existErr } = await supabase
        .from('payment')
        .select('id, status, merchant_uid')
        .eq('orders_detail_id', orders_detail_id)
        .maybeSingle();
        if (existErr) throw existErr;

        if (exists) {
        const { data: updated, error: updErr } = await supabase
            .from('payment')
            .update({
            pg_provider,
            method,
            requested_amount,
            status: 'pending',
            })
            .eq('id', exists.id)
            .select('id, orders_detail_id, merchant_uid, requested_amount, status, pg_provider, method')
            .single();
        if (updErr) throw updErr;

        return res.json({ success: true, message: '결제 준비 업데이트', data: updated });
        }

        // 신규 pending 생성
        const merchant_uid = newMerchantUid();
        const { data: pay, error: payErr } = await supabase
        .from('payment')
        .insert([{
            orders_detail_id,
            merchant_uid,
            pg_provider,
            method,
            requested_amount,
            status: 'pending',
        }])
        .select('id, orders_detail_id, merchant_uid, requested_amount, status, pg_provider, method')
        .single();
        if (payErr) throw payErr;

        // (PG가 있다면 여기서 intent/결제URL 생성해서 같이 반환)
        return res.status(201).json({ success: true, message: '결제 준비 완료', data: pay });
    } catch (err) {
        console.error('결제 준비 실패:', err);
        return res.status(500).json({ success: false, message: '서버 오류 발생' });
    }
};

/**
 * POST /api/payments/:id/mock-success
 * - PG 없이 “결제 성공”을 가짜로 처리
 * - requested_amount를 approved_amount로 복사, 상태 paid
 * - orders_detail / orders 갱신
 */
exports.mockPaymentSuccess = async (req, res) => {
    const { id } = req.params;
    try {
        const { data: pay, error: payErr } = await supabase
        .from('payment')
        .select('id, orders_detail_id, requested_amount, status')
        .eq('id', id)
        .single();
        if (payErr || !pay) return res.status(404).json({ success: false, message: '결제 레코드 없음' });

        if (pay.status === 'paid') return res.json({ success: true, message: '이미 결제 완료' });

        // payment 갱신
        await supabase
        .from('payment')
        .update({
            status: 'paid',
            approved_amount: pay.requested_amount,
            pg_tid: 'mock_tid_' + id,
            receipt_url: null,
            fail_reason: null,
        })
        .eq('id', id);

        // 주문상세/주문 갱신
        const { data: od, error: odErr } = await supabase
        .from('orders_detail')
        .select('id, order_id')
        .eq('id', pay.orders_detail_id)
        .single();
        if (odErr || !od) throw odErr;

        await supabase.from('orders_detail').update({ status: '결제완료' }).eq('id', od.id);
        await recalcOrderStatus(od.order_id);

        return res.json({ success: true, message: '모의 결제 성공 처리 완료' });
    } catch (err) {
        console.error('모의 결제 성공 실패:', err);
        return res.status(500).json({ success: false, message: '서버 오류 발생' });
    }
};

/**
 * PATCH /api/payments/:id/status
 * body: { status: 'canceled' | 'refunded' }
 * - 취소/환불 시 payment 상태 변경 + 주문상세/주문 갱신(+재고 복원은 원하면 추가)
 */
exports.updatePaymentStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    if (!['canceled', 'refunded'].includes(status)) {
        return res.status(400).json({ success: false, message: '허용되지 않은 상태' });
    }

    try {
        const { data: pay, error: payErr } = await supabase
        .from('payment')
        .select('id, orders_detail_id')
        .eq('id', id)
        .single();
        if (payErr || !pay) return res.status(404).json({ success: false, message: '결제 레코드 없음' });

        await supabase.from('payment').update({ status }).eq('id', id);

        const { data: od, error: odErr } = await supabase
        .from('orders_detail')
        .select('id, order_id, product_id, quantity')
        .eq('id', pay.orders_detail_id)
        .single();
        if (odErr || !od) throw odErr;

        await supabase
        .from('orders_detail')
        .update({ status: status === 'refunded' ? '환불' : '취소' })
        .eq('id', od.id);

        // (선택) 재고 복원 로직
        // const { data: prod } = await supabase.from('product').select('id, stock_quantity').eq('id', od.product_id).single();
        // if (prod) {
        //   await supabase.from('product').update({ stock_quantity: Number(prod.stock_quantity ?? 0) + Number(od.quantity ?? 0) }).eq('id', prod.id);
        // }

        await recalcOrderStatus(od.order_id);

        return res.json({ success: true, message: '결제 상태 변경 완료' });
    } catch (err) {
        console.error('결제 상태 변경 실패:', err);
        return res.status(500).json({ success: false, message: '서버 오류 발생' });
    }
};

/**
 * GET /api/orders-detail/:odId/payment
 */
exports.getPaymentByOrderDetail = async (req, res) => {
    const { odId } = req.params;    
    try {
        const { data, error } = await supabase
        .from('payment')
        .select('id, orders_detail_id, merchant_uid, requested_amount, approved_amount, status, pg_provider, method, pg_tid, receipt_url, fail_reason, created_at, updated_at')
        .eq('orders_detail_id', odId)
        .single();

        if (error || !data) return res.status(404).json({ success: false, message: '결제 내역 없음' });
        return res.json({ success: true, data });
    } catch (err) {
        console.error('결제 조회 실패:', err);
        return res.status(500).json({ success: false, message: '서버 오류 발생' });
    }
};