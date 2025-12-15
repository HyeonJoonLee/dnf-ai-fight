⚔️ DNF AI Arena

던전앤파이터(DNF) 캐릭터 기반 AI 전투 & 분석 웹 서비스
플레이어가 자신의 던파 캐릭터를 등록하고,
AI가 캐릭터의 전투 성향을 분석하여 가상 전투 콘텐츠로 확장하는 프로젝트입니다.

⚠️ 본 프로젝트는 비공식 팬 프로젝트이며,
던전앤파이터 및 네오플과는 직접적인 관련이 없습니다.

✨ 주요 기능
🔐 인증 (Authentication)

Google / Kakao OAuth 로그인 (NextAuth v5)

로그인 상태에 따른 UI 분기 처리

provider + providerUserId 기반 유저 식별

👤 내 캐릭터 관리

최대 4개의 활성 캐릭터 슬롯

추가 슬롯은 잠금 상태(확장 예정)

캐릭터 등록 / 조회 / 삭제 가능

캐릭터 등록 플로우

서버 + 캐릭터명 입력

DNF API 기반 캐릭터 조회

AI 전투 성향 분석

결과 확인 후 등록

🧠 AI 전투 성향 분석

Google Gemini API 사용

캐릭터 이미지 기반 전투 스타일 분석

과도한 설정 왜곡 없이 “게임 해설자” 톤의 분석 제공

프롬프트 최적화로 토큰 사용량 최소화

📊 캐릭터 상세 정보

캐릭터 이미지

서버 / 레벨 / 직업

전투 성향 분석 결과

승리 수 (전투 시스템 연동 예정)

🧩 기술 스택
Frontend

Next.js 16 (App Router, Turbopack)

React

Tailwind CSS

TypeScript

Backend

Next.js API Routes

NextAuth v5

Supabase (PostgreSQL)

Prisma ORM

AI / External API

Google Gemini API

던전앤파이터 Open API

🗄️ 데이터 구조 (요약)
app_users

OAuth 기반 사용자 정보

provider / provider_user_id 유니크 처리

characters

유저 소유 캐릭터

서버, 캐릭터명, 레벨, 직업

마지막 분석 결과 / 이미지 URL 저장

battles (예정)

캐릭터 간 전투 기록

승패, 점수, 로그 데이터

🚀 실행 방법 (로컬)
1️⃣ 환경 변수 설정
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

KAKAO_CLIENT_ID=
KAKAO_CLIENT_SECRET=

SUPABASE_URL=
SUPABASE_ANON_KEY=

DATABASE_URL=
GEMINI_API_KEY=

2️⃣ 패키지 설치
npm install

3️⃣ Prisma 설정
npx prisma generate
npx prisma db push

4️⃣ 개발 서버 실행
npm run dev

🧪 테스트 엔드포인트

인증 상태 확인
👉 GET /api/auth/session

DB 연결 테스트
👉 GET /api/db-test

📌 현재 상태 (2025-현재)

✅ 로그인 / 캐릭터 등록 / 조회 / 삭제

✅ AI 전투 성향 분석

✅ Supabase DB 연동

🚧 전투 시스템 (개발 예정)

🚧 AI 일러스트 생성 (조건부 제공 예정)

🔮 향후 계획

캐릭터 간 AI 전투 시스템

승리 수 기반 랭킹

AI 일러스트 보상 시스템

유료 플랜 / 슬롯 확장

캐싱 & 요청량 제어 최적화

⚠️ 주의사항

AI API 사용량 제한으로 인해 분석 기능은 제한될 수 있습니다.

캐릭터 정보는 공식 DNF API 기준이며, 실제 게임 데이터와 다를 수 있습니다.

🙋‍♂️ 개발자

1인 개발

기획 / 디자인 / 프론트엔드 / 백엔드 / 인프라 전부 직접 구현

### 🔗 Live Demo
https://dnf-ai-fight.vercel.app/

### 🖼️ Screenshot
<img width="1110" height="449" alt="image" src="https://github.com/user-attachments/assets/5c9a539e-19b1-46d6-ad1c-12c4c5ff63a2" />
