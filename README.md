[승률 계산기](https://ddsequence.vercel.app)

# 뚱팸 시퀀스 승률 계산기

<p align="center">
  <img src="/public/play.gif" alt="뚱팸 시퀀스 승률 계산기 시연 영상" width="100%">
</p>

친구들과 시퀀스 게임의 승률 기록을 쉽게 관리하기 위한 웹 애플리케이션입니다.

## 주요 기능

- **플레이어 선택**: 5명의 플레이어 중 팀별로 2명씩 선택
- **게임 기록**: 승/패 정보를 MongoDB에 저장
- **통계 분석**: 개인/팀 승률 및 승리 횟수 자동 계산
- **역대 기록 관리**: 모든 게임 기록 조회, 편집, 삭제 기능
- **반응형 디자인**: 모바일/데스크탑에 최적화된 UI

## 구현 기술

- **프론트엔드**: 
  - Next.js 15.2.2
  - TypeScript
  - Tailwind CSS
  - 반응형 디자인 (모바일/데스크탑 레이아웃 분리)
  - 클라이언트 사이드 상태 관리

- **백엔드**:
  - Next.js API Routes
  - MongoDB 연동
  - Mongoose 스키마 및 모델

- **배포**:
  - Vercel 호스팅
  - MongoDB Atlas

## API 구조

### 게임 관련 API
- `GET /api/games`: 모든 게임 데이터 조회
- `POST /api/games`: 새 게임 기록 저장
- `DELETE /api/games/[id]`: 특정 게임 기록 삭제

### 통계 API
- `GET /api/stats`: 승률 및 게임 통계 데이터 조회

## 데이터 모델

### Game
```typescript
{
  _id: string;
  winningTeam: string[];  // 승리팀 플레이어 (2명)
  losingTeam: string[];   // 패배팀 플레이어 (2명)
  createdAt: Date;        // 생성 시간
}
```

## 페이지 구성

- **메인 페이지**: 플레이어 선택 및 승률 통계 표시
- **역대 기록 페이지**: 날짜별 게임 기록 관리 (조회/삭제)

## 구현 특징

- **반응형 UI**: 모바일에서는 카드 형태, 데스크탑에서는 테이블 형태로 표시
- **상태 관리**: 클라이언트 측 React 상태로 UI 및 데이터 관리
- **비동기 처리**: fetch API를 사용한 서버 통신
- **에러 처리**: 로딩 상태 및 오류 메시지 표시
