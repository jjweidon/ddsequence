'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import PlayerSelect from '@/components/PlayerSelect';
import StatsList from '@/components/StatsList';
import DateRangeSelector from '@/components/DateRangeSelector';
import GameDashboardBannerCarousel from '@/components/GameDashboardBannerCarousel';
import PenaltyModal from '@/components/PenaltyModal';
import { useStatsStore } from '@/lib/statsStore';
import { IGame } from '@/models/Game';

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
  
  // 패널티 모달 상태
  const [isPenaltyModalOpen, setIsPenaltyModalOpen] = useState<boolean>(false);
  const [penaltyLoading, setPenaltyLoading] = useState<boolean>(false);
  
  // 기간별 통계 관련 상태
  const [dateRangeMode, setDateRangeMode] = useState<'all' | 'custom'>('all');
  
  // 게임 데이터 및 배너 관련 상태
  const [games, setGames] = useState<IGame[]>([]);
  const [bannerLoading, setBannerLoading] = useState<boolean>(true);
  const [currentBannerIndex, setCurrentBannerIndex] = useState<number>(0);
  const [eventCount, setEventCount] = useState<number>(0);
  
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

  // 패널티 기록 제출
  const handlePenaltySubmit = async (player: string, reason?: string) => {
    setPenaltyLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/penalties', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          player,
          reason,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || '패널티 데이터 저장 중 오류가 발생했습니다.');
      }

      setSuccess('패널티가 성공적으로 기록되었습니다.');
      setIsPenaltyModalOpen(false);
      fetchAllStats(); // 통계 다시 가져오기
      
      // 3초 후 성공 메시지 자동 제거
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (error: any) {
      setError(error.message || '패널티 데이터 저장 중 오류가 발생했습니다.');
      // 3초 후 에러 메시지 자동 제거
      setTimeout(() => {
        setError(null);
      }, 3000);
    } finally {
      setPenaltyLoading(false);
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
    
    // 한국 시간 기준 현재 날짜 포맷팅
    const now = new Date();
    const koreaTime = new Date(now.getTime() + (9 * 60 * 60 * 1000));
    const year = koreaTime.getUTCFullYear();
    const month = String(koreaTime.getUTCMonth() + 1).padStart(2, '0');
    const day = String(koreaTime.getUTCDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;
    
    let text = `https://ddsequence.vercel.app\n\n`;
    text += `날짜: ${formattedDate}\n`;
    
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

  // 현재 연도 가져오기 (한국 시간 기준)
  const getCurrentYear = () => {
    const now = new Date();
    const koreaTime = new Date(now.getTime() + (9 * 60 * 60 * 1000));
    return koreaTime.getFullYear();
  };

  // 게임 데이터 가져오기 (현재 연도만)
  const fetchGames = async () => {
    setBannerLoading(true);
    try {
      const currentYear = getCurrentYear();
      const response = await fetch(`/api/games?year=${currentYear}`);
      const data = await response.json();
      
      if (response.ok && data.data) {
        setGames(data.data);
      }
    } catch (error) {
      console.error('게임 데이터 로딩 오류:', error);
    } finally {
      setBannerLoading(false);
    }
  };

  // 컴포넌트 마운트 시 통계 데이터 및 게임 데이터 가져오기
  useEffect(() => {
    fetchAllStats();
    fetchGames();
  }, []);

  // 게임 등록 후 게임 데이터 새로고침
  useEffect(() => {
    if (success) {
      fetchGames();
    }
  }, [success]);

  // 캐러셀 자동 스와이프
  useEffect(() => {
    if (games.length === 0 || eventCount === 0) return;
    
    // 이벤트가 1개만 있으면 자동 스와이프 불필요
    if (eventCount <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentBannerIndex((prevIndex) => {
        const maxIndex = eventCount - 1;
        return prevIndex >= maxIndex ? 0 : prevIndex + 1;
      });
    }, 5000); // 5초마다 자동 스와이프

    return () => clearInterval(interval);
  }, [games, eventCount]);

  return (
    <>
    {/* 에러 팝업 */}
    {error && (
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 animate-fadeIn w-[calc(100%-2rem)] max-w-2xl">
        <div className="bg-surface border border-border text-foreground px-6 py-4 shadow-lg w-full">
          <span className="text-sm font-medium text-center block">{error}</span>
        </div>
      </div>
    )}
    
    {/* 성공 팝업 */}
    {success && (
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 animate-fadeIn w-[calc(100%-2rem)] max-w-2xl">
        <div className="bg-emerald-500 dark:bg-emerald-600 border border-emerald-600 dark:border-emerald-700 
                      text-white px-6 py-4 shadow-lg shadow-emerald-500/30 w-full flex items-center justify-center gap-2">
          <span className="text-xl flex-shrink-0">✅</span>
          <span className="text-sm font-medium text-center">{success}</span>
        </div>
      </div>
    )}
    
    <main className="min-h-screen bg-page py-8 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2 text-foreground tracking-tight">
            뚱팸 시퀀스
          </h1>
          <p className="text-muted text-sm">승률 계산기</p>
        </div>
      
        <div className="flex flex-col gap-6 w-full">
        {/* 기록 추가 섹션 */}
        <div className="bg-surface rounded-lg border border-border overflow-hidden">
          <div className="px-6 py-5 border-b border-border">
            <h2 className="text-xl font-semibold text-foreground">
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
                <div className="w-px h-12 bg-border"></div>
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
                onClick={() => setIsPenaltyModalOpen(true)}
                className="bg-surface-hover border border-border text-foreground font-medium px-4 sm:px-6 py-3 rounded-lg
                         transition-colors duration-200 hover:bg-border
                         focus:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2
                         flex items-center justify-center gap-1.5 sm:gap-2 whitespace-nowrap text-xs sm:text-sm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span>패널티 기록</span>
              </button>
              <button
                className="bg-accent-gradient hover:brightness-110 text-white font-semibold px-6 py-3 rounded-lg transition-all duration-200
                         transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed
                         focus:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
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
          </div>
        </div>

        {/* 게임 대시보드 배너 캐러셀 */}
        {!bannerLoading && games.length > 0 && (
          <GameDashboardBannerCarousel 
            games={games} 
            onEventCountChange={setEventCount}
            currentIndex={currentBannerIndex}
            onIndexChange={setCurrentBannerIndex}
          />
        )}
        
        {/* 통계 섹션 */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground">
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
                className="p-2.5 text-muted hover:text-foreground hover:bg-surface-hover rounded-lg transition-colors duration-200
                         focus:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
                title="통계 복사하기"
              >
                {isCopied ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-success" viewBox="0 0 20 20" fill="currentColor">
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
                className="flex items-center gap-2 px-4 py-2.5 text-foreground font-medium text-sm
                         hover:bg-surface-hover rounded-lg transition-colors duration-200
                         focus:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
              >
                <span>역대 기록</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </Link>
            </div>
          </div>
          
          {/* 기간 선택 탭 */}
          <div className="bg-surface rounded-lg border border-border p-1">
            <div className="relative flex rounded-lg overflow-hidden bg-surface-hover">
              {/* 슬라이더 바 - accent 그라데이션 */}
              <div
                className="absolute inset-y-1 bg-accent-gradient rounded-md shadow-sm transition-all duration-300 ease-out"
                style={{
                  width: 'calc(50% - 4px)',
                  left: dateRangeMode === 'all' ? '2px' : 'calc(50% + 2px)',
                }}
              />
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleDateRangeModeChange('all');
                }}
                className={`flex-1 py-3 px-6 text-sm font-medium rounded-md transition-colors duration-200 relative z-10 ${
                  dateRangeMode === 'all'
                    ? 'text-white'
                    : 'text-muted hover:text-foreground'
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
                className={`flex-1 py-3 px-6 text-sm font-medium rounded-md transition-colors duration-200 relative z-10 ${
                  dateRangeMode === 'custom'
                    ? 'text-white'
                    : 'text-muted hover:text-foreground'
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
            <div className="flex flex-col items-center justify-center py-16 bg-surface rounded-lg border border-border">
              <svg className="animate-spin h-12 w-12 text-muted mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-muted font-medium">통계 로딩 중...</p>
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
    
    {/* 패널티 모달 */}
    <PenaltyModal
      isOpen={isPenaltyModalOpen}
      onClose={() => setIsPenaltyModalOpen(false)}
      onSubmit={handlePenaltySubmit}
      loading={penaltyLoading}
    />
    
    {/* 명예의 전당 배너 */}
    <div className="w-full border-t border-border">
      <Link 
        href="/hall-of-fame" 
        className="block w-full px-6 py-4 bg-gradient-to-r from-amber-400 to-orange-500 
                 hover:from-amber-500 hover:to-orange-600 transition-all duration-200 opacity-90
                 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2"
      >
        <div className="flex items-center justify-center gap-2 text-white font-semibold text-sm">
          <span className="text-lg">🏆</span>
          <span>명예의 전당</span>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        </div>
      </Link>
    </div>
    </>
  );
}
