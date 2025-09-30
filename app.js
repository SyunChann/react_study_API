// const db = require('./db'); // MySQL 연결
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const socialRoutes = require('./routes/socialRoutes');
const productRoutes = require('./routes/productRoutes');
const swaggerUi = require('swagger-ui-express');
const specs = require('./swagger/swagger');

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

app.use('/api', authRoutes);      // 기본 회원가입/로그인
app.use('/api', socialRoutes);    // 소셜 로그인 (카카오/구글)
app.use('/api', productRoutes);   // 상품 CRUD라우트

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ API Server ON : http://localhost:${PORT}`);
});
