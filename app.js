const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const db = require('./db'); // MySQL 연결

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

const authRoutes = require('./routes/authRoutes');
app.use('/api', authRoutes); // Route Add

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
