import React, { useState } from 'react';
import { IGame } from '@/models/Game';
import { getTeamDisplayOrder } from '@/utils/teamOrder';

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
    const game = games.find(g => g._id === gameId);
    if (!game) return;
    
    // 7일 지난 기록은 선택할 수 없음
    if (isOlderThan7Days(game.createdAt)) {
      return;
    }
    
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
      // 일부만 선택되었거나 아무것도 선택되지 않았으면 모두 선택 (7일 지난 기록 제외)
      const selectableGames = games
        .filter(game => !isOlderThan7Days(game.createdAt))
        .map(game => game._id || '')
        .filter(id => id);
      setSelectedGames(selectableGames);
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

  // 7일 지났는지 확인하는 함수
  const isOlderThan7Days = (dateString: string | Date) => {
    const gameDate = new Date(dateString);
    const now = new Date();
    const daysDiff = Math.floor((now.getTime() - gameDate.getTime()) / (1000 * 60 * 60 * 24));
    return daysDiff >= 7;
  };

  // 날짜 포맷팅 함수 (yyyy-mm-dd HH:mm 형식)
  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  };

  // 모바일 뷰에서 날짜 포맷팅 함수 (yyyy-mm-dd HH:mm 형식)
  const formatMobileDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  };

  return (
    <div className="w-full">
      {/* 데스크탑 테이블 뷰 - 모바일에서는 숨김 */}
      <div className="hidden sm:block bg-white dark:bg-slate-800 rounded-sm shadow-md border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
            <thead>
              <tr className="bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-900 dark:to-gray-900">
                {isEditMode && (
                  <th className="px-4 py-4 w-12">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-blue-600 
                               focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 cursor-pointer"
                      checked={games.length > 0 && selectedGames.length === games.length}
                      onChange={toggleSelectAll}
                    />
                  </th>
                )}
                <th 
                  className="px-4 py-4 text-left text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider 
                           cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors duration-200 select-none"
                  onClick={() => toggleSort('index')}
                >
                  <div className="flex items-center gap-2">
                    No.
                    {localSortField === 'index' && (
                      <span className="text-blue-600 dark:text-blue-400 font-bold">
                        {localSortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th 
                  className="px-4 py-4 text-left text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider 
                           cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors duration-200 select-none"
                  onClick={() => toggleSort('createdAt')}
                >
                  <div className="flex items-center gap-2">
                    날짜/시간
                    {localSortField === 'createdAt' && (
                      <span className="text-blue-600 dark:text-blue-400 font-bold">
                        {localSortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th className="px-4 py-4 text-left text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  승리팀
                </th>
                <th className="px-4 py-4 text-left text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  패배팀
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {sortedGames.map((game, index) => (
                <tr 
                  key={game._id || index} 
                  className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors duration-150 animate-fadeIn"
                  style={{ animationDelay: `${index * 20}ms` }}
                >
                  {isEditMode && (
                    <td className="px-4 py-4 whitespace-nowrap w-12">
                      <input
                        type="checkbox"
                        className={`h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-blue-600 
                                 focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 ${
                          isOlderThan7Days(game.createdAt) 
                            ? 'cursor-not-allowed opacity-50' 
                            : 'cursor-pointer'
                        }`}
                        checked={selectedGames.includes(game._id || '')}
                        onChange={() => game._id && toggleGameSelection(game._id)}
                        disabled={isOlderThan7Days(game.createdAt)}
                        title={isOlderThan7Days(game.createdAt) ? '7일이 지난 기록은 삭제할 수 없습니다' : ''}
                      />
                    </td>
                  )}
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-sm bg-slate-100 dark:bg-slate-700 
                                   text-slate-700 dark:text-slate-300 text-sm font-bold">
                      {localSortDirection === 'asc' ? index + 1 : games.length - index}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400 font-medium">
                    {formatDate(game.createdAt)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {getTeamDisplayOrder(game.winningTeam).map(player => (
                        <span key={player} className="inline-flex items-center justify-center h-9 w-9 rounded-xl 
                                                    bg-gradient-to-br from-emerald-100 to-green-100 dark:from-emerald-900/40 dark:to-green-900/40 
                                                    text-emerald-800 dark:text-emerald-300 font-bold text-sm 
                                                    shadow-sm border border-emerald-200 dark:border-emerald-800">
                          {player}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {getTeamDisplayOrder(game.losingTeam).map(player => (
                        <span key={player} className="inline-flex items-center justify-center h-9 w-9 rounded-xl 
                                                    bg-gradient-to-br from-rose-100 to-red-100 dark:from-rose-900/40 dark:to-red-900/40 
                                                    text-rose-800 dark:text-rose-300 font-bold text-sm 
                                                    shadow-sm border border-rose-200 dark:border-rose-800">
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
      </div>
      
      {/* 모바일 카드 뷰 - 데스크탑에서는 숨김 */}
      <div className="sm:hidden">
        <div className="grid grid-cols-1 gap-3">
          {sortedGames.map((game, index) => (
            <div 
              key={game._id || index} 
              className="bg-white dark:bg-slate-800 rounded-sm shadow-md border border-slate-200 dark:border-slate-700 
                       p-4 transition-all duration-200 hover:shadow-lg animate-fadeIn"
              style={{ animationDelay: `${index * 30}ms` }}
            >
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  {isEditMode && (
                    <input
                      type="checkbox"
                      className={`h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-blue-600 
                               focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 ${
                        isOlderThan7Days(game.createdAt) 
                          ? 'cursor-not-allowed opacity-50' 
                          : 'cursor-pointer'
                      }`}
                      checked={selectedGames.includes(game._id || '')}
                      onChange={() => game._id && toggleGameSelection(game._id)}
                      disabled={isOlderThan7Days(game.createdAt)}
                      title={isOlderThan7Days(game.createdAt) ? '7일이 지난 기록은 삭제할 수 없습니다' : ''}
                    />
                  )}
                  <span className="inline-flex items-center justify-center min-w-[32px] h-7 px-2 rounded-sm 
                                 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 
                                 text-xs font-bold">
                    #{localSortDirection === 'asc' ? index + 1 : games.length - index}
                  </span>
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {formatMobileDate(game.createdAt)}
                </span>
              </div>
              
              <div className="flex items-stretch gap-3">
                  <div className="flex-1 bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 
                                rounded-sm p-3 border border-emerald-200 dark:border-emerald-800">
                    <div className="flex items-center gap-1.5 mb-2">
                      <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">승리</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {getTeamDisplayOrder(game.winningTeam).map(player => (
                        <span key={player} className="inline-flex items-center justify-center h-8 w-8 rounded-xl 
                                                    bg-gradient-to-br from-emerald-100 to-green-100 dark:from-emerald-800 dark:to-green-800 
                                                    text-emerald-800 dark:text-emerald-200 font-bold text-sm 
                                                    shadow-sm border border-emerald-300 dark:border-emerald-700">
                          {player}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex-1 bg-gradient-to-br from-rose-50 to-red-50 dark:from-rose-900/20 dark:to-red-900/20 
                                rounded-sm p-3 border border-rose-200 dark:border-rose-800">
                    <div className="flex items-center gap-1.5 mb-2">
                      <span className="text-xs font-bold text-rose-700 dark:text-rose-400">패배</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {getTeamDisplayOrder(game.losingTeam).map(player => (
                        <span key={player} className="inline-flex items-center justify-center h-8 w-8 rounded-xl 
                                                    bg-gradient-to-br from-rose-100 to-red-100 dark:from-rose-800 dark:to-red-800 
                                                    text-rose-800 dark:text-rose-200 font-bold text-sm 
                                                    shadow-sm border border-rose-300 dark:border-rose-700">
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
        <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-sm shadow-md border border-slate-200 dark:border-slate-700">
          <div className="text-5xl mb-4 opacity-40">🎮</div>
          <p className="text-slate-500 dark:text-slate-400 font-medium">기록된 게임이 없습니다.</p>
        </div>
      )}
    </div>
  );
};

export default GameHistoryList; 