# 📦 React Study API Server

React 프로젝트에서 사용할 회원가입 및 로그인 기능을 위한 Node.js 백엔드 서버입니다.
Supabase 데이터베이스와 Express.js 프레임워크를 기반으로 구성되어 있습니다.

---

## 🚀 주요 기능

- ✅ 이메일 기반 회원가입 API ( `/api/signup`)
- ✅ 소셜 로그인 (Google, Kakao)
- ✅ 비밀번호 bcrypt 암호화 처리
- ✅ Supabase 연동 및 사용자 정보 저장
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
  SUPABASE_URL=your_supabase_url
  SUPABASE_KEY=your_supabase_anon_key
  JWT_SECRET=your_jwt_secret_here
  GOOGLE_CLIENT_ID=your_google_client_id
  GOOGLE_CLIENT_SECRET=your_google_client_secret
  KAKAO_CLIENT_ID=your_kakao_client_id
  KAKAO_CLIENT_SECRET=your_kakao_client_secret
```

### 3️⃣ SupaBase 데이터베이스 및 테이블 생성

```
예시:
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255),
  provider VARCHAR(50) DEFAULT 'local',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  kakao_id BIGINT UNIQUE,
  google_id VARCHAR(255) UNIQUE
);

-- 1. users 테이블 수정
ALTER TABLE users
  DROP COLUMN google_id,
  DROP COLUMN kakao_id,
  DROP COLUMN provider,
  ALTER COLUMN password DROP NOT NULL;

-- 2. social_identities 테이블 생성
CREATE TABLE social_identities (
  id BIGSERIAL PRIMARY KEY,
  user_id INT4 NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL,
  provider_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 4️⃣ 서버 실행

```
npm start
# 또는
node app.js
```
