'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import PlayerSelect from '@/components/PlayerSelect';
import StatsList from '@/components/StatsList';
import DateRangeSelector from '@/components/DateRangeSelector';
import { useStatsStore } from '@/lib/statsStore';

export default function Home() {
  // 등록 간 최소 시간 간격 (분)
  const MIN_TIME_BETWEEN_REGISTRATIONS_MINUTES = 5;
  
  // 선택된 플레이어
  const [winningTeam, setWinningTeam] = useState<string[]>([]);
  const [losingTeam, setLosingTeam] = useState<string[]>([]);
  
  // 에러 및 로딩 상태
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  
  // 기간별 통계 관련 상태
  const [dateRangeMode, setDateRangeMode] = useState<'all' | 'custom'>('all');
  
  // Zustand 스토어에서 통계 상태 가져오기
  const {
    currentStats: stats,
    loading: statsLoading,
    error: statsError,
    dateRange,
    fetchAllStats,
    filterStatsByDateRange,
    resetDateRange
  } = useStatsStore();

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
      // 3초 후 에러 메시지 자동 제거
      setTimeout(() => {
        setError(null);
      }, 3000);
      return;
    }

    // 중복 플레이어 검사
    const allPlayers = [...winningTeam, ...losingTeam];
    const uniquePlayers = new Set(allPlayers);
    if (uniquePlayers.size !== allPlayers.length) {
      setError('동일한 플레이어는 승패 팀에 중복되어 선택할 수 없습니다.');
      // 3초 후 에러 메시지 자동 제거
      setTimeout(() => {
        setError(null);
      }, 3000);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // 최근 등록 데이터 확인
      const recentGamesResponse = await fetch('/api/games');
      const recentGamesData = await recentGamesResponse.json();
      
      if (recentGamesResponse.ok && recentGamesData.data && recentGamesData.data.length > 0) {
        const mostRecentGame = recentGamesData.data[0]; // createdAt 기준 내림차순 정렬된 첫 번째 게임
        const lastRegistrationTime = new Date(mostRecentGame.createdAt);
        const currentTime = new Date();
        const timeDifferenceMinutes = (currentTime.getTime() - lastRegistrationTime.getTime()) / (1000 * 60);
        
        if (timeDifferenceMinutes < MIN_TIME_BETWEEN_REGISTRATIONS_MINUTES) {
          setError('최근에 등록한 데이터가 있습니다');
          setLoading(false);
          // 3초 후 에러 메시지 자동 제거
          setTimeout(() => {
            setError(null);
          }, 3000);
          return;
        }
      }

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
      fetchAllStats(); // 통계 다시 가져오기
    } catch (error: any) {
      setError(error.message || '게임 데이터 저장 중 오류가 발생했습니다.');
      // 3초 후 에러 메시지 자동 제거
      setTimeout(() => {
        setError(null);
      }, 3000);
    } finally {
      setLoading(false);
    }
  };

    // 기간별 통계 모드 변경
  const handleDateRangeModeChange = (mode: 'all' | 'custom') => {
    setDateRangeMode(mode);
    if (mode === 'all') {
      resetDateRange();
    }
  };

  // 기간 변경 처리
  const handleDateRangeChange = (startDate: string, endDate: string) => {
    filterStatsByDateRange(startDate, endDate);
  };

  // 통계 데이터를 텍스트로 변환
  const getStatsAsText = () => {
    if (!stats) return '';
    
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
    fetchAllStats();
  }, []);

  return (
    <>
    {/* 에러 팝업 */}
    {error && (
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 animate-fadeIn w-[calc(100%-2rem)] max-w-2xl">
        <div className="bg-rose-50 dark:bg-rose-900/50 border-2 border-rose-200 dark:border-rose-800 
                      text-rose-700 dark:text-rose-300 px-6 py-3 shadow-lg w-full">
          <span className="text-sm font-medium text-center block">{error}</span>
        </div>
      </div>
    )}
    
    <main className="min-h-screen bg-slate-50 dark:bg-slate-900 py-8 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto">
        {/* 헤더 */}
        <div className="text-center mb-8">
          
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-400 dark:to-blue-500 
                       bg-clip-text text-transparent">
            뚱팸 시퀀스
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm">승률 계산기</p>
        </div>
      
        <div className="flex flex-col gap-6 w-full">
        {/* 기록 추가 섹션 */}
        <div className="bg-white dark:bg-slate-800 rounded-sm shadow-lg border border-slate-200 dark:border-slate-700 
                      overflow-hidden">
          <div className="px-6 py-5 bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-900 dark:to-gray-900 
                        border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              기록 추가
            </h2>
          </div>
          
          <div className="p-6 space-y-6">
            <div className="flex flex-row justify-center items-start gap-3 sm:gap-6">
              <PlayerSelect 
                label="승" 
                selectedPlayers={winningTeam} 
                oppositeTeamPlayers={losingTeam}
                onSelectPlayer={handleSelectWinningPlayer} 
              />
              
              <div className="flex items-center justify-center pt-6">
                <div className="w-px h-12 bg-slate-200 dark:bg-slate-700"></div>
              </div>
              
              <PlayerSelect 
                label="패" 
                selectedPlayers={losingTeam} 
                oppositeTeamPlayers={winningTeam}
                onSelectPlayer={handleSelectLosingPlayer} 
              />
            </div>
            
            {/* 버튼 영역 */}
            <div className="grid grid-cols-2 gap-4">
              <button
                className="bg-white dark:bg-slate-700 border-2 border-slate-300 dark:border-slate-600 
                         text-slate-700 dark:text-slate-200 font-bold px-6 py-3 rounded-xl
                         transition-all duration-200 transform hover:bg-slate-50 dark:hover:bg-slate-600 
                         hover:scale-[1.02] hover:shadow-md active:scale-95
                         focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
                onClick={handleReset}
              >
                초기화
              </button>
              <button
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 
                         dark:from-blue-600 dark:to-blue-700 dark:hover:from-blue-700 dark:hover:to-blue-800
                         text-white font-bold px-6 py-3 rounded-xl
                         transition-all duration-200 transform hover:scale-[1.02]
                         active:scale-95 disabled:opacity-50 disabled:scale-100
                         disabled:cursor-not-allowed
                         focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2"
                onClick={handleSubmit}
                disabled={loading || winningTeam.length !== 2 || losingTeam.length !== 2}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    등록 중...
                  </span>
                ) : '등록하기'}
              </button>
            </div>
            
            {/* 성공 메시지 */}
            {success && (
              <div className="bg-emerald-50 dark:bg-emerald-900/20 border-2 border-emerald-200 dark:border-emerald-800 
                            text-emerald-700 dark:text-emerald-300 px-4 py-3 rounded-sm animate-fadeIn flex items-start gap-3">
                <span className="text-xl flex-shrink-0">✅</span>
                <span className="text-sm font-medium">{success}</span>
              </div>
            )}
          </div>
        </div>
        
        {/* 통계 섹션 */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              통계
            </h2>
            <div className="flex items-center gap-3">
              <button 
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  copyStatsToClipboard();
                }}
                className="p-2.5 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 
                         hover:bg-slate-100 dark:hover:bg-slate-800 rounded-sm
                         transition-all duration-200
                         focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2"
                title="통계 복사하기"
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
              <Link 
                href="/history" 
                className="flex items-center gap-2 px-4 py-2.5 text-slate-700 dark:text-slate-300 font-semibold text-sm
                         hover:bg-slate-100 dark:hover:bg-slate-800 rounded-sm
                         transition-all duration-200
                         focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2"
              >
                <span>역대 기록</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </Link>
            </div>
          </div>
          
          {/* 기간 선택 탭 */}
          <div className="bg-white dark:bg-slate-800 rounded-sm shadow-md border border-slate-200 dark:border-slate-700 p-2">
            <div className="relative flex rounded-sm overflow-hidden">
              {/* 슬라이더 바 */}
              <div
                className="absolute inset-y-0 bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 
                         rounded-sm shadow-md transition-all duration-300 ease-out"
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
                className={`flex-1 py-3 px-6 text-sm font-bold rounded-sm transition-all duration-200 relative z-10 ${
                  dateRangeMode === 'all'
                    ? 'text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                전체
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleDateRangeModeChange('custom');
                }}
                className={`flex-1 py-3 px-6 text-sm font-bold rounded-sm transition-all duration-200 relative z-10 ${
                  dateRangeMode === 'custom'
                    ? 'text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                기간 선택
              </button>
            </div>
          </div>
          
          {/* 기간 선택 컴포넌트 */}
          <DateRangeSelector
            onDateRangeChange={handleDateRangeChange}
            isActive={dateRangeMode === 'custom'}
          />
          
          {/* 통계 데이터 */}
          {statsLoading ? (
            <div className="flex flex-col items-center justify-center py-16 bg-white dark:bg-slate-800 rounded-sm 
                          shadow-md border border-slate-200 dark:border-slate-700">
              <svg className="animate-spin h-12 w-12 text-blue-600 dark:text-blue-400 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-slate-600 dark:text-slate-400 font-medium">통계 로딩 중...</p>
            </div>
          ) : (
            stats && (
              <StatsList 
                totalGames={stats.totalGames}
                playerWinrates={stats.playerWinrates}
                teamWinrates={stats.teamWinrates}
                playerWins={stats.playerWins}
                dateRange={dateRange}
              />
            )
          )}
        </div>
      </div>
      </div>
      
    </main>
    
    {/* 명예의 전당 배너 */}
    <div className="w-full bg-gradient-to-r from-amber-500/10 to-orange-600/10 
                 dark:from-amber-500/20 dark:to-orange-600/20">
      <Link 
        href="/hall-of-fame" 
        className="block w-full px-6 py-4 
                 hover:from-amber-500/20 hover:to-orange-600/20 dark:hover:from-amber-500/30 dark:hover:to-orange-600/30
                 transition-all duration-200
                 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2"
      >
        <div className="flex items-center justify-center gap-2 text-amber-700 dark:text-amber-400">
          <span className="text-lg">🏆</span>
          <span className="font-semibold text-sm">명예의 전당</span>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        </div>
      </Link>
    </div>
    </>
  );
}
