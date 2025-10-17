const express = require('express');
const router = express.Router();
const { getCart,addCart,clearCart,deleteCart, updateCart} = require('../controllers/cartController');

router.post('/cart/add',addCart);
router.patch('/cart/item',updateCart);
router.get('/cart',getCart)
router.delete('/cart/item',deleteCart);
router.delete('/cart',clearCart);

module.exports = router;