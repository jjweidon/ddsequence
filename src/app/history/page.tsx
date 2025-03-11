'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import GameHistoryList from '@/components/GameHistoryList';
import { IGame } from '@/models/Game';

export default function HistoryPage() {
  const [games, setGames] = useState<IGame[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [selectedGames, setSelectedGames] = useState<string[]>([]);
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false);

  // 게임 데이터 가져오기
  const fetchGames = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/games');
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

  // 선택된 게임 삭제 함수
  const handleDeleteSelected = async () => {
    if (selectedGames.length === 0) return;
    
    if (!confirm(`선택한 ${selectedGames.length}개의 게임 기록을 삭제하시겠습니까?`)) {
      return;
    }
    
    setDeleteLoading(true);
    
    try {
      // 선택된 각 게임 ID에 대해 삭제 API 호출
      const deletePromises = selectedGames.map(id => 
        fetch(`/api/games/${id}`, {
          method: 'DELETE',
        })
      );
      
      await Promise.all(deletePromises);
      
      // 삭제 후 목록 새로고침
      fetchGames();
      setSelectedGames([]);
      
    } catch (error: any) {
      console.error('게임 기록 삭제 오류:', error);
      alert('게임 기록 삭제 중 오류가 발생했습니다.');
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

  // 컴포넌트 마운트 시 데이터 가져오기
  useEffect(() => {
    fetchGames();
  }, []);

  return (
    <>
      <main className="flex min-h-screen flex-col items-center p-3 sm:p-6 max-w-4xl mx-auto">
        <div className="w-full">
          {/* 모바일과 데스크탑 화면에 맞는 헤더 레이아웃 */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 gap-3 sm:gap-0">
            {/* 제목 및 편집 버튼 */}
            <div className="flex items-center justify-between sm:justify-start sm:gap-4">
              <h1 className="text-xl sm:text-2xl font-bold">게임 기록</h1>
              <button 
                onClick={toggleEditMode}
                className={`px-2 py-1 sm:px-3 sm:py-1.5 text-xs sm:text-sm rounded-md transition-colors ${
                  isEditMode 
                    ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' 
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                {isEditMode ? '완료' : '편집'}
              </button>
            </div>
            
            {/* 삭제 버튼 및 홈으로 돌아가기 링크 */}
            <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3">
              {isEditMode && (
                <button
                  onClick={handleDeleteSelected}
                  disabled={selectedGames.length === 0 || deleteLoading}
                  className={`px-2 py-1 sm:px-3 sm:py-1.5 text-xs sm:text-sm rounded-md text-white transition-colors ${
                    selectedGames.length === 0 || deleteLoading
                      ? 'bg-red-300 cursor-not-allowed'
                      : 'bg-red-500 hover:bg-red-600'
                  }`}
                >
                  {deleteLoading 
                    ? '삭제 중...' 
                    : selectedGames.length > 0 
                      ? `삭제 (${selectedGames.length})` 
                      : '삭제'
                  }
                </button>
              )}
              
              <Link 
                href="/" 
                className="text-xs sm:text-sm text-indigo-600 hover:text-indigo-800 transition-colors whitespace-nowrap"
              >
                &lt; 홈으로
              </Link>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-6 sm:py-8">
              <div className="inline-block animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-t-2 border-b-2 border-indigo-600"></div>
              <p className="mt-2 text-sm sm:text-base text-gray-500">기록 불러오는 중...</p>
            </div>
          ) : error ? (
            <div className="text-center py-6 sm:py-8 text-red-500 text-sm sm:text-base">
              <p>{error}</p>
              <button 
                className="mt-3 sm:mt-4 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
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
            />
          )}
        </div>
      </main>
    </>
  );
} 