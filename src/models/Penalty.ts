import mongoose, { Schema } from 'mongoose';

// 패널티 인터페이스
export interface IPenalty {
  _id?: string;         // MongoDB ID
  player: string;       // 패널티를 받는 플레이어
  reason?: string;      // 패널티 사유 (선택)
  createdAt: Date;      // 생성 날짜
}

// 패널티 스키마
const PenaltySchema = new Schema<IPenalty>({
  player: {
    type: String,
    required: true,
    enum: {
      values: ['잡', '큐', '지', '머', '웅'],
      message: '유효하지 않은 플레이어입니다.'
    }
  },
  reason: {
    type: String,
    required: false,
    maxlength: [200, '사유는 200자 이하여야 합니다.']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// 모델 생성 및 내보내기
export default mongoose.models.Penalty || mongoose.model<IPenalty>('Penalty', PenaltySchema);
