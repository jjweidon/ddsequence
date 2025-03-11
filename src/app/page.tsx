'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import PlayerSelect from '@/components/PlayerSelect';
import StatsList from '@/components/StatsList';

export default function Home() {
  // 선택된 플레이어
  const [winningTeam, setWinningTeam] = useState<string[]>([]);
  const [losingTeam, setLosingTeam] = useState<string[]>([]);
  
  // 에러 및 로딩 상태
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [statsLoading, setStatsLoading] = useState<boolean>(false);
  
  // 통계 데이터
  const [stats, setStats] = useState<{
    totalGames: number;
    playerWinrates: any[];
    teamWinrates: any[];
    playerWins: any[];
  }>({
    totalGames: 0,
    playerWinrates: [],
    teamWinrates: [],
    playerWins: []
  });

  // 승리팀 플레이어 선택
  const handleSelectWinningPlayer = (player: string) => {
    if (winningTeam.includes(player)) {
      // 이미 선택된 플레이어라면 선택 해제
      setWinningTeam(winningTeam.filter(p => p !== player));
    } else if (winningTeam.length < 2 && !losingTeam.includes(player)) {
      // 아직 선택되지 않았고, 패배팀에도 없으며, 승리팀이 2명 미만일 때 선택
      setWinningTeam([...winningTeam, player]);
    }
  };

  // 패배팀 플레이어 선택
  const handleSelectLosingPlayer = (player: string) => {
    if (losingTeam.includes(player)) {
      // 이미 선택된 플레이어라면 선택 해제
      setLosingTeam(losingTeam.filter(p => p !== player));
    } else if (losingTeam.length < 2 && !winningTeam.includes(player)) {
      // 아직 선택되지 않았고, 승리팀에도 없으며, 패배팀이 2명 미만일 때 선택
      setLosingTeam([...losingTeam, player]);
    }
  };

  // 플레이어 선택 초기화
  const handleReset = () => {
    setWinningTeam([]);
    setLosingTeam([]);
    setError(null);
    setSuccess(null);
  };

  // 게임 데이터 제출
  const handleSubmit = async () => {
    // 유효성 검사
    if (winningTeam.length !== 2 || losingTeam.length !== 2) {
      setError('승리팀과 패배팀 모두 2명의 플레이어를 선택해야 합니다.');
      return;
    }

    // 중복 플레이어 검사
    const allPlayers = [...winningTeam, ...losingTeam];
    const uniquePlayers = new Set(allPlayers);
    if (uniquePlayers.size !== allPlayers.length) {
      setError('동일한 플레이어는 승패 팀에 중복되어 선택할 수 없습니다.');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/games', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          winningTeam,
          losingTeam,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || '게임 데이터 저장 중 오류가 발생했습니다.');
      }

      setSuccess('게임 데이터가 성공적으로 저장되었습니다.');
      handleReset();
      fetchStats(); // 통계 다시 가져오기
    } catch (error: any) {
      setError(error.message || '게임 데이터 저장 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 통계 데이터 가져오기
  const fetchStats = async () => {
    setStatsLoading(true);
    
    try {
      const response = await fetch('/api/stats');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || '통계 데이터를 가져오는 중 오류가 발생했습니다.');
      }
      
      setStats(data.data);
    } catch (error: any) {
      console.error('통계 데이터 불러오기 오류:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  // 컴포넌트 마운트 시 통계 데이터 가져오기
  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center p-6 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-8 text-center border-b pb-4 w-full">
        뚱팸 시퀀스 승률 계산기
      </h1>
      
      <div className="flex flex-col gap-8 w-full">
        <div className="grid grid-cols-1 gap-8 w-full">
          <h2 className="text-xl font-semibold">기록 추가</h2>
          
          <div className="flex justify-between items-center gap-2">
            <div className="transition-all duration-300 ease-in-out transform hover:scale-105">
              <PlayerSelect 
                label="승" 
                selectedPlayers={winningTeam} 
                oppositeTeamPlayers={losingTeam}
                onSelectPlayer={handleSelectWinningPlayer} 
              />
            </div>
            
            <div className="transition-all duration-300 ease-in-out transform hover:scale-105">
              <PlayerSelect 
                label="패" 
                selectedPlayers={losingTeam} 
                oppositeTeamPlayers={winningTeam}
                onSelectPlayer={handleSelectLosingPlayer} 
              />
            </div>
          </div>
          
          {/* 버튼 영역 */}
          <div className="grid grid-cols-2 gap-4 mt-4">
            <button
              className="bg-white border border-gray-300 text-gray-700 font-bold px-4 py-2 rounded-md 
                transition-all duration-300 ease-in-out transform hover:bg-gray-100 hover:scale-105 
                active:scale-95"
              onClick={handleReset}
            >
              초기화
            </button>
            <button
              className="bg-indigo-600 text-white font-bold px-4 py-2 rounded-md 
                transition-all duration-300 ease-in-out transform hover:bg-indigo-700 
                hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 
                disabled:hover:bg-indigo-600"
              onClick={handleSubmit}
              disabled={loading || winningTeam.length !== 2 || losingTeam.length !== 2}
            >
              {loading ? '로딩...' : '등록'}
            </button>
          </div>
          
          {/* 에러/성공 메시지 */}
          {error && (
            <div className="text-red-500 mt-2 p-2 border border-red-200 bg-red-50 rounded animate-fadeIn">
              {error}
            </div>
          )}
          {success && (
            <div className="text-green-500 mt-2 p-2 border border-green-200 bg-green-50 rounded animate-fadeIn">
              {success}
            </div>
          )}
        </div>
        
        {/* 통계 */}
        <div className="mt-8 w-full">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">통계</h2>
            <Link href="/history" className="text-gray-500 hover:text-gray-700 transition-colors">
              역대 기록 &gt;
            </Link>
          </div>
          {statsLoading ? (
            <div className="text-center">통계 로딩 중...</div>
          ) : (
            <StatsList 
              totalGames={stats.totalGames}
              playerWinrates={stats.playerWinrates}
              teamWinrates={stats.teamWinrates}
              playerWins={stats.playerWins}
            />
          )}
        </div>
      </div>
    </main>
  );
}
