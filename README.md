# 📦 React Study API Server

React 프로젝트에서 사용할 회원가입 및 로그인 기능을 위한 Node.js 백엔드 서버입니다.  
MySQL 데이터베이스와 Express.js 프레임워크를 기반으로 구성되어 있습니다.

---

## 🚀 주요 기능

- ✅ 이메일 기반 회원가입 API (`/api/signup`)
- ✅ 비밀번호 bcrypt 암호화 처리
- ✅ MySQL 연동 및 사용자 정보 저장
- ✅ `.env` 파일을 통한 환경 변수 분리
- ✅ 구조화된 Express 라우터 구성 (`routes`, `controllers`, `models`)

---

## ⚙️ 설치 및 실행 방법

### 1️⃣ 의존성 설치

```bash
npm install
```

### 2️⃣ 환경 변수 설정 (.env)

```
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASS=yourpassword
DB_NAME=mydb
JWT_SECRET=your_jwt_secret_here
```

### 3️⃣ MySQL 데이터베이스 및 테이블 생성

```
CREATE DATABASE mydb;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 4️⃣ 서버 실행

```
npm start
# 또는
node app.js
```
