# 똥팝 시퀀스 계산기

플레이어들의 승패 데이터를 기록하고 승률을 계산하는 웹 애플리케이션입니다.

## 기능

- 5명의 플레이어(잡, 큐, 지, 머, 웅) 중 2명씩 승, 패 조합으로 게임 결과 입력
- 게임 결과 데이터베이스 저장
- 개인 승률, 팀 승률, 개인 승리 횟수 통계 제공
- 모바일 친화적인 UI

## 기술 스택

- Next.js 14
- TypeScript
- MongoDB
- Tailwind CSS

## 시작하기

### 사전 요구 사항

- Node.js 18 이상
- MongoDB (로컬 또는 MongoDB Atlas)

### 설치 및 실행

1. 프로젝트 클론
   ```bash
   git clone <repository-url>
   cd ddsequence
   ```

2. 의존성 설치
   ```bash
   npm install
   ```

3. 환경 변수 설정
   `.env.local` 파일에 MongoDB 연결 정보를 설정합니다.
   ```
   MONGODB_URI=mongodb://localhost:27017/ddsequence
   ```

4. 개발 서버 실행
   ```bash
   npm run dev
   ```

5. 브라우저에서 `http://localhost:3000` 접속

## 데이터베이스 스키마

### Game 모델
- `winningTeam`: 승리팀 플레이어 배열 (2명)
- `losingTeam`: 패배팀 플레이어 배열 (2명)
- `createdAt`: 생성 날짜

## API 엔드포인트

### GET /api/games
모든 게임 데이터를 반환합니다.

### POST /api/games
새 게임 데이터를 저장합니다.
```json
{
  "winningTeam": ["잡", "큐"],
  "losingTeam": ["지", "머"]
}
```

### GET /api/stats
모든 통계 데이터를 반환합니다.
- 전체 게임 수
- 개인 승률 통계
- 팀 승률 통계
- 개인 승리 횟수 통계
