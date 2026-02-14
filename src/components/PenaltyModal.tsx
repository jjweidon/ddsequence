'use client';

import React, { useState } from 'react';
import { IPenalty } from '@/models/Penalty';
import { getPlayerDisplayName } from '@/utils/playerNames';

interface PenaltyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (player: string, reason?: string) => Promise<void>;
  loading?: boolean;
}

const PenaltyModal: React.FC<PenaltyModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  loading = false,
}) => {
  const [selectedPlayer, setSelectedPlayer] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const validPlayers = ['잡', '큐', '지', '머', '웅'];

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!selectedPlayer) {
      alert('플레이어를 선택해주세요.');
      return;
    }

    await onSubmit(selectedPlayer, reason.trim() || undefined);
    setSelectedPlayer('');
    setReason('');
  };

  const handleClose = () => {
    if (!loading) {
      setSelectedPlayer('');
      setReason('');
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/70"
      onClick={handleClose}
    >
      <div
        className="bg-surface rounded-lg shadow-xl max-w-md w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="border-b border-border px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">
            패널티 기록 추가
          </h2>
          <button
            onClick={handleClose}
            disabled={loading}
            className="text-muted hover:text-foreground transition-colors disabled:opacity-50"
            aria-label="닫기"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* 내용 */}
        <div className="p-6 space-y-6">
          {/* 플레이어 선택 */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-3">
              플레이어 선택 <span className="text-muted">*</span>
            </label>
            <div className="grid grid-cols-5 gap-2">
              {validPlayers.map((player) => (
                <button
                  key={player}
                  type="button"
                  onClick={() => setSelectedPlayer(player)}
                  disabled={loading}
                  className={`px-2 py-3 rounded-lg font-bold text-xs transition-all duration-200
                    ${
                      selectedPlayer === player
                        ? 'bg-lose text-white'
                        : 'bg-surface-hover text-foreground hover:bg-border'
                    }
                    disabled:opacity-50 disabled:cursor-not-allowed
                    focus:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2`}
                >
                  {getPlayerDisplayName(player)}
                </button>
              ))}
            </div>
          </div>

          {/* 사유 입력 */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-3">
              사유 (선택)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={loading}
              placeholder="패널티 사유를 입력하세요 (선택사항)"
              maxLength={200}
              rows={3}
              className="w-full px-4 py-3 border border-border rounded-lg bg-surface text-foreground
                       placeholder-muted focus:outline-none focus:ring-2 focus:ring-focus focus:border-transparent
                       disabled:opacity-50 disabled:cursor-not-allowed
                       resize-none"
            />
            <p className="text-xs text-muted mt-1 text-right">
              {reason.length}/200
            </p>
          </div>
        </div>

        {/* 푸터 */}
        <div className="border-t border-border px-6 py-4 flex justify-end gap-3">
          <button
            onClick={handleClose}
            disabled={loading}
            className="px-4 py-2 bg-surface-hover hover:bg-border text-foreground rounded-lg transition-colors font-medium
                     disabled:opacity-50 disabled:cursor-not-allowed"
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !selectedPlayer}
            className="px-4 py-2 bg-accent-gradient hover:brightness-110 text-white rounded-lg font-medium
                     transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed
                     focus:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                등록 중...
              </span>
            ) : (
              '등록하기'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PenaltyModal;
