import React from 'react';

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
  // 날짜에서 요일을 가져오는 함수
  const getDayOfWeek = (dateString: string) => {
    const date = new Date(dateString);
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    return days[date.getDay()];
  };

  return (
    <div className="flex flex-col w-full gap-4">
      {/* 게임 수 */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm px-4 py-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-600 dark:text-slate-400">
            {dateRange 
              ? `${dateRange.startDate} (${getDayOfWeek(dateRange.startDate)}) ~ ${dateRange.endDate} (${getDayOfWeek(dateRange.endDate)})`
              : '전체 기간'
            }
          </span>
          <span className="text-lg font-bold text-slate-800 dark:text-slate-100">
            총 {totalGames}게임
          </span>
        </div>
      </div>
      
      {/* 개인 승률 테이블 */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm overflow-hidden">
        <div className="px-4 py-3 bg-slate-100 dark:bg-slate-700 border-b border-slate-200 dark:border-slate-600">
          <h3 className="font-bold text-slate-800 dark:text-slate-100">개인 승률</h3>
        </div>
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-600">
              <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 dark:text-slate-400">순위</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 dark:text-slate-400">이름</th>
              <th className="px-4 py-2 text-right text-xs font-semibold text-slate-600 dark:text-slate-400">승률</th>
              <th className="px-4 py-2 text-right text-xs font-semibold text-slate-600 dark:text-slate-400">승/패(게임수)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {playerWinrates.map((stat) => {
              const isFirstPlace = stat.rank === 1;
              
              return (
                <tr 
                  key={stat.player} 
                  className={`${
                    isFirstPlace 
                      ? 'bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 dark:from-cyan-600 dark:via-purple-700 dark:to-pink-700 animate-gradient' 
                      : 'hover:bg-slate-50 dark:hover:bg-slate-700/30'
                  } transition-all duration-300`}
                >
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center justify-center w-7 h-7 rounded-sm font-bold text-sm ${
                      isFirstPlace
                        ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-300'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}>
                      {stat.rank}
                    </span>
                  </td>
                  <td className={`px-4 py-3 font-semibold ${
                    isFirstPlace 
                      ? 'text-white dark:text-white' 
                      : 'text-slate-800 dark:text-slate-100'
                  }`}>
                    {stat.player}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={`text-lg font-bold ${
                      isFirstPlace 
                        ? 'text-white dark:text-white' 
                        : 'text-slate-800 dark:text-slate-100'
                    }`}>
                      {stat.winrate.toFixed(1)}%
                    </span>
                  </td>
                  <td className={`px-4 py-3 text-right text-sm ${
                    isFirstPlace 
                      ? 'text-white/90 dark:text-white/90' 
                      : 'text-slate-600 dark:text-slate-400'
                  }`}>
                    <span className={`font-semibold ${
                      isFirstPlace 
                        ? 'text-white dark:text-white' 
                        : 'text-emerald-600 dark:text-emerald-400'
                    }`}>{stat.wins}</span>
                    <span className="mx-1">/</span>
                    <span className={`font-semibold ${
                      isFirstPlace 
                        ? 'text-white dark:text-white' 
                        : 'text-rose-600 dark:text-rose-400'
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
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm overflow-hidden">
        <div className="px-4 py-3 bg-slate-100 dark:bg-slate-700 border-b border-slate-200 dark:border-slate-600">
          <h3 className="font-bold text-slate-800 dark:text-slate-100">팀 승률</h3>
        </div>
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-600">
              <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 dark:text-slate-400">순위</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 dark:text-slate-400">팀</th>
              <th className="px-4 py-2 text-right text-xs font-semibold text-slate-600 dark:text-slate-400">승률</th>
              <th className="px-4 py-2 text-right text-xs font-semibold text-slate-600 dark:text-slate-400">승/패(게임수)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {teamWinrates.map((stat) => {
              const isFirstPlace = stat.rank === 1;
              
              return (
                <tr 
                  key={stat.team} 
                  className={`${
                    isFirstPlace 
                      ? 'bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 dark:from-cyan-600 dark:via-purple-700 dark:to-pink-700 animate-gradient' 
                      : 'hover:bg-slate-50 dark:hover:bg-slate-700/30'
                  } transition-all duration-300`}
                >
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center justify-center w-7 h-7 rounded-sm font-bold text-sm ${
                      isFirstPlace
                        ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-300'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}>
                      {stat.rank}
                    </span>
                  </td>
                  <td className={`px-4 py-3 font-semibold ${
                    isFirstPlace 
                      ? 'text-white dark:text-white' 
                      : 'text-slate-800 dark:text-slate-100'
                  }`}>
                    {stat.team}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={`text-lg font-bold ${
                      isFirstPlace 
                        ? 'text-white dark:text-white' 
                        : 'text-slate-800 dark:text-slate-100'
                    }`}>
                      {stat.winrate.toFixed(1)}%
                    </span>
                  </td>
                  <td className={`px-4 py-3 text-right text-sm ${
                    isFirstPlace 
                      ? 'text-white/90 dark:text-white/90' 
                      : 'text-slate-600 dark:text-slate-400'
                  }`}>
                    <span className={`font-semibold ${
                      isFirstPlace 
                        ? 'text-white dark:text-white' 
                        : 'text-emerald-600 dark:text-emerald-400'
                    }`}>{stat.wins}</span>
                    <span className="mx-1">/</span>
                    <span className={`font-semibold ${
                      isFirstPlace 
                        ? 'text-white dark:text-white' 
                        : 'text-rose-600 dark:text-rose-400'
                    }`}>{stat.total - stat.wins}</span>
                    <span className="ml-1 text-xs">({stat.total})</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StatsList; 