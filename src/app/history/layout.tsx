import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '게임 기록 | 뚱팸 시퀀스 승률 계산기',
  description: '뚱팸 시퀀스 경기의 모든 기록을 확인합니다.',
};

export default function HistoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
} 