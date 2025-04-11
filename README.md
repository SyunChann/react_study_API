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

## 📂 프로젝트 구조

api_server/ ├── controllers/ # 비즈니스 로직 (회원가입 처리 등) │ └── authController.js ├── models/ # DB 모델 (현재 User.js만 존재) │ └── User.js ├── routes/ # 라우터 정의 │ └── authRoutes.js ├── db.js # DB 연결 설정 ├── app.js # 서버 초기화 및 라우터 설정 ├── .env # 환경 변수 파일 ├── package.json └── .gitignore
