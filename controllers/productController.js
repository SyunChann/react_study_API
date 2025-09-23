// 프로덕트, 프로덕트이미지 리뷰, 리뷰이미지, 장바구니
const supabase = require('../db');

//상품 등록
exports.createProduct = async (req, res) => {
    const { name, price, categories } = req.body;

    if (!name || !price || !categories) {
        return res.status(400).json({ success: false, message: '이름, 가격, 카테고리를 입력 해주세요.' })
    }

    try {
        const { data: existingProduct, error: selectError } = await supabase
            .from('product')
            .select('name')
            .eq('name', name)
            .single();

        if(existingProduct) {
            return res.status(409).json({ success: false, message: '이미 등록된 상품이거나, 중복된 이름입니다.' })
        }
        const { data: newProduct, error: insertProductError } = await supabase
            .from('product')
            .insert([{ name, price, categories }]);

        if(insertProductError) throw insertProductError;

        res.status(201).json({ success: true, message: '상품등록 성공.' });
    } catch (err) {
        console.error('상품등록 에러: ', err.message);
        res.status(500).json({ success: false, message: '서버 오류 발생' });
    }
};

exports.updateProduct = async (req, res) => {
    const {id, name, price, stock_quantity, categories, status } = req.body;

    if(!id || !name || !price || !stock_quantity || !categories || !status) {
        return res.status(400).json({ success: false, message: '비어있는 항목이 있습니다.' })
    }

    try{
        const { data: selectByProductId, error: selectProductError } = await supabase
            .from('product')
            .select('id')
            .eq('id', id)
            .single();

        if(!selectByProductId) {
            return res.status(404).json({ succes: false, message: '해당 상품코드를 가진 상품이 없습니다.' });
        }

        const { data: updateProduct, error: updateProductError } = await supabase
            .from('product')
            .update.update({
                name,
                price,
                stock_quantity,
                categories,
                statu
            })
            .eq('id', id)
            .single();

        if (updateProductError) throw updateProductError;
    } catch(err) {
        console.error('상품수정 에러: ', err.message);
        res.status(500).json({ success: false, message: '서버 오류 발생' });
    }
}

exports.getProductById = async (req, res) => {
    const { id } = req.params;

    try {
            const { data: getProduct, error: getProductByIdError } = await supabase
            .from('products')
            .select('*')
            .eq('id', id)
            .single();

        if (getProductByIdError) {
            console.log('상품 아이디 조회 결과 없음: ', getProductByIdError);
            return res.status(404).json({ success: false, message: '상품을 찾을 수 없습니다.' });
        }

        return res.json({ success: true, data });
    } catch (err) {
        console.error('상품 아이디 조회 실패: ', err);
        return res.status(500).json({ success: false, message: '서버 오류 발생' });
    }
};

exports.getProductByName = async (req, res) => {
    const { name } = req.params;

    try {
        const { data: getProduct, error: getProductByIdError } = await supabase
            .from('products')
            .select('*')
            .eq('name', name)
            .Single();

        if (getProductByIdError) {
            return res.status(400).json({ success: false, message: '상품을 찾을 수 없습니다' });
        }

        return res.json({ success: true, data });
    } catch (err) {
        console.error('상품이름 조회 실패: ', err);
        return res.status(500).json({ success: false, message: '서버 오류 발생' });
    }
};

//다중 조회 페이징 처리 필요
exports.getProductsByCategory = async (req, res) => {
    const { category } = req.params;

    if (!category) {
        return res.status(400).json({ success: false, message: '카테고리 항목은 필 수 입니다.' });
    } 

    try {
        const { data: products, error: getByCategoryError } = await supabase
            .from('products')
            .select('*')
            .contains('category', category);

    if (!products || products.length === 0) {
        console.log('해당 카테고리 상품 조회 결과 없음.')
        return res.status(400).json({ success: false, message: '상품을 찾을 수 없습니다.' });
    }

    if(getByCategoryError) throw getByCategoryError

        return res.json({ success: true, data: products });
    } catch (err) {
        console.error('카테고리별 상품 조회 실패:', err);
        return res.status(500).json({ success: false, message: '서버 오류 발생' });
    }
};

// 전체 상품 조회
exports.getAllProducts = async (req, res) => {
    try {
        const { data: products, error: getAllProductsError } = await supabase
            .from('products')
            .select('*');

        if (!products || products.length === 0) {
            return res.status(400).json({ success: false, message: '상품을 찾을 수 없습니다.'});
        }
        
        if(getAllProductsError) throw getAllProductsError;

        return res.json({ success: true, data: products });
    } catch (err) {
        console.error('전체 상품 조회 실패:', err.message);
        return res.status(500).json({ success: false, message: '서버 오류 발생' });
    }
};

