import { IGame } from '../models/Game';
import { getTeamKey } from './teamOrder';

// 플레이어 타입
export type PlayerStats = {
  [player: string]: [number, number]; // [승리 수, 총 경기 수]
};

// 팀 타입
export type TeamStats = {
  [team: string]: [number, number]; // [승리 수, 총 경기 수]
};

// 승률 계산 함수
export const calculateWinrate = (wins: number, total: number): number => {
  return total > 0 ? (wins / total) * 100 : 0;
};

// 플레이어 통계 계산 함수
export const calculatePlayerStats = (games: IGame[]): PlayerStats => {
  const playerStats: PlayerStats = {};
  const validPlayers = ['잡', '큐', '지', '머', '웅'];
  
  // 플레이어 통계 초기화
  validPlayers.forEach(player => {
    playerStats[player] = [0, 0];
  });
  
  // 게임 로그를 순회하며 통계 업데이트
  games.forEach(game => {
    // 승리 팀 통계 업데이트
    game.winningTeam.forEach(player => {
      if (playerStats[player]) {
        playerStats[player][0] += 1; // 승리 수 증가
        playerStats[player][1] += 1; // 총 경기 수 증가
      }
    });
    
    // 패배 팀 통계 업데이트
    game.losingTeam.forEach(player => {
      if (playerStats[player]) {
        playerStats[player][1] += 1; // 총 경기 수만 증가
      }
    });
  });
  
  return playerStats;
};

// 팀 통계 계산 함수
export const calculateTeamStats = (games: IGame[]): TeamStats => {
  const teamStats: TeamStats = {};
  
  // 게임 로그를 순회하며 팀 통계 업데이트
  games.forEach(game => {
    // 승리 팀 통계 업데이트
    const winTeamKey = getTeamKey(game.winningTeam);
    if (!teamStats[winTeamKey]) {
      teamStats[winTeamKey] = [0, 0];
    }
    teamStats[winTeamKey][0] += 1; // 승리 수 증가
    teamStats[winTeamKey][1] += 1; // 총 경기 수 증가
    
    // 패배 팀 통계 업데이트
    const loseTeamKey = getTeamKey(game.losingTeam);
    if (!teamStats[loseTeamKey]) {
      teamStats[loseTeamKey] = [0, 0];
    }
    teamStats[loseTeamKey][1] += 1; // 총 경기 수만 증가
  });
  
  return teamStats;
};

// 정렬된 플레이어 승률 통계
export const getSortedPlayerStats = (playerStats: PlayerStats): [string, [number, number]][] => {
  return Object.entries(playerStats)
    .sort((a, b) => {
      // 승률로 정렬 (소수점까지 완전히 동일한 경우)
      const winrateA = calculateWinrate(a[1][0], a[1][1]);
      const winrateB = calculateWinrate(b[1][0], b[1][1]);
      
      if (winrateA !== winrateB) {
        return winrateB - winrateA;
      }
      
      // 승률이 완전히 동일하면 승리 횟수가 더 높은 쪽이 순위가 높음
      if (a[1][0] !== b[1][0]) {
        return b[1][0] - a[1][0];
      }
      
      // 승리 횟수까지 같으면 패배 횟수가 더 높은 쪽이 순위가 낮음
      const lossesA = a[1][1] - a[1][0];
      const lossesB = b[1][1] - b[1][0];
      if (lossesA !== lossesB) {
        return lossesA - lossesB; // 패배가 적은 쪽이 순위가 높음
      }
      
      // 모든 값이 같으면 동위 (0 반환)
      return 0;
    });
};

// 정렬된 팀 승률 통계
export const getSortedTeamStats = (teamStats: TeamStats): [string, [number, number]][] => {
  return Object.entries(teamStats)
    .sort((a, b) => {
      // 승률로 정렬 (소수점까지 완전히 동일한 경우)
      const winrateA = calculateWinrate(a[1][0], a[1][1]);
      const winrateB = calculateWinrate(b[1][0], b[1][1]);
      
      if (winrateA !== winrateB) {
        return winrateB - winrateA;
      }
      
      // 승률이 완전히 동일하면 승리 횟수가 더 높은 쪽이 순위가 높음
      if (a[1][0] !== b[1][0]) {
        return b[1][0] - a[1][0];
      }
      
      // 승리 횟수까지 같으면 패배 횟수가 더 높은 쪽이 순위가 낮음
      const lossesA = a[1][1] - a[1][0];
      const lossesB = b[1][1] - b[1][0];
      if (lossesA !== lossesB) {
        return lossesA - lossesB; // 패배가 적은 쪽이 순위가 높음
      }
      
      // 모든 값이 같으면 동위 (0 반환)
      return 0;
    });
};

// 승리 횟수 기준 정렬된 플레이어 통계
export const getSortedPlayerStatsByWins = (playerStats: PlayerStats): [string, [number, number]][] => {
  return Object.entries(playerStats)
    .sort((a, b) => {
      // 승리 횟수로 정렬 (동률 시 승률로 정렬)
      if (a[1][0] !== b[1][0]) {
        return b[1][0] - a[1][0];
      }
      
      const winrateA = calculateWinrate(a[1][0], a[1][1]);
      const winrateB = calculateWinrate(b[1][0], b[1][1]);
      
      return winrateB - winrateA;
    });
}; 