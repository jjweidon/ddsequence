import React, { useState } from 'react';
import RankUpConditionsModal from './RankUpConditionsModal';
import { calculateRankUpConditions } from '@/utils/rankUpConditions';

interface PlayerWinrateData {
  rank: number;
  player: string;
  winrate: number;
  wins: number;
  total: number;
}

interface TeamWinrateData {
  rank: number;
  team: string;
  winrate: number;
  wins: number;
  total: number;
}

interface PlayerWinsData {
  rank: number;
  player: string;
  wins: number;
  winrate: number;
}

interface StatsListProps {
  totalGames: number;
  playerWinrates: PlayerWinrateData[];
  teamWinrates: TeamWinrateData[];
  playerWins: PlayerWinsData[];
  dateRange?: { startDate: string; endDate: string } | null;
}

const StatsList: React.FC<StatsListProps> = ({
  totalGames,
  playerWinrates,
  teamWinrates,
  playerWins,
  dateRange
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // 날짜에서 요일을 가져오는 함수
  const getDayOfWeek = (dateString: string) => {
    const date = new Date(dateString);
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    return days[date.getDay()];
  };

  // 순위 상승 조건 계산
  const rankUpConditions = calculateRankUpConditions(
    playerWinrates as PlayerWinrateData[]
  );

  return (
    <div className="flex flex-col w-full gap-4">
      {/* 게임 수 */}
      <div className="bg-surface border border-border rounded-lg px-4 py-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted">
            {dateRange 
              ? `${dateRange.startDate} (${getDayOfWeek(dateRange.startDate)}) ~ ${dateRange.endDate} (${getDayOfWeek(dateRange.endDate)})`
              : '전체 기간'
            }
          </span>
          <span className="text-lg font-semibold text-foreground">
            총 {totalGames}게임
          </span>
        </div>
      </div>
      
      {/* 개인 승률 테이블 */}
      <div className="bg-surface border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-3 bg-surface-hover border-b border-border flex items-center justify-between">
          <h3 className="font-semibold text-foreground">개인 승률</h3>
          <button
            onClick={() => setIsModalOpen(true)}
            className="text-xs px-2 py-1 bg-border hover:bg-border-strong text-foreground rounded-lg transition-colors flex items-center gap-1"
            title="순위 상승 조건 보기"
          >
            <svg
              className="w-3 h-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            순위 상승 조건
          </button>
        </div>
        <table className="w-full table-fixed">
          <thead>
            <tr className="bg-surface-hover border-b border-border">
              <th className="w-16 py-2 text-center text-xs font-semibold text-muted">순위</th>
              <th className="py-2 text-center text-xs font-semibold text-muted">이름</th>
              <th className="w-24 py-2 text-center text-xs font-semibold text-muted">승률</th>
              <th className="w-32 py-2 text-center text-xs font-semibold text-muted">승/패(게임수)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {playerWinrates.map((stat) => {
              const isFirstPlace = stat.rank === 1;
              
              return (
                <tr 
                  key={stat.player} 
                  className={`${
                    isFirstPlace 
                      ? 'bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 dark:from-cyan-600 dark:via-purple-700 dark:to-pink-700 animate-gradient' 
                      : 'hover:bg-surface-hover'
                  } transition-all duration-300`}
                >
                  <td className="py-3 text-center">
                    <span className={`inline-flex items-center justify-center w-7 h-7 rounded-md font-semibold text-sm ${
                      isFirstPlace
                        ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-300'
                        : 'text-muted'
                    }`}>
                      {stat.rank}
                    </span>
                  </td>
                  <td className={`py-3 text-center font-semibold text-sm sm:text-base ${
                    isFirstPlace 
                      ? 'text-white dark:text-white' 
                      : 'text-foreground'
                  }`}>
                    {stat.player}
                  </td>
                  <td className="py-3 text-center">
                    <span className={`text-sm sm:text-lg font-semibold ${
                      isFirstPlace 
                        ? 'text-white dark:text-white' 
                        : 'text-foreground'
                    }`}>
                      {stat.winrate.toFixed(2)}%
                    </span>
                  </td>
                  <td className={`py-3 text-center text-xs sm:text-sm ${
                    isFirstPlace 
                      ? 'text-white/90 dark:text-white/90' 
                      : 'text-muted'
                  }`}>
                    <span className={`font-semibold ${
                      isFirstPlace 
                        ? 'text-white dark:text-white' 
                        : 'text-win'
                    }`}>{stat.wins}</span>
                    <span className="mx-1">/</span>
                    <span className={`font-semibold ${
                      isFirstPlace 
                        ? 'text-white dark:text-white' 
                        : 'text-lose'
                    }`}>{stat.total - stat.wins}</span>
                    <span className="ml-1 text-xs">({stat.total})</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {/* 팀 승률 테이블 */}
      <div className="bg-surface border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-3 bg-surface-hover border-b border-border">
          <h3 className="font-semibold text-foreground">팀 승률</h3>
        </div>
        <table className="w-full table-fixed">
          <thead>
            <tr className="bg-surface-hover border-b border-border">
              <th className="w-16 py-2 text-center text-xs font-semibold text-muted">순위</th>
              <th className="py-2 text-center text-xs font-semibold text-muted">팀</th>
              <th className="w-24 py-2 text-center text-xs font-semibold text-muted">승률</th>
              <th className="w-32 py-2 text-center text-xs font-semibold text-muted">승/패(게임수)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {teamWinrates.map((stat) => {
              const isFirstPlace = stat.rank === 1;
              
              return (
                <tr 
                  key={stat.team} 
                  className={`${
                    isFirstPlace 
                      ? 'bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 dark:from-cyan-600 dark:via-purple-700 dark:to-pink-700 animate-gradient' 
                      : 'hover:bg-surface-hover'
                  } transition-all duration-300`}
                >
                  <td className="py-3 text-center">
                    <span className={`inline-flex items-center justify-center w-7 h-7 rounded-md font-semibold text-sm ${
                      isFirstPlace
                        ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-300'
                        : 'text-muted'
                    }`}>
                      {stat.rank}
                    </span>
                  </td>
                  <td className={`py-3 text-center font-semibold text-sm sm:text-base ${
                    isFirstPlace 
                      ? 'text-white dark:text-white' 
                      : 'text-foreground'
                  }`}>
                    {stat.team}
                  </td>
                  <td className="py-3 text-center">
                    <span className={`text-sm sm:text-lg font-semibold ${
                      isFirstPlace 
                        ? 'text-white dark:text-white' 
                        : 'text-foreground'
                    }`}>
                      {stat.winrate.toFixed(2)}%
                    </span>
                  </td>
                  <td className={`py-3 text-center text-xs sm:text-sm ${
                    isFirstPlace 
                      ? 'text-white/90 dark:text-white/90' 
                      : 'text-muted'
                  }`}>
                    <span className={`font-semibold ${
                      isFirstPlace 
                        ? 'text-white dark:text-white' 
                        : 'text-win'
                    }`}>{stat.wins}</span>
                    <span className="mx-1">/</span>
                    <span className={`font-semibold ${
                      isFirstPlace 
                        ? 'text-white dark:text-white' 
                        : 'text-lose'
                    }`}>{stat.total - stat.wins}</span>
                    <span className="ml-1 text-xs">({stat.total})</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 순위 상승 조건 모달 */}
      <RankUpConditionsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        conditions={rankUpConditions}
      />
    </div>
  );
};

export default StatsList; 