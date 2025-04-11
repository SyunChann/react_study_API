# 📦 React Study API Server

React 프로젝트의 회원가입/로그인 기능을 위한 Node.js 기반 백엔드 서버입니다.  
MySQL 데이터베이스를 사용하며, Express.js 프레임워크를 기반으로 구성되어 있습니다.

---

## 🚀 주요 기능

- [x] 이메일 기반 회원가입 API (`/api/signup`)
- [x] bcrypt 암호화를 통한 보안 강화
- [x] MySQL 연동 및 사용자 저장
- [x] 환경 변수(.env)를 이용한 설정 분리
- [x] Express 라우터 구조 분리 (routes/controllers/models)

---

## ⚙️ 설치 및 실행 방법

### 1. 의존성 설치

```bash
npm install
```

---

PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASS=yourpassword
DB_NAME=mydb
JWT_SECRET=your_jwt_secret_here

---

CREATE DATABASE mydb;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

npm start
# 또는
node app.js
