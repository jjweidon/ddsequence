'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import PlayerSelect from '@/components/PlayerSelect';
import StatsList from '@/components/StatsList';
import DateRangeSelector from '@/components/DateRangeSelector';

export default function Home() {
  // 선택된 플레이어
  const [winningTeam, setWinningTeam] = useState<string[]>([]);
  const [losingTeam, setLosingTeam] = useState<string[]>([]);
  
  // 에러 및 로딩 상태
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [statsLoading, setStatsLoading] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  
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

  // 기간별 통계 관련 상태
  const [dateRangeMode, setDateRangeMode] = useState<'all' | 'custom'>('all');
  const [dateRange, setDateRange] = useState<{ startDate: string; endDate: string } | null>(null);

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
  const fetchStats = async (startDate?: string, endDate?: string) => {
    setStatsLoading(true);
    
    try {
      let url = '/api/stats';
      const params = new URLSearchParams();
      
      if (startDate && endDate) {
        params.append('startDate', startDate);
        params.append('endDate', endDate);
        url += `?${params.toString()}`;
      }
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || '통계 데이터를 가져오는 중 오류가 발생했습니다.');
      }
      
      setStats(data.data);
      return data.data; // Promise를 반환하도록 수정
    } catch (error: any) {
      console.error('통계 데이터 불러오기 오류:', error);
      throw error; // 에러를 다시 던져서 Promise rejection 처리
    } finally {
      setStatsLoading(false);
    }
  };

  // 기간별 통계 모드 변경
  const handleDateRangeModeChange = (mode: 'all' | 'custom') => {
    setDateRangeMode(mode);
    if (mode === 'all') {
      setDateRange(null);
      // 전체 기간으로 돌아갈 때는 통계를 다시 가져오지 않음
      // 이미 초기 로드 시 전체 기간 통계가 로드되어 있음
    }
  };

  // 기간 변경 처리
  const handleDateRangeChange = (startDate: string, endDate: string) => {
    setDateRange({ startDate, endDate });
    
    // 백그라운드에서 통계를 가져오되, 로딩 상태는 변경하지 않음
    setTimeout(async () => {
      try {
        let url = '/api/stats';
        const params = new URLSearchParams();
        params.append('startDate', startDate);
        params.append('endDate', endDate);
        url += `?${params.toString()}`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || '통계 데이터를 가져오는 중 오류가 발생했습니다.');
        }
        
        setStats(data.data);
      } catch (error: any) {
        console.error('통계 데이터 불러오기 오류:', error);
      }
    }, 100);
  };

  // 통계 데이터를 텍스트로 변환
  const getStatsAsText = () => {
    let text = `https://ddsequence.vercel.app\n\n`;
    
    if (dateRangeMode === 'custom' && dateRange) {
      text += `기간: ${dateRange.startDate} ~ ${dateRange.endDate}\n`;
    }
    
    text += `게임 수: ${stats.totalGames}\n\n`;
    
    // 개인 승률
    text += '개인 승률:\n';
    stats.playerWinrates.forEach((player) => {
      text += `${player.rank}위 ${player.player}: ${player.winrate.toFixed(2)}% (승리: ${player.wins}, 경기 수: ${player.total})\n`;
    });
    
    // 팀 승률
    text += '\n팀 승률:\n';
    stats.teamWinrates.forEach((team, index) => {
      text += `${index + 1}위 팀 ${team.team}: ${team.winrate.toFixed(2)}% (승리: ${team.wins}, 경기 수: ${team.total})\n`;
    });
    
    // 개인 승리 횟수
    text += '\n개인 승리 횟수 순위:\n';
    stats.playerWins.forEach((player) => {
      text += `${player.rank}위 ${player.player}: 승리 ${player.wins}회\n`;
    });
    
    return text;
  };

  // 통계 복사 함수
  const copyStatsToClipboard = async () => {
    try {
      const statsText = getStatsAsText();
      await navigator.clipboard.writeText(statsText);
      setIsCopied(true);
      
      // 2초 후 아이콘 원래대로 변경
      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    } catch (err) {
      console.error('클립보드 복사 실패:', err);
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
          <div className="flex flex-col mb-4">
            <Link href="/history" className="self-end text-gray-500 hover:text-gray-700 transition-colors mb-2">
              역대 기록 &gt;
            </Link>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">통계</h2>
              <button 
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  copyStatsToClipboard();
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
                title="통계 복사하기"
              >
                {isCopied ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
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
            
            {/* 기간 선택 탭 */}
            <div className="relative flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1 mb-4">
              {/* 슬라이더 바 */}
              <div
                className="absolute bottom-1 left-0 h-[calc(100%-8px)] bg-indigo-100 dark:bg-indigo-700 rounded-md z-0 transition-all duration-300"
                style={{
                  width: '50%',
                  left: dateRangeMode === 'all' ? '0%' : '50%',
                }}
              />
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleDateRangeModeChange('all');
                }}
                className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-all duration-200 cursor-pointer relative z-10 ${
                  dateRangeMode === 'all'
                    ? 'text-indigo-600 dark:text-white font-semibold'
                    : 'text-gray-600 dark:text-white'
                }`}
              >
                전체 기간
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleDateRangeModeChange('custom');
                }}
                className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-all duration-200 cursor-pointer relative z-10 ${
                  dateRangeMode === 'custom'
                    ? 'text-indigo-600 dark:text-white font-black'
                    : 'text-gray-600 dark:text-white'
                }`}
              >
                기간 선택
              </button>
            </div>
            
            {/* 기간 선택 컴포넌트 */}
            <DateRangeSelector
              onDateRangeChange={handleDateRangeChange}
              isActive={dateRangeMode === 'custom'}
            />
          </div>
          {statsLoading ? (
            <div className="text-center">통계 로딩 중...</div>
          ) : (
            <StatsList 
              totalGames={stats.totalGames}
              playerWinrates={stats.playerWinrates}
              teamWinrates={stats.teamWinrates}
              playerWins={stats.playerWins}
              dateRange={dateRange}
            />
          )}
        </div>
      </div>
    </main>
  );
}
