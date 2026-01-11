import { calculateWinrate } from './gameStats';

export interface PlayerWinrateData {
  rank: number;
  player: string;
  winrate: number;
  wins: number;
  total: number;
}

export interface RankUpCondition {
  player: string;
  targetPlayer: string; // 목표 플레이어 (한 단계 위 플레이어)
  currentRank: number;
  targetRank: number;
  requiredWins: number; // 해당 플레이어가 추가로 이겨야 하는 횟수
  requiredLosses: { player: string; losses: number }[]; // 위 순위 플레이어들이 추가로 져야 하는 횟수
  description: string; // 조건 설명
  before: {
    currentPlayer: { wins: number; total: number; winrate: number };
    targetPlayer: { wins: number; total: number; winrate: number };
  };
  after: {
    currentPlayer: { wins: number; total: number; winrate: number };
    targetPlayer: { wins: number; total: number; winrate: number };
  };
}

// 두 플레이어의 순위를 비교하는 함수 (gameStats.ts의 정렬 로직과 동일)
function comparePlayers(
  playerA: { wins: number; total: number },
  playerB: { wins: number; total: number }
): number {
  const winrateA = calculateWinrate(playerA.wins, playerA.total);
  const winrateB = calculateWinrate(playerB.wins, playerB.total);
  
  // 승률 비교
  if (winrateA !== winrateB) {
    return winrateB - winrateA; // 승률이 높은 쪽이 우선
  }
  
  // 승리 횟수 비교
  if (playerA.wins !== playerB.wins) {
    return playerB.wins - playerA.wins; // 승리 횟수가 많은 쪽이 우선
  }
  
  // 패배 횟수 비교
  const lossesA = playerA.total - playerA.wins;
  const lossesB = playerB.total - playerB.wins;
  if (lossesA !== lossesB) {
    return lossesA - lossesB; // 패배가 적은 쪽이 우선
  }
  
  return 0; // 동위
}

// 플레이어 A가 플레이어 B보다 순위가 높은지 확인
function isPlayerBetter(
  playerA: { wins: number; total: number },
  playerB: { wins: number; total: number }
): boolean {
  return comparePlayers(playerA, playerB) < 0;
}

