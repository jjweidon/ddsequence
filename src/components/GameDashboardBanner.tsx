'use client';

import React, { useMemo } from 'react';
import { IGame } from '@/models/Game';
import { calculatePlayerStats, calculateWinrate } from '@/utils/gameStats';

// 플레이어 표시 이름 매핑
const playerDisplayNames: { [key: string]: string } = {
  '잡': '채림',
  '큐': '순규',
  '지': '진호',
  '머': '희림',
  '웅': '재웅'
};

interface DashboardEvent {
  type: 'winStreak' | 'loseStreak' | 'comeback' | 'darkHorse' | 'fallFromGrace';
  player: string;
  message: string;
  subMessage: string;
  icon: string;
  color: string;
  bgColor: string;
  priority: number;
  streakCount?: number;
}

interface GameDashboardBannerProps {
  games: IGame[];
}

const GameDashboardBanner: React.FC<GameDashboardBannerProps> = ({ games }) => {
  // 플레이어별 게임 기록 분석
  const analyzePlayerGames = (player: string, allGames: IGame[]) => {
    // 시간순으로 정렬된 게임에서 플레이어의 승패 기록 추출
    const sortedGames = [...allGames].sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    const playerGames: Array<{ game: IGame; isWin: boolean }> = [];
    
    sortedGames.forEach(game => {
      const isWin = game.winningTeam.includes(player);
      const isLose = game.losingTeam.includes(player);
      
      if (isWin || isLose) {
        playerGames.push({
          game,
          isWin
        });
      }
    });

    return playerGames;
  };

  // 연승/연패 계산
  const calculateStreak = (playerGames: Array<{ game: IGame; isWin: boolean }>) => {
    if (playerGames.length === 0) {
      return { currentStreak: 0, isWinStreak: true, lastResult: null };
    }

    const lastGame = playerGames[playerGames.length - 1];
    let streak = 1;
    const isWinStreak = lastGame.isWin;

    // 마지막 게임부터 역순으로 연속된 승/패 계산
    for (let i = playerGames.length - 2; i >= 0; i--) {
      if (playerGames[i].isWin === isWinStreak) {
        streak++;
      } else {
        break;
      }
    }

    return {
      currentStreak: streak,
      isWinStreak,
      lastResult: lastGame.isWin
    };
  };

  // 역전 승리 감지 (연패 후 승리) - 연패 횟수 반환
  const detectComeback = (playerGames: Array<{ game: IGame; isWin: boolean }>) => {
    if (playerGames.length < 2) return 0;
    
    const lastGame = playerGames[playerGames.length - 1];
    // 마지막 게임이 승리인 경우에만 comeback 가능
    if (!lastGame.isWin) return 0;
    
    // 마지막 게임 이전부터 역순으로 연패 횟수 계산
    let loseStreak = 0;
    for (let i = playerGames.length - 2; i >= 0; i--) {
      if (!playerGames[i].isWin) {
        loseStreak++;
      } else {
        break;
      }
    }
    
    return loseStreak;
  };

  // 이벤트 감지 및 생성
  const detectEvents = useMemo((): DashboardEvent[] => {
    if (games.length === 0) return [];

    const events: DashboardEvent[] = [];
    const playerStats = calculatePlayerStats(games);
    const validPlayers = ['잡', '큐', '지', '머', '웅'];

    validPlayers.forEach(player => {
      const [wins, total] = playerStats[player] || [0, 0];
      const winrate = calculateWinrate(wins, total);
      const playerGames = analyzePlayerGames(player, games);
      const streak = calculateStreak(playerGames);

      const displayName = playerDisplayNames[player] || player;

      // 높은 승률 플레이어의 연패 (여왕의 몰락, 추락)
      if (total >= 5 && winrate >= 60 && streak.isWinStreak === false && streak.currentStreak >= 3) {
        events.push({
          type: 'fallFromGrace',
          player,
          message: '여왕의 몰락',
          subMessage: `${displayName}님, 승률 ${winrate.toFixed(1)}%에서 ${streak.currentStreak}연패 중...`,
          icon: '👑',
          color: 'text-purple-600 dark:text-purple-400',
          bgColor: 'bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 border-purple-200 dark:border-purple-800',
          priority: 10,
          streakCount: streak.currentStreak
        });
      }

      // 낮은 승률 플레이어의 연승 (다크호스, 파죽지세)
      if (total >= 5 && winrate < 45 && streak.isWinStreak === true && streak.currentStreak >= 3) {
        events.push({
          type: 'darkHorse',
          player,
          message: '파죽지세!',
          subMessage: `${displayName}님, 승률 ${winrate.toFixed(1)}%에서 ${streak.currentStreak}연승 돌파!`,
          icon: '⚡',
          color: 'text-yellow-600 dark:text-yellow-400',
          bgColor: 'bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/30 dark:to-orange-900/30 border-yellow-200 dark:border-yellow-800',
          priority: 9,
          streakCount: streak.currentStreak
        });
      }

      // 일반 연승 (3회 이상)
      if (streak.isWinStreak === true && streak.currentStreak >= 3) {
        events.push({
          type: 'winStreak',
          player,
          message: streak.currentStreak >= 5 ? '불멸의 연승' : '연승 행진',
          subMessage: `${displayName}님, ${streak.currentStreak}연승 중!`,
          icon: streak.currentStreak >= 5 ? '🔥' : '✨',
          color: 'text-emerald-600 dark:text-emerald-400',
          bgColor: 'bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/30 dark:to-green-900/30 border-emerald-200 dark:border-emerald-800',
          priority: streak.currentStreak >= 5 ? 8 : 6,
          streakCount: streak.currentStreak
        });
      }

      // 역전 승리 (연패 후 승리)
      const comebackLoseStreak = detectComeback(playerGames);
      if (comebackLoseStreak >= 2 && streak.isWinStreak && streak.currentStreak >= 1) {
        events.push({
          type: 'comeback',
          player,
          message: '역전을 보여주세요',
          subMessage: `${displayName}님, ${comebackLoseStreak}연패 후 승리! 반전의 시작인가?`,
          icon: '💫',
          color: 'text-blue-600 dark:text-blue-400',
          bgColor: 'bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/30 border-blue-200 dark:border-blue-800',
          priority: 7
        });
      }

      // 일반 연패 (3회 이상)
      if (streak.isWinStreak === false && streak.currentStreak >= 3) {
        events.push({
          type: 'loseStreak',
          player,
          message: streak.currentStreak >= 5 ? '절망의 연패' : '연패의 늪',
          subMessage: `${displayName}님, ${streak.currentStreak}연패 중... 힘내세요!`,
          icon: streak.currentStreak >= 5 ? '😢' : '💔',
          color: 'text-rose-600 dark:text-rose-400',
          bgColor: 'bg-gradient-to-r from-rose-50 to-red-50 dark:from-rose-900/30 dark:to-red-900/30 border-rose-200 dark:border-rose-800',
          priority: 5,
          streakCount: streak.currentStreak
        });
      }
    });

    // 우선순위에 따라 정렬 (높은 우선순위가 먼저)
    return events.sort((a, b) => b.priority - a.priority);
  }, [games]);

  // 가장 중요한 이벤트 3개만 표시
  const topEvents = useMemo(() => {
    return detectEvents.slice(0, 3);
  }, [detectEvents]);

  if (topEvents.length === 0) {
    return null;
  }

  return (
    <div className="mb-6 space-y-3">
      {topEvents.map((event, index) => (
        <div
          key={`${event.player}-${event.type}-${index}`}
          className={`${event.bgColor} border-x-0 border-y p-4 sm:p-6 shadow-md animate-fadeIn`}
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <div className="flex items-start gap-3 max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-3xl flex-shrink-0">{event.icon}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className={`font-bold text-lg ${event.color}`}>
                  {event.message}
                </h3>
                {event.streakCount && (
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${event.color} bg-white/50 dark:bg-black/20`}>
                    {event.streakCount}연속
                  </span>
                )}
              </div>
              <p className="text-slate-600 dark:text-slate-300 text-sm">
                {event.subMessage}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default GameDashboardBanner;

