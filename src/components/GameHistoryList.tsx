import React, { useState } from 'react';
import { IGame } from '@/models/Game';

export type SortField = 'index' | 'createdAt';
export type SortDirection = 'asc' | 'desc';

interface GameHistoryListProps {
  games: IGame[];
  isEditMode?: boolean;
  selectedGames?: string[];
  setSelectedGames?: React.Dispatch<React.SetStateAction<string[]>>;
  sortField?: SortField;
  sortDirection?: SortDirection;
  onSortChange?: (field: SortField, direction: SortDirection) => void;
}

const GameHistoryList: React.FC<GameHistoryListProps> = ({ 
  games,
  isEditMode = false,
  selectedGames = [],
  setSelectedGames = () => {},
  sortField: propsSortField = 'createdAt',
  sortDirection: propsSortDirection = 'desc',
  onSortChange = () => {}
}) => {
  const [localSortField, setLocalSortField] = useState<SortField>(propsSortField);
  const [localSortDirection, setLocalSortDirection] = useState<SortDirection>(propsSortDirection);

  // props가 변경될 때 local 상태 업데이트
  React.useEffect(() => {
    setLocalSortField(propsSortField);
    setLocalSortDirection(propsSortDirection);
  }, [propsSortField, propsSortDirection]);

  // 정렬 토글 함수
  const toggleSort = (field: SortField) => {
    let newDirection: SortDirection = 'desc';
    
    if (localSortField === field) {
      // 같은 필드를 다시 클릭하면 정렬 방향 토글
      newDirection = localSortDirection === 'asc' ? 'desc' : 'asc';
    }
    
    // 로컬 상태 업데이트
    setLocalSortField(field);
    setLocalSortDirection(newDirection);
    
    // 부모 컴포넌트에 변경 알림
    onSortChange(field, newDirection);
  };

  // 체크박스 토글 함수
  const toggleGameSelection = (gameId: string) => {
    if (selectedGames.includes(gameId)) {
      // 이미 선택된 경우 선택 해제
      setSelectedGames(selectedGames.filter(id => id !== gameId));
    } else {
      // 선택되지 않은 경우 선택 추가
      setSelectedGames([...selectedGames, gameId]);
    }
  };

  // 모든 게임 선택/해제 토글
  const toggleSelectAll = () => {
    if (selectedGames.length === games.length) {
      // 모두 선택된 상태면 모두 해제
      setSelectedGames([]);
    } else {
      // 일부만 선택되었거나 아무것도 선택되지 않았으면 모두 선택
      setSelectedGames(games.map(game => game._id || '').filter(id => id));
    }
  };

  // 게임 데이터 정렬
  const sortedGames = [...games].sort((a, b) => {
    if (localSortField === 'index') {
      // 인덱스 기준 정렬은 실제로는 createdAt 기준으로 정렬합니다
      const aTime = new Date(a.createdAt).getTime();
      const bTime = new Date(b.createdAt).getTime();
      return localSortDirection === 'asc' ? aTime - bTime : bTime - aTime;
    } else {
      // 날짜 기준 정렬
      const aTime = new Date(a.createdAt).getTime();
      const bTime = new Date(b.createdAt).getTime();
      return localSortDirection === 'asc' ? aTime - bTime : bTime - aTime;
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

  // 모바일 뷰에서 날짜 간소화 함수
  const formatMobileDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  return (
    <div className="w-full overflow-hidden rounded-lg">
      {/* 데스크탑 테이블 뷰 - 모바일에서는 숨김 */}
      <div className="hidden sm:block">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {isEditMode && (
                <th className="px-2 py-2 w-10">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    checked={games.length > 0 && selectedGames.length === games.length}
                    onChange={toggleSelectAll}
                  />
                </th>
              )}
              <th 
                className="px-3 py-2 text-left text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => toggleSort('index')}
              >
                No.
                {localSortField === 'index' && (
                  <span className="ml-1">
                    {localSortDirection === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </th>
              <th 
                className="px-3 py-2 text-left text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => toggleSort('createdAt')}
              >
                날짜/시간
                {localSortField === 'createdAt' && (
                  <span className="ml-1">
                    {localSortDirection === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </th>
              <th className="px-3 py-2 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                승리팀
              </th>
              <th className="px-3 py-2 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                패배팀
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedGames.map((game, index) => (
              <tr key={game._id || index} className="hover:bg-gray-50">
                {isEditMode && (
                  <td className="px-2 py-2 whitespace-nowrap w-10">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      checked={selectedGames.includes(game._id || '')}
                      onChange={() => game._id && toggleGameSelection(game._id)}
                    />
                  </td>
                )}
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                  {localSortDirection === 'asc' ? index + 1 : games.length - index}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(game.createdAt)}
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  <div className="flex items-center space-x-1">
                    {game.winningTeam.map(player => (
                      <span key={player} className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-green-100 text-green-800 font-medium text-sm">
                        {player}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
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
      </div>
      
      {/* 모바일 카드 뷰 - 데스크탑에서는 숨김 */}
      <div className="sm:hidden">
        <div className="grid grid-cols-1 gap-3">
          {sortedGames.map((game, index) => (
            <div 
              key={game._id || index} 
              className="bg-white rounded-lg shadow-sm border border-gray-100 p-3"
            >
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center">
                  {isEditMode && (
                    <div className="mr-2">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        checked={selectedGames.includes(game._id || '')}
                        onChange={() => game._id && toggleGameSelection(game._id)}
                      />
                    </div>
                  )}
                  <span className="text-xs font-medium px-2 py-1 text-gray-500">
                    {localSortDirection === 'asc' ? index + 1 : games.length - index}
                  </span>
                </div>
                <span className="text-xs text-gray-500">
                  {formatMobileDate(game.createdAt)}
                </span>
              </div>
              
              <div className="flex items-center justify-between mt-2">
                <div className="w-1/2">
                  <p className="text-xs text-gray-500 mb-1">승리팀</p>
                  <div className="flex flex-wrap gap-1">
                    {game.winningTeam.map(player => (
                      <span key={player} className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-green-100 text-green-800 font-medium text-xs">
                        {player}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="w-1/2">
                  <p className="text-xs text-gray-500 mb-1">패배팀</p>
                  <div className="flex flex-wrap gap-1">
                    {game.losingTeam.map(player => (
                      <span key={player} className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-red-100 text-red-800 font-medium text-xs">
                        {player}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {games.length === 0 && (
        <div className="text-center py-6 text-gray-500 text-sm">
          기록된 게임이 없습니다.
        </div>
      )}
    </div>
  );
};

export default GameHistoryList; 