// 특정 플레이어가 한 단계 위 플레이어를 넘어서기 위한 최소 조건 계산
function calculateRankUpCondition(
  currentPlayer: PlayerWinrateData,
  targetPlayer: PlayerWinrateData
): RankUpCondition {
  const current = {
    wins: currentPlayer.wins,
    total: currentPlayer.total,
  };
  
  const target = {
    wins: targetPlayer.wins,
    total: targetPlayer.total,
  };
  
  // 이미 순위가 더 높은 경우
  if (isPlayerBetter(current, target)) {
    return {
      player: currentPlayer.player,
      targetPlayer: targetPlayer.player,
      currentRank: currentPlayer.rank,
      targetRank: targetPlayer.rank,
      requiredWins: 0,
      requiredLosses: [],
      description: '이미 순위가 더 높습니다.',
      before: {
        currentPlayer: {
          wins: current.wins,
          total: current.total,
          winrate: calculateWinrate(current.wins, current.total),
        },
        targetPlayer: {
          wins: target.wins,
          total: target.total,
          winrate: calculateWinrate(target.wins, target.total),
        },
      },
      after: {
        currentPlayer: {
          wins: current.wins,
          total: current.total,
          winrate: calculateWinrate(current.wins, current.total),
        },
        targetPlayer: {
          wins: target.wins,
          total: target.total,
          winrate: calculateWinrate(target.wins, target.total),
        },
      },
    };
  }
  
  // 최소 조건을 찾기 위해 여러 경우의 수를 시도
  // 알고리즘: totalGames (승 + 패의 합)를 기준으로 오름차순 탐색
  // 이렇게 하면 첫 번째로 조건을 만족하는 경우가 최소 totalGames를 보장함
  let bestCondition: RankUpCondition | null = null;
  
  // 최대 시도 횟수 제한 (성능 고려)
  const maxAttempts = 200;
  
  // totalGames를 0부터 증가시키면서 탐색
  // totalGames = currentWins + targetLosses
  for (let totalGames = 0; totalGames <= maxAttempts * 2; totalGames++) {
    // totalGames에 대해 모든 가능한 조합 시도
    // currentWins는 0부터 totalGames까지, targetLosses는 totalGames - currentWins
    for (let currentWins = 0; currentWins <= totalGames; currentWins++) {
      const targetLosses = totalGames - currentWins;
      
      // 현재 플레이어가 currentWins번 더 이김
      const newCurrent = {
        wins: current.wins + currentWins,
        total: current.total + currentWins,
      };
      
      // 위 플레이어가 targetLosses번 더 짐 (패배 = 총 게임 수만 증가, 승리 수는 그대로)
      const newTarget = {
        wins: target.wins,
        total: target.total + targetLosses,
      };
      
      // 현재 플레이어가 목표 플레이어보다 순위가 높아졌는지 확인
      if (isPlayerBetter(newCurrent, newTarget)) {
        // 첫 번째로 조건을 만족하는 경우 = 최소 totalGames
        bestCondition = {
          player: currentPlayer.player,
          targetPlayer: targetPlayer.player,
          currentRank: currentPlayer.rank,
          targetRank: targetPlayer.rank,
          requiredWins: currentWins,
          requiredLosses: targetLosses > 0 ? [{ player: targetPlayer.player, losses: targetLosses }] : [],
          description: buildDescription(currentPlayer.player, currentWins, targetPlayer.player, targetLosses),
          before: {
            currentPlayer: {
              wins: current.wins,
              total: current.total,
              winrate: calculateWinrate(current.wins, current.total),
            },
            targetPlayer: {
              wins: target.wins,
              total: target.total,
              winrate: calculateWinrate(target.wins, target.total),
            },
          },
          after: {
            currentPlayer: {
              wins: newCurrent.wins,
              total: newCurrent.total,
              winrate: calculateWinrate(newCurrent.wins, newCurrent.total),
            },
            targetPlayer: {
              wins: newTarget.wins,
              total: newTarget.total,
              winrate: calculateWinrate(newTarget.wins, newTarget.total),
            },
          },
        };
        // 최소 totalGames를 찾았으므로 즉시 종료
        break;
      }
    }
    
    // 최소 조건을 찾았으면 외부 루프도 종료
    if (bestCondition) break;
  }
  
  // 최소 조건을 찾지 못한 경우
  if (!bestCondition) {
    return {
      player: currentPlayer.player,
      targetPlayer: targetPlayer.player,
      currentRank: currentPlayer.rank,
      targetRank: targetPlayer.rank,
      requiredWins: -1,
      requiredLosses: [],
      description: '순위 상승이 어렵습니다.',
      before: {
        currentPlayer: {
          wins: current.wins,
          total: current.total,
          winrate: calculateWinrate(current.wins, current.total),
        },
        targetPlayer: {
          wins: target.wins,
          total: target.total,
          winrate: calculateWinrate(target.wins, target.total),
        },
      },
      after: {
        currentPlayer: {
          wins: current.wins,
          total: current.total,
          winrate: calculateWinrate(current.wins, current.total),
        },
        targetPlayer: {
          wins: target.wins,
          total: target.total,
          winrate: calculateWinrate(target.wins, target.total),
        },
      },
    };
  }
  
  return bestCondition;
}

// 조건 설명 텍스트 생성
function buildDescription(
  currentPlayer: string,
  currentWins: number,
  targetPlayer: string,
  targetLosses: number
): string {
  const parts: string[] = [];
  
  if (currentWins > 0) {
    parts.push(`${currentPlayer}가 ${currentWins}번 더 이기고`);
  }
  
  if (targetLosses > 0) {
    parts.push(`${targetPlayer}가 ${targetLosses}번 더 지면`);
  }
  
  if (parts.length === 0) {
    return '이미 순위가 더 높습니다.';
  }
  
  return parts.join(', ') + ' 순위가 올라갑니다.';
}

// 2, 3, 4, 5위 플레이어들의 순위 상승 조건 계산
export function calculateRankUpConditions(
  playerWinrates: PlayerWinrateData[]
): RankUpCondition[] {
  const conditions: RankUpCondition[] = [];
  
  // 2, 3, 4, 5위 플레이어만 처리
  const targetRanks = [2, 3, 4, 5];
  
  for (const rank of targetRanks) {
    const currentPlayer = playerWinrates.find(p => p.rank === rank);
    if (!currentPlayer) continue;
    
    // 한 단계 위 플레이어 찾기
    const targetRank = rank - 1;
    const targetPlayer = playerWinrates.find(p => p.rank === targetRank);
    
    if (!targetPlayer) continue;
    
    const condition = calculateRankUpCondition(currentPlayer, targetPlayer);
    conditions.push(condition);
  }
  
  return conditions;
}
