'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { getPlayerDisplayName } from '@/utils/playerNames';
import { useSlideImageCapture } from '@/components/SlideImageCapture';

// 기간별 등수 차트 컴포넌트
const RankChart: React.FC<{
  periodStats: Array<{
    periodKey: string;
    year: number;
    month: number;
    week: number;
    startDate: Date;
    endDate: Date;
    periodRanks: { [player: string]: number };
    cumulativeRanks: { [player: string]: number };
    games: any[];
  }>;
}> = ({ periodStats }) => {
  const [selectedView, setSelectedView] = useState<'period' | 'cumulative'>('cumulative');
  const [animated, setAnimated] = useState(false);
  const validPlayers = ['잡', '큐', '지', '머', '웅'];
  const colors = ['#60A5FA', '#34D399', '#FBBF24', '#F87171', '#A78BFA'];
  
  // 날짜 순으로 정렬된 periodStats
  const sortedPeriodStats = periodStats.slice().sort((a, b) => {
    const dateA = typeof a.startDate === 'string' ? new Date(a.startDate) : a.startDate;
    const dateB = typeof b.startDate === 'string' ? new Date(b.startDate) : b.startDate;
    return dateA.getTime() - dateB.getTime();
  });
  
  useEffect(() => {
    setAnimated(false);
    setTimeout(() => setAnimated(true), 100);
  }, [selectedView]);

  const chartWidth = 800;
  const chartHeight = 400;
  const padding = { top: 40, right: 40, bottom: 60, left: 60 };
  const graphWidth = chartWidth - padding.left - padding.right;
  const graphHeight = chartHeight - padding.top - padding.bottom;

  // 날짜 포맷팅
  const formatPeriodLabel = (stat: typeof periodStats[0]) => {
    const startDate = typeof stat.startDate === 'string' ? new Date(stat.startDate) : stat.startDate;
    const endDate = typeof stat.endDate === 'string' ? new Date(stat.endDate) : stat.endDate;
    
    // 한국 시간 기준으로 변환 (UTC+9)
    const startKoreaTime = new Date(startDate.getTime() + (9 * 60 * 60 * 1000));
    const endKoreaTime = new Date(endDate.getTime() + (9 * 60 * 60 * 1000));
    
    const startMonth = startKoreaTime.getUTCMonth() + 1;
    const startDay = startKoreaTime.getUTCDate();
    const endMonth = endKoreaTime.getUTCMonth() + 1;
    const endDay = endKoreaTime.getUTCDate();
    
    if (startMonth === endMonth) {
      return `${startMonth}/${startDay}-${endDay}`;
    }
    return `${startMonth}/${startDay}-${endMonth}/${endDay}`;
  };

  // 각 플레이어별 좌표 계산
  const getPlayerPath = (player: string, ranks: number[]) => {
    if (ranks.length === 0) return '';
    
    const points = ranks.map((rank, index) => {
      const x = padding.left + (index / (ranks.length - 1 || 1)) * graphWidth;
      const y = padding.top + ((rank - 1) / 4) * graphHeight; // 1위~5위를 0~graphHeight로 매핑
      return `${x},${y}`;
    });

    return points.join(' L ');
  };

  // 애니메이션을 위한 경로 길이 계산
  const getPathLength = (path: string) => {
    if (!path) return 0;
    const pathElement = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    pathElement.setAttribute('d', `M ${path}`);
    return pathElement.getTotalLength();
  };

  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="mb-6 flex gap-4 justify-center items-center">
        <button
          onClick={() => setSelectedView('cumulative')}
          className={`px-6 py-2 rounded-lg font-semibold transition-all ${
            selectedView === 'cumulative'
              ? 'bg-white/20 text-white'
              : 'bg-white/10 text-white/70 hover:bg-white/15'
          }`}
          style={{ 
            textAlign: 'center',
            lineHeight: '1.5',
            display: 'block',
            width: 'auto',
            color: selectedView === 'cumulative' ? 'rgb(255, 255, 255)' : 'rgba(255, 255, 255, 0.7)'
          }}
        >
          누적 등수
        </button>
        <button
          onClick={() => setSelectedView('period')}
          className={`px-6 py-2 rounded-lg font-semibold transition-all ${
            selectedView === 'period'
              ? 'bg-white/20 text-white'
              : 'bg-white/10 text-white/70 hover:bg-white/15'
          }`}
          style={{ 
            textAlign: 'center',
            lineHeight: '1.5',
            display: 'block',
            width: 'auto',
            color: selectedView === 'period' ? 'rgb(255, 255, 255)' : 'rgba(255, 255, 255, 0.7)'
          }}
        >
          기간별 등수
        </button>
      </div>

      <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6">
        <svg
          width={chartWidth}
          height={chartHeight}
          className="w-full h-auto"
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        >
          {/* 그리드 라인 */}
          {[1, 2, 3, 4, 5].map((rank) => {
            const y = padding.top + ((rank - 1) / 4) * graphHeight;
            return (
              <line
                key={rank}
                x1={padding.left}
                y1={y}
                x2={padding.left + graphWidth}
                y2={y}
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
            );
          })}

          {/* Y축 레이블 */}
          {[1, 2, 3, 4, 5].map((rank) => {
            const y = padding.top + ((rank - 1) / 4) * graphHeight;
            return (
              <text
                key={rank}
                x={padding.left - 20}
                y={y}
                fill="rgba(255,255,255,0.7)"
                fontSize="14"
                textAnchor="end"
                dominantBaseline="middle"
              >
                {rank}위
              </text>
            );
          })}

          {/* 플레이어별 라인 */}
          {validPlayers.map((player, playerIndex) => {
            const ranks = sortedPeriodStats.map(stat =>
              selectedView === 'period' ? stat.periodRanks[player] : stat.cumulativeRanks[player]
            );
            const path = getPlayerPath(player, ranks);
            
            if (!path) return null;

            return (
              <g key={player}>
                {/* 라인 */}
                <path
                  d={`M ${path}`}
                  fill="none"
                  stroke={colors[playerIndex]}
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={animated ? 1 : 0}
                  style={{
                    strokeDasharray: animated ? 'none' : '1000',
                    strokeDashoffset: animated ? 0 : 1000,
                    transition: 'stroke-dashoffset 1.5s ease-out, opacity 0.5s ease-out',
                  }}
                />
                
                {/* 포인트 */}
                {ranks.map((rank, index) => {
                  const x = padding.left + (index / (ranks.length - 1 || 1)) * graphWidth;
                  const y = padding.top + ((rank - 1) / 4) * graphHeight;
                  return (
                    <circle
                      key={index}
                      cx={x}
                      cy={y}
                      r={animated ? 5 : 0}
                      fill={colors[playerIndex]}
                      opacity={animated ? 1 : 0}
                      style={{
                        transition: `r 0.3s ease-out ${index * 0.1}s, opacity 0.3s ease-out ${index * 0.1}s`,
                      }}
                    />
                  );
                })}
              </g>
            );
          })}

          {/* X축 레이블 */}
          {sortedPeriodStats.map((stat, index) => {
              const x = padding.left + (index / (sortedPeriodStats.length - 1 || 1)) * graphWidth;
              const label = formatPeriodLabel(stat);
              const labelY = chartHeight - padding.bottom + 20;
              return (
                <text
                  key={index}
                  x={x}
                  y={labelY}
                  fill="rgba(255,255,255,0.7)"
                  fontSize="12"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  transform={`rotate(-45 ${x} ${labelY})`}
                >
                  {label}
                </text>
              );
            })}
        </svg>

        {/* 범례 */}
        <div className="flex flex-wrap gap-4 justify-center items-center mt-6">
          {validPlayers.map((player, index) => (
            <div 
              key={player} 
              className="flex items-center gap-2"
            >
              <div
                className="w-4 h-4 rounded-full flex-shrink-0"
                style={{ backgroundColor: colors[index] }}
              />
              <span 
                className="text-white/80 text-sm"
                style={{ color: 'rgba(255, 255, 255, 0.8)' }}
              >
                {getPlayerDisplayName(player)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="text-center mt-6 text-lg opacity-70">
        {selectedView === 'cumulative' 
          ? '누적 등수 변화를 확인해보세요!'
          : '각 기간별 등수를 확인해보세요!'}
      </div>
    </div>
  );
};

interface RecapStats {
  year: number;
  totalGames: number;
  totalPeriods: number;
  vipByWinrate: {
    player: string;
    winrate: number;
    wins: number;
    total: number;
  } | null;
  worstByWinrate: {
    player: string;
    winrate: number;
    wins: number;
    total: number;
  } | null;
  bestWinrateTeam: {
    team: string;
    teamKey: string;
    winrate: number;
    wins: number;
    total: number;
  } | null;
  maxWinStreakPlayer: {
    player: string;
    maxWinStreak: number;
    maxLoseStreak: number;
    maxWinStreakPeriod: number;
    maxLoseStreakPeriod: number;
  };
  maxLoseStreakPlayer: {
    player: string;
    maxWinStreak: number;
    maxLoseStreak: number;
    maxWinStreakPeriod: number;
    maxLoseStreakPeriod: number;
  };
  longestWinStreakTeam: {
    team: string;
    teamKey: string;
    maxWinStreak: number;
    maxLoseStreak: number;
    maxWinStreakPeriod: number;
    maxLoseStreakPeriod: number;
  };
  maxLoseStreakTeam: {
    team: string;
    teamKey: string;
    maxWinStreak: number;
    maxLoseStreak: number;
  };
  rankChanges: {
    [player: string]: {
      best: number;  // 최고 등수 (낮은 숫자 = 높은 등수)
      worst: number; // 최저 등수 (높은 숫자 = 낮은 등수)
      change: number; // best - worst (양수면 상승, 음수면 하락)
      bestPeriod: {
        periodKey: string;
        year: number;
        month: number;
        week: number;
        startDate: Date;
        endDate: Date;
        periodRanks: { [player: string]: number };
        cumulativeRanks: { [player: string]: number };
        games: any[];
      } | null;
      worstPeriod: {
        periodKey: string;
        year: number;
        month: number;
        week: number;
        startDate: Date;
        endDate: Date;
        periodRanks: { [player: string]: number };
        cumulativeRanks: { [player: string]: number };
        games: any[];
      } | null;
      // 하위 호환성을 위한 필드
      early: number;
      late: number;
      earlyPeriod: {
        periodKey: string;
        year: number;
        month: number;
        week: number;
        startDate: Date;
        endDate: Date;
        periodRanks: { [player: string]: number };
        cumulativeRanks: { [player: string]: number };
        games: any[];
      } | null;
      latePeriod: {
        periodKey: string;
        year: number;
        month: number;
        week: number;
        startDate: Date;
        endDate: Date;
        periodRanks: { [player: string]: number };
        cumulativeRanks: { [player: string]: number };
        games: any[];
      } | null;
    };
  };
  rankChangeData: {
    firstPeriod: {
      periodKey: string;
      year: number;
      month: number;
      week: number;
      startDate: Date;
      endDate: Date;
      periodRanks: { [player: string]: number };
      cumulativeRanks: { [player: string]: number };
      games: any[];
    } | null;
    lastPeriod: {
      periodKey: string;
      year: number;
      month: number;
      week: number;
      startDate: Date;
      endDate: Date;
      periodRanks: { [player: string]: number };
      cumulativeRanks: { [player: string]: number };
      games: any[];
    } | null;
  };
  periodStats: Array<{
    periodKey: string;
    year: number;
    month: number;
    week: number;
    startDate: Date;
    endDate: Date;
    periodRanks: { [player: string]: number };
    cumulativeRanks: { [player: string]: number };
    games: any[];
  }>;
  mostPlayedTeam: {
    team: string;
    teamKey: string;
    total: number;
    wins: number;
    winrate: number;
  } | null;
  monthlyGames: { [month: number]: number };
  mostActiveMonth: { month: number; count: number };
}

type Slide = {
  id: string;
  title: string;
  content: React.ReactNode;
};

export default function RecapPage() {
  const params = useParams();
  const year = parseInt(params.year as string);
  const [stats, setStats] = useState<RecapStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentSlide, setCurrentSlide] = useState<number>(0);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [showShareMenu, setShowShareMenu] = useState<boolean>(false);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const slideContentRef = useRef<HTMLDivElement>(null);
  const shareMenuRef = useRef<HTMLDivElement>(null);
  const captureRef = useRef<HTMLDivElement>(null);
  
  // 이미지 캡처 훅 사용
  const { saveImage: saveImageHandler, shareToKakao: shareToKakaoHandler, shareToInstagram: shareToInstagramHandler } = useSlideImageCapture();

  // 슬라이드 데이터 생성
  const generateSlides = (stats: RecapStats): Slide[] => {
    const slides: Slide[] = [];

    // 슬라이드 1: 타이틀
    slides.push({
      id: 'title',
      title: `${stats.year}년 Recap`,
      content: (
        <div className="text-center">
          <div className="text-6xl mb-4">🎮</div>
          <div className="text-4xl font-bold mb-2">{stats.totalGames}게임</div>
          <div className="text-xl opacity-80 mb-4">함께한 한 해</div>
          <div className="text-lg opacity-70 mt-6">
            올해도 수고 많았어요!<br />
            함께한 게임들을 돌아볼까요? 😊
          </div>
        </div>
      )
    });

    // 슬라이드 2: 총 플레이 횟수 및 기간 수
    const formatDate = (date: Date | null) => {
      if (!date) return '';
      const d = typeof date === 'string' ? new Date(date) : date;
      // 한국 시간 기준으로 변환 (UTC+9)
      const koreaTime = new Date(d.getTime() + (9 * 60 * 60 * 1000));
      const month = koreaTime.getUTCMonth() + 1;
      const day = koreaTime.getUTCDate();
      return `${month}/${day}`;
    };

    slides.push({
      id: 'total-plays',
      title: `올해는 총 ${stats.totalPeriods}번의 만남이 있었어요`,
      content: (
        <div className="text-center">
          <div className="text-7xl mb-6">📊</div>
          <div className="text-5xl font-bold mb-4">{stats.totalPeriods}번</div>
          <div className="text-xl opacity-80 mb-6">
            {`${stats.totalPeriods}번 만나서 ${stats.totalGames}게임을 했어요!`}
          </div>
          <div className="mt-6 max-h-64 overflow-y-auto px-6">
            <div className="grid grid-cols-1 gap-3">
              {stats.periodStats
                .slice()
                .sort((a, b) => {
                  const dateA = typeof a.startDate === 'string' ? new Date(a.startDate) : a.startDate;
                  const dateB = typeof b.startDate === 'string' ? new Date(b.startDate) : b.startDate;
                  return dateA.getTime() - dateB.getTime();
                })
                .map((period, index) => {
                  const startDate = typeof period.startDate === 'string' ? new Date(period.startDate) : period.startDate;
                  const endDate = typeof period.endDate === 'string' ? new Date(period.endDate) : period.endDate;
                  const isSameDay = startDate.getTime() === endDate.getTime();
                  
                  return (
                    <div 
                      key={period.periodKey} 
                      className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-left border border-white/20"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm">
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-semibold text-lg">
                              {index + 1}번째 만남
                            </div>
                            <div className="text-sm opacity-80">
                              {isSameDay 
                                ? formatDate(startDate)
                                : `${formatDate(startDate)} ~ ${formatDate(endDate)}`
                              }
                            </div>
                          </div>
                        </div>
                        <div className="text-sm opacity-60">
                          {period.games.length}게임
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )
    });

    // 슬라이드 3: 올해의 VIP (승률)
    if (stats.vipByWinrate) {
      slides.push({
        id: 'vip-winrate',
        title: '올해의 VIP',
        content: (
          <div className="text-center">
            <div className="text-7xl mb-6">👑</div>
            <div className="text-5xl font-bold mb-4">{getPlayerDisplayName(stats.vipByWinrate.player)}</div>
            <div className="text-3xl mb-2">{stats.vipByWinrate.winrate.toFixed(1)}%</div>
            <div className="text-xl opacity-80 mb-4">
              {stats.vipByWinrate.wins}승 {stats.vipByWinrate.total - stats.vipByWinrate.wins}패
            </div>
            <div className="text-lg opacity-70 mt-6">
              {stats.year}년 최고 승률을 기록했어요!<br />
              축하드려요~! 🎉
            </div>
          </div>
        )
      });
    }

    // 슬라이드 4: 올해의 꼴찌
    if (stats.worstByWinrate) {
      slides.push({
        id: 'worst-winrate',
        title: '올해의 꼴찌',
        content: (
          <div className="text-center">
            <div className="text-7xl mb-6">😅</div>
            <div className="text-5xl font-bold mb-4">{getPlayerDisplayName(stats.worstByWinrate.player)}</div>
            <div className="text-3xl mb-2">{stats.worstByWinrate.winrate.toFixed(1)}%</div>
            <div className="text-xl opacity-80 mb-4">
              {stats.worstByWinrate.wins}승 {stats.worstByWinrate.total - stats.worstByWinrate.wins}패
            </div>
            <div className="text-lg opacity-70 mt-6">
              {stats.year}년 승률이 아쉬웠지만...<br />
              다음엔 더 잘할 수 있을 거예요! 화이팅! 💪
            </div>
          </div>
        )
      });
    }

    // 슬라이드 5: 최고 승률 팀 (최강 팀 조합)
    if (stats.bestWinrateTeam) {
      slides.push({
        id: 'best-winrate-team',
        title: '최강 팀 조합',
        content: (
          <div className="text-center">
            <div className="text-7xl mb-6">👑</div>
            <div className="text-5xl font-bold mb-4">{stats.bestWinrateTeam.team}</div>
            <div className="text-3xl mb-2">{stats.bestWinrateTeam.winrate.toFixed(1)}%</div>
            <div className="text-xl opacity-80 mb-4">
              {stats.bestWinrateTeam.wins}승 {stats.bestWinrateTeam.total - stats.bestWinrateTeam.wins}패
            </div>
            <div className="text-lg opacity-70 mt-6">
              {stats.year}년 최고 승률을 기록한 팀이에요!<br />
              정말 완벽한 조합이었네요! 🎯
            </div>
          </div>
        )
      });
    }

    // 슬라이드 6: 최대 연승 (플레이어)
    if (stats.maxWinStreakPlayer.maxWinStreak > 0) {
      slides.push({
        id: 'max-win-streak-player',
        title: '최대 연승',
        content: (
          <div className="text-center">
            <div className="text-7xl mb-6">🔥</div>
            <div className="text-5xl font-bold mb-4">{getPlayerDisplayName(stats.maxWinStreakPlayer.player)}</div>
            <div className="text-4xl mb-2">{stats.maxWinStreakPlayer.maxWinStreak}연승</div>
            <div className="text-xl opacity-80 mb-4">
              {stats.maxWinStreakPlayer.maxWinStreakPeriod > 0 
                ? `${stats.maxWinStreakPlayer.maxWinStreakPeriod}번째 만남의 기록`
                : '개인 최고 기록'}
            </div>
            <div className="text-lg opacity-70 mt-6">
              {stats.year}년 최대 연승했어요!<br />
              앞으로도 좋은 활약 기대할게요!^^
            </div>
          </div>
        )
      });
    }

    // 슬라이드 7: 최장 연승 (팀)
    if (stats.longestWinStreakTeam.maxWinStreak > 0) {
      slides.push({
        id: 'longest-win-streak-team',
        title: '최장 연승 팀',
        content: (
          <div className="text-center">
            <div className="text-7xl mb-6">⚡</div>
            <div className="text-5xl font-bold mb-4">{stats.longestWinStreakTeam.team}</div>
            <div className="text-4xl mb-2">{stats.longestWinStreakTeam.maxWinStreak}연승</div>
            <div className="text-xl opacity-80 mb-4">
              {stats.longestWinStreakTeam.maxWinStreakPeriod > 0 
                ? `${stats.longestWinStreakTeam.maxWinStreakPeriod}번째 만남의 기록`
                : '팀 최고 기록'}
            </div>
            <div className="text-lg opacity-70 mt-6">
              가장 오래 연승했던 조합이에요!<br />
              정말 무적이었네요! 🔥
            </div>
          </div>
        )
      });
    }

    // 슬라이드 8: 최대 연패
    if (stats.maxLoseStreakPlayer.maxLoseStreak > 0) {
      slides.push({
        id: 'max-lose-streak',
        title: '최대 연패',
        content: (
          <div className="text-center">
            <div className="text-7xl mb-6">💔</div>
            <div className="text-5xl font-bold mb-4">{getPlayerDisplayName(stats.maxLoseStreakPlayer.player)}</div>
            <div className="text-4xl mb-2">{stats.maxLoseStreakPlayer.maxLoseStreak}연패</div>
            <div className="text-xl opacity-80 mb-4">
              {stats.maxLoseStreakPlayer.maxLoseStreakPeriod > 0 
                ? `${stats.maxLoseStreakPlayer.maxLoseStreakPeriod}번째 만남의 기록`
                : '아쉬운 순간이었지만...'}
            </div>
            <div className="text-lg opacity-70 mt-6">
              다음엔 더 잘할 수 있어요!<br />
              실패는 성공의 어머니니까요! 💪
            </div>
          </div>
        )
      });
    }

    // 슬라이드 9: 등수 변동 (기간별 순서대로 비교)
    const rankChangeEntries = Object.entries(stats.rankChanges)
      .filter(([_, data]) => data.bestPeriod && data.worstPeriod && data.change !== 0)
      .map(([player, data]) => ({
        player,
        ...data,
        // change는 이전 등수 - 이후 등수
        // 양수면 상승 (예: 3위 -> 1위, change = 3-1 = 2)
        // 음수면 하락 (예: 1위 -> 3위, change = 1-3 = -2)
      }));

    // 날짜 포맷팅 함수 (등수 변동용)
    const formatPeriodRangeForRank = (period: typeof stats.rankChangeData.firstPeriod) => {
      if (!period) return '';
      const startDate = typeof period.startDate === 'string' ? new Date(period.startDate) : period.startDate;
      const endDate = typeof period.endDate === 'string' ? new Date(period.endDate) : period.endDate;
      
      // 한국 시간 기준으로 변환 (UTC+9)
      const startKoreaTime = new Date(startDate.getTime() + (9 * 60 * 60 * 1000));
      const endKoreaTime = new Date(endDate.getTime() + (9 * 60 * 60 * 1000));
      
      const startMonth = startKoreaTime.getUTCMonth() + 1;
      const startDay = startKoreaTime.getUTCDate();
      const endMonth = endKoreaTime.getUTCMonth() + 1;
      const endDay = endKoreaTime.getUTCDate();
      
      if (startDate.getTime() === endDate.getTime()) {
        return `${startMonth}/${startDay}`;
      }
      return `${startMonth}/${startDay} ~ ${endMonth}/${endDay}`;
    };

    // 기간 번호 찾기
    const getPeriodNumber = (period: typeof stats.rankChangeData.firstPeriod) => {
      if (!period) return 0;
      const sortedPeriods = stats.periodStats
        .slice()
        .sort((a, b) => {
          const dateA = typeof a.startDate === 'string' ? new Date(a.startDate) : a.startDate;
          const dateB = typeof b.startDate === 'string' ? new Date(b.startDate) : b.startDate;
          return dateA.getTime() - dateB.getTime();
        });
      const index = sortedPeriods.findIndex(p => p.periodKey === period.periodKey);
      return index + 1;
    };

    // 순위 상승: change가 양수인 경우 (이전 등수 > 이후 등수, 예: 3위 -> 1위)
    const risers = rankChangeEntries
      .filter(entry => entry.change > 0)
      .sort((a, b) => b.change - a.change); // change가 큰 순서대로

    // 순위 하락: change가 음수인 경우 (이전 등수 < 이후 등수, 예: 1위 -> 3위)
    const fallers = rankChangeEntries
      .filter(entry => entry.change < 0)
      .sort((a, b) => a.change - b.change); // change가 작은 순서대로 (절댓값이 큰 순서)

    // 순위 상승 슬라이드 (동일한 change 값을 가진 플레이어 모두 표시)
    if (risers.length > 0) {
      const maxRiseChange = risers[0].change;
      const biggestRisers = risers.filter(r => r.change === maxRiseChange);

      biggestRisers.forEach((riser, index) => {
        const fromPeriodNum = getPeriodNumber(riser.worstPeriod);
        const toPeriodNum = getPeriodNumber(riser.bestPeriod);
        const fromPeriodRange = formatPeriodRangeForRank(riser.worstPeriod);
        const toPeriodRange = formatPeriodRangeForRank(riser.bestPeriod);

        slides.push({
          id: `rank-rise-${index}`,
          title: biggestRisers.length > 1 ? '순위 상승' : '순위 상승',
          content: (
            <div className="text-center">
              <div className="text-7xl mb-6">📈</div>
              <div className="text-5xl font-bold mb-4">{getPlayerDisplayName(riser.player)}</div>
              <div className="text-3xl mb-2">
                {riser.worst}위 → {riser.best}위
              </div>
              <div className="text-xl opacity-80 mb-4">
                {riser.change}단계 상승
              </div>
              <div className="text-lg opacity-70 mt-6">
                {fromPeriodNum}번째 만남({fromPeriodRange})에는 {riser.worst}위였는데<br />
                {toPeriodNum}번째 만남({toPeriodRange})에는 {riser.best}위로 올라갔어요!<br />
                정말 대단한 성장이에요! 🚀
              </div>
            </div>
          )
        });
      });
    }

    // 순위 하락 슬라이드 (동일한 change 값을 가진 플레이어 모두 표시)
    if (fallers.length > 0) {
      const maxFallChange = fallers[0].change;
      const biggestFallers = fallers.filter(f => f.change === maxFallChange);

      biggestFallers.forEach((faller, index) => {
        const fromPeriodNum = getPeriodNumber(faller.bestPeriod);
        const toPeriodNum = getPeriodNumber(faller.worstPeriod);
        const fromPeriodRange = formatPeriodRangeForRank(faller.bestPeriod);
        const toPeriodRange = formatPeriodRangeForRank(faller.worstPeriod);

        slides.push({
          id: `rank-fall-${index}`,
          title: biggestFallers.length > 1 ? '순위 하락' : '순위 하락',
          content: (
            <div className="text-center">
              <div className="text-7xl mb-6">📉</div>
              <div className="text-5xl font-bold mb-4">{getPlayerDisplayName(faller.player)}</div>
              <div className="text-3xl mb-2">
                {faller.best}위 → {faller.worst}위
              </div>
              <div className="text-xl opacity-80 mb-4">
                {Math.abs(faller.change)}단계 하락
              </div>
              <div className="text-lg opacity-70 mt-6">
                {fromPeriodNum}번째 만남({fromPeriodRange})에는 {faller.best}위였는데<br />
                {toPeriodNum}번째 만남({toPeriodRange})에는 {faller.worst}위로 내려갔어요.<br />
                다음엔 다시 올라갈 수 있을 거예요! 💪
              </div>
            </div>
          )
        });
      });
    }

    // 슬라이드 10: 가장 많이 플레이한 팀
    if (stats.mostPlayedTeam) {
      slides.push({
        id: 'most-played-team',
        title: '인기 팀 조합',
        content: (
          <div className="text-center">
            <div className="text-7xl mb-6">🎯</div>
            <div className="text-5xl font-bold mb-4">{stats.mostPlayedTeam.team}</div>
            <div className="text-3xl mb-2">{stats.mostPlayedTeam.total}게임</div>
            <div className="text-xl opacity-80 mb-4">
              승률 {stats.mostPlayedTeam.winrate.toFixed(1)}%
            </div>
            <div className="text-lg opacity-70 mt-6">
              가장 많이 함께 플레이한 조합이에요!<br />
              이 조합이면 안심이 되죠? 😊
            </div>
          </div>
        )
      });
    }

    // 슬라이드 11: 가장 활발한 월
    if (stats.mostActiveMonth.count > 0) {
      const monthNames = ['', '1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
      slides.push({
        id: 'most-active-month',
        title: '가장 활발한 달',
        content: (
          <div className="text-center">
            <div className="text-7xl mb-6">📅</div>
            <div className="text-5xl font-bold mb-4">{monthNames[stats.mostActiveMonth.month]}</div>
            <div className="text-4xl mb-2">{stats.mostActiveMonth.count}게임</div>
            <div className="text-xl opacity-80 mb-4">가장 많은 게임을 한 달</div>
            <div className="text-lg opacity-70 mt-6">
              {monthNames[stats.mostActiveMonth.month]}에 정말 열심히 놀았네요!<br />
              그때가 가장 즐거웠을 거예요! 🎮
            </div>
          </div>
        )
      });
    }

    // 슬라이드 12: 기간별 등수 차트
    if (stats.periodStats && stats.periodStats.length > 0) {
      slides.push({
        id: 'rank-chart',
        title: '기간별 등수 변화',
        content: <RankChart periodStats={stats.periodStats} />
      });
    }

    // 슬라이드 11: 마무리
    slides.push({
      id: 'ending',
      title: '마무리',
      content: (
        <div className="text-center">
          <div className="text-7xl mb-6">🎉</div>
          <div className="text-4xl font-bold mb-4">수고 많았어요!</div>
          <div className="text-xl opacity-80 mb-6">
            {stats.year}년도 함께 즐겁게 보냈네요
          </div>
          <div className="text-lg opacity-70 mt-6">
            내년에도 싸우지 말고<br />
            좋은 게임 즐겨봐요! 😊<br />
            <span className="text-base opacity-60 mt-4 block">다음 년도에도 함께해요!</span>
          </div>
        </div>
      )
    });

    return slides;
  };

  // 데이터 로드
  useEffect(() => {
    const fetchRecapStats = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/recap/${year}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Recap 데이터를 불러오는데 실패했습니다.');
        }

        setStats(data.data);
      } catch (error: any) {
        console.error('Recap 데이터 불러오기 오류:', error);
        setError(error.message || 'Recap 데이터를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    if (year) {
      fetchRecapStats();
    }
  }, [year]);

  // 터치 이벤트 핸들러
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    touchEndX.current = e.changedTouches[0].clientX;
    handleSwipe();
  };

  const handleSwipe = () => {
    if (isAnimating) return;
    
    const diff = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 50;

    if (Math.abs(diff) > minSwipeDistance) {
      setIsAnimating(true);
      if (diff > 0) {
        // 왼쪽으로 스와이프 (다음 슬라이드)
        nextSlide();
      } else {
        // 오른쪽으로 스와이프 (이전 슬라이드)
        prevSlide();
      }
      setTimeout(() => setIsAnimating(false), 300);
    }
  };

  const nextSlide = () => {
    if (!stats) return;
    const slides = generateSlides(stats);
    setCurrentSlide((prev) => (prev < slides.length - 1 ? prev + 1 : prev));
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev > 0 ? prev - 1 : 0));
  };

  // 키보드 이벤트 핸들러
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        prevSlide();
      } else if (e.key === 'ArrowRight') {
        nextSlide();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [stats]);

  // 공유 메뉴 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (shareMenuRef.current && !shareMenuRef.current.contains(event.target as Node)) {
        setShowShareMenu(false);
      }
    };

    if (showShareMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showShareMenu]);

  // 이미지 저장 함수
  const saveImage = async () => {
    if (!captureRef.current || !slideContentRef.current || !stats) return;
    
    await saveImageHandler(
      captureRef,
      slideContentRef,
      `${stats.year}년_Recap_${currentSlide + 1}.png`,
      setIsCapturing
    );
  };

  // SNS 공유 함수
  const shareToKakao = async () => {
    if (!captureRef.current || !slideContentRef.current || !stats) return;
    
    await shareToKakaoHandler(
      captureRef,
      slideContentRef,
      `${stats.year}년_Recap_${currentSlide + 1}.png`,
      setIsCapturing,
      window.location.href
    );
  };

  const shareToInstagram = async () => {
    if (!captureRef.current || !slideContentRef.current || !stats) return;
    
    await shareToInstagramHandler(
      captureRef,
      slideContentRef,
      `${stats.year}년_Recap_${currentSlide + 1}.png`,
      setIsCapturing
    );
  };


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-xl">Recap을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <p className="text-white text-xl mb-4">{error || '데이터를 불러올 수 없습니다.'}</p>
          <Link
            href="/hall-of-fame"
            className="px-6 py-3 bg-white text-purple-900 font-bold rounded-lg hover:bg-gray-100 transition-colors"
          >
            명예의 전당으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  const slides = generateSlides(stats);
  const currentSlideData = slides[currentSlide];

  return (
    <div
      ref={containerRef}
      className="min-h-screen relative overflow-hidden bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* 캡처용 컨테이너 (전체 화면) */}
      <div
        ref={captureRef}
        className="min-h-screen relative"
        style={{
          background: 'linear-gradient(to bottom right, #581c87, #1e3a8a, #312e81)',
        }}
      >
        {/* 움직이는 그라데이션 배경 */}
        <div className={`absolute inset-0 overflow-hidden ${isCapturing ? '' : 'animate-gradient-xy'}`} style={{
          background: isCapturing 
            ? 'linear-gradient(to bottom right, #581c87, #1e3a8a, #312e81)'
            : undefined
        }}>
          {!isCapturing && (
            <>
              <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 animate-gradient-xy"></div>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(120,119,198,0.3),transparent_50%)] animate-pulse"></div>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(219,39,119,0.3),transparent_50%)] animate-pulse" style={{ animationDelay: '1s' }}></div>
            </>
          )}
        </div>

        {/* 네비게이션 버튼 */}
        <div className="absolute top-4 left-4 z-20" data-exclude-from-capture>
          <Link
            href="/hall-of-fame"
            className="px-4 py-2 bg-white/10 backdrop-blur-md text-white rounded-lg hover:bg-white/20 transition-colors flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            돌아가기
          </Link>
        </div>

        {/* 슬라이드 컨테이너 */}
        <div className="relative z-10 min-h-screen flex items-center justify-center p-8">
          <div
            ref={slideContentRef}
            key={currentSlide}
            className={`w-full max-w-4xl text-center text-white transition-all duration-300 ${
              isAnimating ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
            }`}
          >
          {/* 제목 */}
          <h1
            className="text-5xl md:text-6xl font-bold mb-8 opacity-0"
            style={{ 
              animation: 'fade-in-up 0.8s ease-out 0.1s forwards'
            }}
          >
            {currentSlideData.title}
          </h1>

          {/* 콘텐츠 */}
          <div
            className="opacity-0"
            style={{ 
              animation: 'fade-in-up 0.8s ease-out 0.3s forwards'
            }}
          >
            {currentSlideData.content}
          </div>
        </div>
        </div>
      </div>

      {/* 공유 및 저장 버튼 */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-2" data-exclude-from-capture>
        <button
          onClick={saveImage}
          className="px-4 py-2 bg-white/10 backdrop-blur-md text-white rounded-lg hover:bg-white/20 transition-colors flex items-center gap-2"
          title="이미지로 저장"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
          <span className="text-sm">저장</span>
        </button>
        
        <div className="relative" ref={shareMenuRef}>
          <button
            onClick={() => setShowShareMenu(!showShareMenu)}
            className="px-4 py-2 bg-white/10 backdrop-blur-md text-white rounded-lg hover:bg-white/20 transition-colors flex items-center gap-2"
            title="공유하기"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
            </svg>
            <span className="text-sm">공유</span>
          </button>
          
          {/* 공유 메뉴 */}
          {showShareMenu && (
            <div className="absolute right-0 top-full mt-2 bg-white/95 backdrop-blur-md rounded-lg shadow-lg p-2 min-w-[160px] z-30">
              <button
                onClick={() => {
                  shareToKakao();
                  setShowShareMenu(false);
                }}
                className="w-full px-3 py-2 text-left text-sm text-gray-800 hover:bg-gray-100 rounded flex items-center gap-2"
              >
                <img 
                  src="/kakaotalk.png" 
                  alt="카카오톡" 
                  className="w-5 h-5"
                />
                <span>카카오톡</span>
              </button>
              <button
                onClick={() => {
                  shareToInstagram();
                  setShowShareMenu(false);
                }}
                className="w-full px-3 py-2 text-left text-sm text-gray-800 hover:bg-gray-100 rounded flex items-center gap-2"
              >
                <img 
                  src="/instagram.png" 
                  alt="인스타그램" 
                  className="w-5 h-5"
                />
                <span>인스타그램</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 슬라이드 인디케이터 */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20 flex gap-2" data-exclude-from-capture>
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              setIsAnimating(true);
              setCurrentSlide(index);
              setTimeout(() => setIsAnimating(false), 300);
            }}
            className={`h-2 rounded-full transition-all duration-300 ${
              index === currentSlide
                ? 'w-8 bg-white'
                : 'w-2 bg-white/50 hover:bg-white/75'
            }`}
            aria-label={`슬라이드 ${index + 1}`}
          />
        ))}
      </div>

      {/* 이전/다음 버튼 */}
      {currentSlide > 0 && (
        <button
          onClick={prevSlide}
          className="absolute left-8 top-1/2 transform -translate-y-1/2 z-20 p-4 bg-white/10 backdrop-blur-md text-white rounded-full hover:bg-white/20 transition-colors"
          aria-label="이전 슬라이드"
          data-exclude-from-capture
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </button>
      )}

      {currentSlide < slides.length - 1 && (
        <button
          onClick={nextSlide}
          className="absolute right-8 top-1/2 transform -translate-y-1/2 z-20 p-4 bg-white/10 backdrop-blur-md text-white rounded-full hover:bg-white/20 transition-colors"
          aria-label="다음 슬라이드"
          data-exclude-from-capture
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        </button>
      )}

      {/* 스와이프 힌트 */}
      <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 z-20 text-white/60 text-sm" data-exclude-from-capture>
        ← 스와이프하여 탐색 →
      </div>

    </div>
  );
}

