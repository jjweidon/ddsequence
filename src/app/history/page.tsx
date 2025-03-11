'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import GameHistoryList from '@/components/GameHistoryList';
import { IGame } from '@/models/Game';

export default function HistoryPage() {
  const [games, setGames] = useState<IGame[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

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

  // 컴포넌트 마운트 시 데이터 가져오기
  useEffect(() => {
    fetchGames();
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center p-6 max-w-4xl mx-auto">
      <div className="w-full">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">역대 기록</h1>
          <Link 
            href="/" 
            className="text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            &lt; 홈으로 돌아가기
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
            <p className="mt-2 text-gray-500">기록 불러오는 중...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">
            <p>{error}</p>
            <button 
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
              onClick={fetchGames}
            >
              다시 시도
            </button>
          </div>
        ) : (
          <GameHistoryList games={games} />
        )}
      </div>
    </main>
  );
} 