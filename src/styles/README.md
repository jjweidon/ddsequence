# 디자인 토큰 사용 가이드

## 색상 변경 방법
`theme.css` 파일만 수정하면 전체 앱 색상이 변경됩니다.

## 사용 가능한 클래스

| 용도 | 배경 | 텍스트 | 테두리 |
|------|------|--------|--------|
| 페이지 배경 | `bg-page` | - | - |
| 카드/모달 표면 | `bg-surface` | - | - |
| 호버 표면 | `bg-surface-hover` | - | - |
| 기본 텍스트 | - | `text-foreground` | - |
| 보조 텍스트 | - | `text-muted` | - |
| 테두리 | - | - | `border-border` |
| **포인트/액센트** | `bg-accent-gradient` (cyan→purple→pink) | `text-accent` | `ring-focus` |
| 액센트 호버 | `hover:brightness-110` | `hover:text-accent` | - |
| 성공 | `bg-success` | `text-success` | - |
| 위험 | `bg-danger` | `text-danger` | - |
| 승리 | `bg-win` | `text-win` | - |
| 패배 | `bg-lose` | `text-lose` | - |

## 예시
```tsx
// Primary 버튼 (cyan→purple→pink 그라데이션)
<button className="bg-accent-gradient hover:brightness-110 text-white">

// 카드/모달
<div className="bg-surface border border-border">

// 보조 텍스트
<span className="text-muted">

// 승/패 강조
<span className="text-win">승리</span>
<span className="text-lose">패배</span>
```
