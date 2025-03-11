import React, { useState } from 'react';
import { IGame } from '@/models/Game';

type SortField = 'index' | 'createdAt';
type SortDirection = 'asc' | 'desc';

interface GameHistoryListProps {
  games: IGame[];
}

const GameHistoryList: React.FC<GameHistoryListProps> = ({ games }) => {
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // 정렬 토글 함수
  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      // 같은 필드를 다시 클릭하면 정렬 방향 토글
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // 다른 필드 클릭 시 해당 필드로 변경, 기본 내림차순
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // 게임 데이터 정렬
  const sortedGames = [...games].sort((a, b) => {
    if (sortField === 'index') {
      // 인덱스 기준 정렬은 실제로는 createdAt 기준으로 정렬합니다
      const aTime = new Date(a.createdAt).getTime();
      const bTime = new Date(b.createdAt).getTime();
      return sortDirection === 'asc' ? aTime - bTime : bTime - aTime;
    } else {
      // 날짜 기준 정렬
      const aTime = new Date(a.createdAt).getTime();
      const bTime = new Date(b.createdAt).getTime();
      return sortDirection === 'asc' ? aTime - bTime : bTime - aTime;
    }
  });

  // 날짜 포맷팅 함수
  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="w-full overflow-x-auto rounded-lg">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th 
              className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => toggleSort('index')}
            >
              No.
              {sortField === 'index' && (
                <span className="ml-1">
                  {sortDirection === 'asc' ? '↑' : '↓'}
                </span>
              )}
            </th>
            <th 
              className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => toggleSort('createdAt')}
            >
              날짜/시간
              {sortField === 'createdAt' && (
                <span className="ml-1">
                  {sortDirection === 'asc' ? '↑' : '↓'}
                </span>
              )}
            </th>
            <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
              승리팀
            </th>
            <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
              패배팀
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {sortedGames.map((game, index) => (
            <tr key={game._id || index} className="hover:bg-gray-50">
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                {sortDirection === 'asc' ? index + 1 : games.length - index}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                {formatDate(game.createdAt)}
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <div className="flex items-center space-x-1">
                  {game.winningTeam.map(player => (
                    <span key={player} className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-green-100 text-green-800 font-medium text-sm">
                      {player}
                    </span>
                  ))}
                </div>
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <div className="flex items-center space-x-1">
                  {game.losingTeam.map(player => (
                    <span key={player} className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-red-100 text-red-800 font-medium text-sm">
                      {player}
                    </span>
                  ))}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {games.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          기록된 게임이 없습니다.
        </div>
      )}
    </div>
  );
};

export default GameHistoryList; 