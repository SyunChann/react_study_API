// const db = require('./db'); // MySQL 연결
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const socialRoutes = require('./routes/socialRoutes');

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

app.use('/api', authRoutes);      // 기본 회원가입/로그인
app.use('/api', socialRoutes);    // 소셜 로그인 (카카오/구글)

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ API Server ON : http://localhost:${PORT}`);
});
