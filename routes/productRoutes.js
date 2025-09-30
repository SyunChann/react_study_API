const express = require('express');
const router = express.Router();
const { createProduct, updateProduct, getAllProducts,
    getProductById, getProductByName, getProductsByCategory, deleteProduct } = require('../controllers/productController');

/**
 * 
 */
router.post('/products', createProduct);

/**
 * 
 */
router.put('/products/:id', updateProduct);

/**
 * 
 */
router.get('/products', getAllProducts);

/**
 * 
 */
router.get('/product/:id', getProductById);

/**
 * 
 */
router.get('/product/by-name/:name', getProductByName);

/**
 * 
 */
router.get('/products/by-category/:catrgoty', getProductsByCategory);

/**
 * 
 */
router.delete('/products/:id', deleteProduct);
