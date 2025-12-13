import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '명예의 전당 | 뚱팸 시퀀스 승률 계산기',
  description: '연도별 기록과 통계를 확인하는 명예의 전당입니다.',
};

export default function HallOfFameLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

