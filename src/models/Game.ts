import mongoose, { Schema } from 'mongoose';

// 게임 로그 인터페이스
export interface IGame {
  winningTeam: string[];  // 승리 팀 플레이어
  losingTeam: string[];   // 패배 팀 플레이어
  createdAt: Date;        // 생성 날짜
}

// 게임 로그 스키마
const GameSchema = new Schema<IGame>({
  winningTeam: { 
    type: [String], 
    required: true,
    validate: {
      validator: function(team: string[]) {
        return team.length === 2;
      },
      message: '팀은 정확히 2명의 플레이어로 구성되어야 합니다.'
    }
  },
  losingTeam: { 
    type: [String], 
    required: true,
    validate: {
      validator: function(team: string[]) {
        return team.length === 2;
      },
      message: '팀은 정확히 2명의 플레이어로 구성되어야 합니다.'
    }
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
}, {
  timestamps: true
});

// 중복 플레이어 검증 미들웨어
GameSchema.pre('save', function(next) {
  // 모든 플레이어 배열 생성
  const allPlayers = [...this.winningTeam, ...this.losingTeam];
  
  // 중복 플레이어 검사
  const uniquePlayers = new Set(allPlayers);
  if (uniquePlayers.size !== allPlayers.length) {
    return next(new Error('승패 팀 간에 중복된 플레이어가 있습니다.'));
  }
  
  // 유효한 플레이어 검사 (잡, 큐, 지, 머, 웅 중 하나여야 함)
  const validPlayers = ['잡', '큐', '지', '머', '웅'];
  for (const player of allPlayers) {
    if (!validPlayers.includes(player)) {
      return next(new Error(`유효하지 않은 플레이어: ${player}`));
    }
  }
  
  next();
});

// 모델 생성 및 내보내기
export default mongoose.models.Game || mongoose.model<IGame>('Game', GameSchema); 