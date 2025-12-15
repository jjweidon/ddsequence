'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import GameHistoryList from '@/components/GameHistoryList';
import GameDashboardBanner from '@/components/GameDashboardBanner';
import { IGame } from '@/models/Game';
import { SortField, SortDirection } from '@/components/GameHistoryList';
import { getTeamName } from '@/utils/teamOrder';

export default function HistoryPage() {
  const [games, setGames] = useState<IGame[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [selectedGames, setSelectedGames] = useState<string[]>([]);
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // 현재 연도 가져오기 (한국 시간 기준)
  const getCurrentYear = () => {
    const now = new Date();
    const koreaTime = new Date(now.getTime() + (9 * 60 * 60 * 1000));
    return koreaTime.getFullYear();
  };

  // 게임 데이터 가져오기 (현재 연도만)
  const fetchGames = async () => {
    setLoading(true);
    try {
      const currentYear = getCurrentYear();
      const response = await fetch(`/api/games?year=${currentYear}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || '게임 데이터 로딩 중 오류가 발생했습니다.');
      }
      
      setGames(data.data);
    } catch (error: any) {
      console.error('게임 기록 불러오기 오류:', error);
      setError(error.message || '게임 기록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 30일 지났는지 확인하는 함수
  const isOlderThan30Days = (dateString: string | Date) => {
    const gameDate = new Date(dateString);
    const now = new Date();
    const daysDiff = Math.floor((now.getTime() - gameDate.getTime()) / (1000 * 60 * 60 * 24));
    return daysDiff >= 30;
  };

  // 선택된 게임 삭제 함수
  const handleDeleteSelected = async () => {
    if (selectedGames.length === 0) return;
    
    // 30일 지난 게임이 있는지 확인
    const oldGames = games.filter(game => 
      game._id && selectedGames.includes(game._id) && isOlderThan30Days(game.createdAt)
    );
    
    if (oldGames.length > 0) {
      alert('30일이 지난 게임 기록은 삭제할 수 없습니다.');
      // 30일 지나지 않은 게임만 선택 상태로 유지
      const validGames = games
        .filter(game => game._id && selectedGames.includes(game._id) && !isOlderThan30Days(game.createdAt))
        .map(game => game._id || '')
        .filter(id => id);
      setSelectedGames(validGames);
      return;
    }
    
    if (!confirm(`선택한 ${selectedGames.length}개의 게임 기록을 삭제하시겠습니까?`)) {
      return;
    }
    
    setDeleteLoading(true);
    
    try {
      // 선택된 각 게임 ID에 대해 삭제 API 호출
      const deletePromises = selectedGames.map(async (id) => {
        const response = await fetch(`/api/games/${id}`, {
          method: 'DELETE',
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || '삭제에 실패했습니다.');
        }
        return data;
      });
      
      await Promise.all(deletePromises);
      
      // 삭제 후 목록 새로고침
      fetchGames();
      setSelectedGames([]);
      
    } catch (error: any) {
      console.error('게임 기록 삭제 오류:', error);
      alert(error.message || '게임 기록 삭제 중 오류가 발생했습니다.');
    } finally {
      setDeleteLoading(false);
    }
  };

  
  // 편집 모드 토글
  const toggleEditMode = () => {
    setIsEditMode(!isEditMode);
    if (isEditMode) {
      setSelectedGames([]);
    }
  };

  // 정렬 상태 변경 처리
  const handleSortChange = (field: SortField, direction: SortDirection) => {
    setSortField(field);
    setSortDirection(direction);
  };

  // 날짜 포맷팅 함수 (YYYY년 MM월 DD일)
  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
  };

  // 현재 정렬 설정에 따라 게임 정렬
  const getSortedGames = () => {
    return [...games].sort((a, b) => {
      const aTime = new Date(a.createdAt).getTime();
      const bTime = new Date(b.createdAt).getTime();
      
      if (sortField === 'index' || sortField === 'createdAt') {
        return sortDirection === 'asc' ? aTime - bTime : bTime - aTime;
      }
      
      return 0;
    });
  };

  // 게임 데이터를 날짜별로 그룹화
  const groupGamesByDate = () => {
    const groupedGames: { [key: string]: IGame[] } = {};
    
    // 현재 정렬 설정에 따라 정렬된 게임
    const sortedGames = getSortedGames();
    
    // 날짜별로 그룹화
    sortedGames.forEach(game => {
      const dateKey = formatDate(game.createdAt);
      if (!groupedGames[dateKey]) {
        groupedGames[dateKey] = [];
      }
      groupedGames[dateKey].push(game);
    });
    
    return groupedGames;
  };

  // 게임 기록을 텍스트로 변환
  const getGamesAsText = () => {
    let text = `https://ddsequence.vercel.app\n\n`;
    
    const groupedGames = groupGamesByDate();
    
    // 정렬된 전체 게임 목록
    const sortedGames = getSortedGames();
    let gameCounter = 1;
    
    // 날짜별로 순회
    Object.entries(groupedGames).forEach(([date, gamesInDay]) => {
      text += `[${date}]\n`;
      
      // 해당 날짜의 게임들을 순회
      gamesInDay.forEach(game => {
        const winTeam = getTeamName(game.winningTeam);
        const loseTeam = getTeamName(game.losingTeam);
        
        // 정렬 방향에 따라 게임 번호 결정
        const gameNumber = sortDirection === 'asc' 
          ? gameCounter++ 
          : sortedGames.length - gameCounter++ + 1;
        
        text += `${(gameNumber + ".").padEnd(4)} ${winTeam} 승 : ${loseTeam} 패\n`;
      });
      
      text += '\n';
    });
    
    return text;
  };

  // 게임 기록 복사 함수
  const copyGamesToClipboard = async () => {
    try {
      const gamesText = getGamesAsText();
      await navigator.clipboard.writeText(gamesText);
      setIsCopied(true);
      
      // 2초 후 아이콘 원래대로 변경
      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    } catch (err) {
      console.error('클립보드 복사 실패:', err);
    }
  };

  // 컴포넌트 마운트 시 데이터 가져오기
  useEffect(() => {
    fetchGames();
  }, []);

  return (
    <>
      {/* 대시보드 배너 - 전체 너비 */}
      {!loading && !error && (
        <div className="w-full">
          <GameDashboardBanner games={games} />
        </div>
      )}
      
      <main className="min-h-screen bg-slate-50 dark:bg-slate-900 py-6 sm:py-8 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
        {/* 헤더 */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* 좌측: 제목과 복사 버튼 */}
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  게임 기록
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
                  {getCurrentYear()}년 기록 {games.length} 게임
                </p>
              </div>
              <button 
                onClick={copyGamesToClipboard}
                className="p-2.5 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 
                         hover:bg-slate-100 dark:hover:bg-slate-800 rounded-sm
                         transition-all duration-200
                         focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2"
                title="게임 기록 복사하기"
              >
                {isCopied ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                    <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                  </svg>
                )}
              </button>
            </div>
            
            {/* 우측: 액션 버튼들 */}
            <div className="flex items-center gap-3">
              <Link 
                href="/" 
                className="flex items-center gap-2 px-4 py-2.5 text-slate-700 dark:text-slate-300 font-semibold text-sm
                         hover:bg-slate-100 dark:hover:bg-slate-800 rounded-sm
                         transition-all duration-200
                         focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>홈으로</span>
              </Link>
              
              {isEditMode && (
                <button
                  onClick={handleDeleteSelected}
                  disabled={selectedGames.length === 0 || deleteLoading}
                  className={`flex items-center gap-2 px-4 py-2.5 font-bold text-sm
                           transition-all duration-200 shadow-sm hover:shadow-md
                           focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                    selectedGames.length === 0 || deleteLoading
                      ? 'bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white shadow-rose-500/30 hover:scale-[1.02] focus-visible:ring-rose-400'
                  }`}
                >
                  {deleteLoading ? (
                    <>
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      삭제 중...
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      삭제 {selectedGames.length > 0 && `(${selectedGames.length})`}
                    </>
                  )}
                </button>
              )}
              
              <button 
                onClick={toggleEditMode}
                className={`px-4 py-2.5 font-semibold text-sm rounded-sm transition-all duration-200
                         focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 ${
                  isEditMode 
                    ? 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {isEditMode ? '완료' : '편집'}
              </button>
            </div>
          </div>
        </div>

        {/* 컨텐츠 */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-800 rounded-sm 
                        shadow-md border border-slate-200 dark:border-slate-700">
            <svg className="animate-spin h-12 w-12 text-blue-600 dark:text-blue-400 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-slate-600 dark:text-slate-400 font-medium text-lg">기록 불러오는 중...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-800 rounded-sm 
                        shadow-md border border-slate-200 dark:border-slate-700">
            <div className="text-6xl mb-4 opacity-40">⚠️</div>
            <p className="text-rose-600 dark:text-rose-400 font-medium text-lg mb-4">{error}</p>
            <button 
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 
                       dark:from-blue-600 dark:to-blue-700 dark:hover:from-blue-700 dark:hover:to-blue-800
                       text-white font-bold shadow-lg shadow-blue-500/30
                       transition-all duration-200 transform hover:scale-[1.02]
                       focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2"
              onClick={fetchGames}
            >
              다시 시도
            </button>
          </div>
        ) : (
          <GameHistoryList 
            games={games} 
            isEditMode={isEditMode}
            selectedGames={selectedGames}
            setSelectedGames={setSelectedGames}
            sortField={sortField}
            sortDirection={sortDirection}
            onSortChange={handleSortChange}
          />
        )}
      </div>
    </main>
    </>
  );
} 