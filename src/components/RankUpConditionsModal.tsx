import React from 'react';
import { RankUpCondition } from '@/utils/rankUpConditions';
import { getPlayerDisplayName } from '@/utils/playerNames';

interface RankUpConditionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  conditions: RankUpCondition[];
}

const RankUpConditionsModal: React.FC<RankUpConditionsModalProps> = ({
  isOpen,
  onClose,
  conditions,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/70"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-2xl w-full mx-2 sm:mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-3 sm:px-6 py-2 sm:py-4 flex items-center justify-between">
          <h2 className="text-base sm:text-xl font-bold text-slate-800 dark:text-slate-100">
            순위 상승 조건
          </h2>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
            aria-label="닫기"
          >
            <svg
              className="w-5 h-5 sm:w-6 sm:h-6"
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
        <div className="p-3 sm:p-6">
          {conditions.length === 0 ? (
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 text-center py-6 sm:py-8">
              순위 상승 조건이 없습니다.
            </p>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {conditions.map((condition, index) => {
                const currentDisplayName = getPlayerDisplayName(condition.player);
                const targetDisplayName = getPlayerDisplayName(condition.targetPlayer);
                
                return (
                  <div
                    key={`${condition.player}-${condition.currentRank}`}
                    className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3 sm:p-4 border border-slate-200 dark:border-slate-600"
                  >
                    <div className="mb-2 sm:mb-3">
                      <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm sm:text-base">
                        {currentDisplayName}
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5">
                        현재 {condition.currentRank}위 → {condition.targetRank}위
                      </p>
                    </div>

                    {condition.requiredWins === -1 ? (
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 italic">
                        {condition.description}
                      </p>
                    ) : condition.requiredWins === 0 && condition.requiredLosses.length === 0 ? (
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 italic">
                        {condition.description}
                      </p>
                    ) : (
                      <div className="space-y-2 sm:space-y-3">
                        {/* 조건 설명 */}
                        <div className="flex flex-wrap gap-1.5 sm:gap-2">
                          {condition.requiredWins > 0 && (
                            <span className="inline-flex items-center px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-xs sm:text-sm font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">
                              <svg
                                className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                              {currentDisplayName} +{condition.requiredWins}승
                            </span>
                          )}
                          {condition.requiredLosses.map((loss, lossIndex) => (
                            <span
                              key={lossIndex}
                              className="inline-flex items-center px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-xs sm:text-sm font-medium bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300"
                            >
                              <svg
                                className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                              {getPlayerDisplayName(loss.player)} +{loss.losses}패
                            </span>
                          ))}
                        </div>

                        {/* Before/After 비교 */}
                        <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-slate-200 dark:border-slate-600">
                          <div className="grid grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm">
                            {/* Before */}
                            <div className="space-y-1.5 sm:space-y-2">
                              <div className="font-medium text-slate-700 dark:text-slate-300 text-[10px] sm:text-xs">
                                변경 전
                              </div>
                              <div className="space-y-1">
                                <div>
                                  <span className="text-slate-600 dark:text-slate-400">{currentDisplayName}: </span>
                                  <span className="font-semibold text-slate-800 dark:text-slate-100">
                                    {condition.before.currentPlayer.winrate.toFixed(2)}%
                                  </span>
                                  <span className="text-slate-500 dark:text-slate-500 text-[10px] sm:text-xs ml-1">
                                    ({condition.before.currentPlayer.wins}승/{condition.before.currentPlayer.total - condition.before.currentPlayer.wins}패, {condition.before.currentPlayer.total}게임)
                                  </span>
                                </div>
                                <div>
                                  <span className="text-slate-600 dark:text-slate-400">{targetDisplayName}: </span>
                                  <span className="font-semibold text-slate-800 dark:text-slate-100">
                                    {condition.before.targetPlayer.winrate.toFixed(2)}%
                                  </span>
                                  <span className="text-slate-500 dark:text-slate-500 text-[10px] sm:text-xs ml-1">
                                    ({condition.before.targetPlayer.wins}승/{condition.before.targetPlayer.total - condition.before.targetPlayer.wins}패, {condition.before.targetPlayer.total}게임)
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* After */}
                            <div className="space-y-1.5 sm:space-y-2">
                              <div className="font-medium text-emerald-700 dark:text-emerald-300 text-[10px] sm:text-xs">
                                변경 후
                              </div>
                              <div className="space-y-1">
                                <div>
                                  <span className="text-slate-600 dark:text-slate-400">{currentDisplayName}: </span>
                                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                    {condition.after.currentPlayer.winrate.toFixed(2)}%
                                  </span>
                                  <span className="text-slate-500 dark:text-slate-500 text-[10px] sm:text-xs ml-1">
                                    ({condition.after.currentPlayer.wins}승/{condition.after.currentPlayer.total - condition.after.currentPlayer.wins}패, {condition.after.currentPlayer.total}게임)
                                  </span>
                                </div>
                                <div>
                                  <span className="text-slate-600 dark:text-slate-400">{targetDisplayName}: </span>
                                  <span className="font-semibold text-rose-600 dark:text-rose-400">
                                    {condition.after.targetPlayer.winrate.toFixed(2)}%
                                  </span>
                                  <span className="text-slate-500 dark:text-slate-500 text-[10px] sm:text-xs ml-1">
                                    ({condition.after.targetPlayer.wins}승/{condition.after.targetPlayer.total - condition.after.targetPlayer.wins}패, {condition.after.targetPlayer.total}게임)
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div className="sticky bottom-0 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 px-3 sm:px-6 py-2 sm:py-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-3 py-1.5 sm:px-4 sm:py-2 bg-slate-600 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 text-white rounded-md transition-colors font-medium text-xs sm:text-sm"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};

export default RankUpConditionsModal;
