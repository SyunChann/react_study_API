const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const db = require('./db'); // MySQL 연결

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

const authRoutes = require('./routes/authRoutes');
const socialRoutes = require('./routes/socialRoutes');

app.use('/api', authRoutes);      // 기본 회원가입/로그인
app.use('/api', socialRoutes);    // 소셜 로그인 (카카오/구글)

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
