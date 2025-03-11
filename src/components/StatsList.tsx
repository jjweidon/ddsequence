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
}

const StatsList: React.FC<StatsListProps> = ({
  totalGames,
  playerWinrates,
  teamWinrates,
  playerWins
}) => {
  return (
    <div className="flex flex-col w-full gap-6 mt-4">
      <div className="text-lg font-semibold text-center">
        전체 게임 수: {totalGames}
      </div>
      
      {/* 개인 승률 */}
      <div className="flex flex-col gap-2">
        <h3 className="text-lg font-semibold">개인 승률:</h3>
        <div className="flex flex-col divide-y divide-gray-200">
          {playerWinrates.map((stat) => (
            <div key={stat.player} className="py-2 flex justify-between">
              <span>{stat.rank}위 {stat.player}: {stat.winrate.toFixed(2)}%</span>
              <span className="text-gray-600">(승리: {stat.wins}, 경기 수: {stat.total})</span>
            </div>
          ))}
        </div>
      </div>
      
      {/* 팀 승률 */}
      <div className="flex flex-col gap-2">
        <h3 className="text-lg font-semibold">팀 승률:</h3>
        <div className="flex flex-col divide-y divide-gray-200">
          {teamWinrates.map((stat) => (
            <div key={stat.team} className="py-2 flex justify-between">
              <span>{stat.rank}위 팀 {stat.team}: {stat.winrate.toFixed(2)}%</span>
              <span className="text-gray-600">(승리: {stat.wins}, 경기 수: {stat.total})</span>
            </div>
          ))}
        </div>
      </div>
      
      {/* 개인 승리 횟수 */}
      <div className="flex flex-col gap-2">
        <h3 className="text-lg font-semibold">개인 승리 횟수 순위:</h3>
        <div className="flex flex-col divide-y divide-gray-200">
          {playerWins.map((stat) => (
            <div key={stat.player} className="py-2">
              <span>{stat.rank}위 {stat.player}: 승리 {stat.wins}회</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StatsList; 