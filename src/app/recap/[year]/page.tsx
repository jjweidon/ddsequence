'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
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

// 슬라이드 데이터 생성 함수 (컴포넌트 외부로 이동)
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
        <div className="text-4xl font-bold mb-4">{stats.totalPeriods}번</div>
        <div className="text-lg opacity-80 mb-6">
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

export default function RecapPage() {
  const params = useParams();
  const router = useRouter();
  const year = parseInt(params.year as string);
  const [stats, setStats] = useState<RecapStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentSlide, setCurrentSlide] = useState<number>(0);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [showShareMenu, setShowShareMenu] = useState<boolean>(false);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [slideProgress, setSlideProgress] = useState<number>(0); // 현재 슬라이드 진행률 (0-100)
  const [isPaused, setIsPaused] = useState<boolean>(false); // 자동 슬라이드 일시정지
  const [viewportHeight, setViewportHeight] = useState<string>('100vh'); // 동적 뷰포트 높이
  const [isMuted, setIsMuted] = useState<boolean>(false); // BGM 음소거 상태
  const [bgmVolume, setBgmVolume] = useState<number>(0.3); // BGM 볼륨 (0-1)
  
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const slideContentRef = useRef<HTMLDivElement>(null);
  const shareMenuRef = useRef<HTMLDivElement>(null);
  const captureRef = useRef<HTMLDivElement>(null);
  const progressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const currentSlideRef = useRef<number>(0);
  const slidesLengthRef = useRef<number>(0);
  const isTransitioningRef = useRef<boolean>(false);
  const bgmAudioRef = useRef<HTMLAudioElement | null>(null);
  
  // 이미지 캡처 훅 사용
  const { saveImage: saveImageHandler, shareToKakao: shareToKakaoHandler, shareToInstagram: shareToInstagramHandler } = useSlideImageCapture();

  // BGM 초기화 및 재생
  useEffect(() => {
    // 외부 음원 URL 또는 public 폴더의 파일 경로
    // 예시: 무료 게임 BGM URL 또는 '/bgm.mp3' (public 폴더에 파일이 있는 경우)
    const bgmUrl = '/bgm/jingle_bells.mp3'; // public 폴더에 bgm.mp3 파일을 넣으면 됩니다
    
    // Audio 객체 생성
    const audio = new Audio(bgmUrl);
    audio.loop = true; // 반복 재생
    audio.volume = bgmVolume;
    
    // 오류 처리
    audio.addEventListener('error', (e) => {
      console.warn('BGM 로드 실패:', e);
      // BGM 파일이 없어도 페이지는 정상 작동하도록 함
    });
    
    bgmAudioRef.current = audio;
    
    // 사용자 상호작용 후 재생 (브라우저 정책)
    const playBGM = async () => {
      try {
        await audio.play();
      } catch (error) {
        console.log('BGM 자동 재생 실패 (사용자 상호작용 필요):', error);
      }
    };
    
    // 페이지 로드 후 약간의 지연을 두고 재생 시도
    const timer = setTimeout(() => {
      playBGM();
    }, 500);
    
    return () => {
      clearTimeout(timer);
      if (audio) {
        audio.pause();
        audio.src = '';
      }
    };
  }, []); // 최초 한 번만 실행

  // 볼륨 변경 시 적용
  useEffect(() => {
    if (bgmAudioRef.current) {
      bgmAudioRef.current.volume = isMuted ? 0 : bgmVolume;
    }
  }, [bgmVolume, isMuted]);

  // 음소거 토글
  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const newMuted = !prev;
      if (bgmAudioRef.current) {
        bgmAudioRef.current.volume = newMuted ? 0 : bgmVolume;
      }
      return newMuted;
    });
  }, [bgmVolume]);

  // 슬라이드 데이터 메모이제이션
  const slides = useMemo(() => {
    if (!stats) return [];
    const generatedSlides = generateSlides(stats);
    slidesLengthRef.current = generatedSlides.length;
    return generatedSlides;
  }, [stats]);

  // currentSlide 변경 시 ref 및 플래그 업데이트
  useEffect(() => {
    currentSlideRef.current = currentSlide;
    setSlideProgress(0);
    isTransitioningRef.current = false;
  }, [currentSlide]);

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
    if (isAnimating) return;
    
    touchEndX.current = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 50;

    if (Math.abs(diff) > minSwipeDistance) {
      setIsAnimating(true);
      if (diff > 0) {
        nextSlide();
      } else {
        prevSlide();
      }
      setTimeout(() => setIsAnimating(false), 300);
    }
  };

  // 타이머 정리 헬퍼 함수
  const clearProgressTimer = useCallback(() => {
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
  }, []);

  const nextSlide = useCallback(() => {
    if (slides.length === 0) return;
    setCurrentSlide((prev) => Math.min(prev + 1, slides.length - 1));
  }, [slides.length]);

  const prevSlide = useCallback(() => {
    if (slides.length === 0) return;
    setCurrentSlide((prev) => Math.max(prev - 1, 0));
  }, [slides.length]);

  // 화면 클릭 핸들러 (좌우 분할)
  const handleScreenClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isAnimating || isCapturing) return;
    
    const clickX = e.clientX;
    const screenWidth = window.innerWidth;
    const leftHalf = screenWidth / 2;
    
    // 상단 버튼 영역이나 인디케이터 영역 클릭은 무시
    const target = e.target as HTMLElement;
    if (target.closest('[data-exclude-from-capture]') || 
        target.closest('button') || 
        target.closest('a')) {
      return;
    }
    
    if (clickX < leftHalf) {
      // 왼쪽 클릭 - 이전 슬라이드
      prevSlide();
    } else {
      // 오른쪽 클릭 - 다음 슬라이드
      nextSlide();
    }
  };

  // 자동 슬라이드 및 진행률 업데이트
  useEffect(() => {
    if (isTransitioningRef.current) return;
    
    setSlideProgress(0);
    clearProgressTimer();
    
    if (slides.length === 0 || isPaused || isCapturing) {
      return;
    }
    
    const updateProgress = () => {
      if (isTransitioningRef.current) return;
      
      setSlideProgress((prev) => {
        const increment = 1; // 100ms마다 1% 증가 (10초 = 100%)
        const newProgress = prev + increment;
        
        if (newProgress >= 100) {
          if (isTransitioningRef.current) return 0;
          
          isTransitioningRef.current = true;
          clearProgressTimer();
          
          const currentSlideIndex = currentSlideRef.current;
          const totalSlides = slidesLengthRef.current;
          
          if (currentSlideIndex < totalSlides - 1) {
            const nextSlideIndex = currentSlideIndex + 1;
            currentSlideRef.current = nextSlideIndex;
            setCurrentSlide(nextSlideIndex);
            setSlideProgress(0);
          } else {
            setTimeout(() => router.push('/hall-of-fame'), 500);
          }
          return 0;
        }
        return newProgress;
      });
    };
    
    progressTimerRef.current = setInterval(updateProgress, 100);
    
    return clearProgressTimer;
  }, [slides.length, currentSlide, isPaused, isCapturing, router, clearProgressTimer]);

  // 키보드 이벤트 핸들러
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        prevSlide();
      } else if (e.key === 'ArrowRight') {
        nextSlide();
      } else if (e.key === ' ') {
        // 스페이스바로 일시정지/재생
        e.preventDefault();
        setIsPaused((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [prevSlide, nextSlide]);

  // 모바일 전체화면 및 주소창 숨김 처리
  useEffect(() => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    if (!isMobile) {
      setViewportHeight('100vh');
      return;
    }

    // 실제 뷰포트 높이 계산 (visualViewport API 사용)
    const getViewportHeight = () => {
      // visualViewport가 있으면 사용 (주소창이 숨겨진 상태의 높이)
      if (window.visualViewport) {
        return window.visualViewport.height;
      }
      // fallback: window.innerHeight 사용
      return window.innerHeight;
    };

    // 주소창 숨기기 함수 (효과적인 방법)
    const hideAddressBar = () => {
      // 1px 스크롤로 주소창 숨기기
      window.scrollTo(0, 1);
      
      // 즉시 다시 0으로 스크롤 (화면은 그대로, 주소창만 숨김)
      setTimeout(() => {
        window.scrollTo(0, 0);
      }, 0);
    };

    // 전체 화면 스타일 적용
    const originalBodyStyle = {
      overflow: document.body.style.overflow,
      height: document.body.style.height,
      position: document.body.style.position,
      width: document.body.style.width,
      top: document.body.style.top,
      left: document.body.style.left,
    };

    const originalHtmlStyle = {
      height: document.documentElement.style.height,
      overflow: document.documentElement.style.overflow,
    };

    const setFullScreenStyles = () => {
      const vh = getViewportHeight();
      const vhPx = `${vh}px`;

      // state 업데이트로 컨테이너 높이도 동기화
      setViewportHeight(vhPx);

      // body 스타일 설정
      Object.assign(document.body.style, {
        overflow: 'hidden',
        height: vhPx,
        position: 'fixed',
        width: '100%',
        top: '0',
        left: '0',
        touchAction: 'none',
      });

      // html 스타일 설정
      Object.assign(document.documentElement.style, {
        height: vhPx,
        overflow: 'hidden',
        position: 'fixed',
        width: '100%',
      });
    };

    // 초기 설정
    setFullScreenStyles();
    
    // 주소창 숨기기 시도 (여러 번)
    hideAddressBar();
    setTimeout(hideAddressBar, 100);
    setTimeout(hideAddressBar, 300);
    setTimeout(hideAddressBar, 500);
    setTimeout(hideAddressBar, 1000);

    // 이벤트 핸들러들
    const handleResize = () => {
      setFullScreenStyles();
      hideAddressBar();
    };

    const handleOrientationChange = () => {
      setTimeout(() => {
        setFullScreenStyles();
        hideAddressBar();
      }, 100);
    };

    // visualViewport 변경 감지 (주소창 표시/숨김 감지)
    const handleVisualViewportResize = () => {
      setFullScreenStyles();
      hideAddressBar();
    };

    // 터치 이벤트로 주소창 숨기기
    const handleTouchStart = () => {
      hideAddressBar();
    };

    const handleTouchMove = () => {
      hideAddressBar();
    };

    const handleScroll = () => {
      hideAddressBar();
    };

    // 이벤트 리스너 등록
    window.addEventListener('resize', handleResize, { passive: true });
    window.addEventListener('orientationchange', handleOrientationChange);
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleVisualViewportResize);
    }
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // 페이지 로드 후 추가 시도
    if (document.readyState === 'complete') {
      setTimeout(hideAddressBar, 100);
      setTimeout(hideAddressBar, 500);
    } else {
      window.addEventListener('load', () => {
        setTimeout(hideAddressBar, 100);
        setTimeout(hideAddressBar, 500);
      });
    }

    return () => {
      // 이벤트 리스너 제거
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleVisualViewportResize);
      }
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('scroll', handleScroll);
      
      // 원래 스타일 복원
      Object.assign(document.body.style, originalBodyStyle);
      Object.assign(document.documentElement.style, originalHtmlStyle);
    };
  }, []);

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

  const currentSlideData = slides[currentSlide] || null;

  if (!currentSlideData) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className="min-h-screen relative overflow-hidden bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 cursor-pointer"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onClick={handleScreenClick}
      style={{
        height: viewportHeight,
        minHeight: viewportHeight,
        maxHeight: viewportHeight,
        overflow: 'hidden',
        position: 'fixed',
        width: '100%',
        top: 0,
        left: 0,
        touchAction: 'none',
        WebkitOverflowScrolling: 'touch',
      }}
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

        {/* 네비게이션 버튼 - 현재 숨김 처리 (로직은 유지) */}
        <div 
          className="absolute top-4 left-4 z-20" 
          data-exclude-from-capture
          style={{ display: 'none' }}
        >
          <Link
            href="/hall-of-fame"
            className="px-4 py-2 bg-white/10 backdrop-blur-md text-white rounded-lg hover:bg-white/20 transition-colors flex items-center gap-2 pointer-events-none"
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
            className="text-4xl md:text-5xl font-bold mb-8 opacity-0"
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

      {/* 공유 및 저장 버튼 - 현재 숨김 처리 (로직은 유지) */}
      <div 
        className="absolute top-4 right-4 z-20 flex flex-col gap-2" 
        data-exclude-from-capture
        style={{ display: 'none' }}
      >
        <button
          onClick={saveImage}
          disabled
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
            disabled
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

      {/* BGM 컨트롤 버튼 */}
      <div 
        className="absolute top-4 right-4 z-20" 
        data-exclude-from-capture
        style={{ display: 'none' }}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleMute();
          }}
          className="px-4 py-2 bg-white/10 backdrop-blur-md text-white rounded-lg hover:bg-white/20 transition-colors flex items-center gap-2"
          title={isMuted ? 'BGM 켜기' : 'BGM 끄기'}
          aria-label={isMuted ? 'BGM 켜기' : 'BGM 끄기'}
        >
          {isMuted ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.793L4.617 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.617l3.766-3.793a1 1 0 011.617.793zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
              <path d="M2.293 2.293a1 1 0 011.414 0l14 14a1 1 0 01-1.414 1.414l-14-14a1 1 0 010-1.414z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.793L4.617 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.617l3.766-3.793a1 1 0 011.617.793zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
            </svg>
          )}
          <span className="text-sm hidden sm:inline">{isMuted ? 'BGM 켜기' : 'BGM 끄기'}</span>
        </button>
      </div>

      {/* 슬라이드 인디케이터 - 게이지바 형식 */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20 w-4/5 max-w-2xl px-4" data-exclude-from-capture>
        <div className="flex gap-1.5 items-center">
          {slides.map((_, index) => {
            const isActive = index === currentSlide;
            const progress = isActive ? slideProgress : index < currentSlide ? 100 : 0;
            
            return (
              <div
                key={index}
                className="flex-1 h-1.5 bg-white/20 rounded-full overflow-hidden relative cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsAnimating(true);
                  setCurrentSlide(index);
                  setSlideProgress(0);
                  setTimeout(() => setIsAnimating(false), 300);
                }}
                aria-label={`슬라이드 ${index + 1}`}
              >
                {/* 배경 (항상 표시) */}
                <div className="absolute inset-0 bg-white/20 rounded-full" />
                {/* 진행률 바 */}
                <div
                  className="absolute inset-0 bg-white rounded-full transition-all duration-100 ease-linear origin-left"
                  style={{
                    width: `${progress}%`,
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>


    </div>
  );
}

