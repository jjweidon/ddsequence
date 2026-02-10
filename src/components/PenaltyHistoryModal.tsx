'use client';

import React, { useState, useEffect } from 'react';
import { IPenalty } from '@/models/Penalty';
import { getPlayerDisplayName } from '@/utils/playerNames';

interface PenaltyHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  year?: number;
}

const PenaltyHistoryModal: React.FC<PenaltyHistoryModalProps> = ({
  isOpen,
  onClose,
  year,
}) => {
  const [penalties, setPenalties] = useState<IPenalty[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [selectedPenalties, setSelectedPenalties] = useState<string[]>([]);
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false);

  // 현재 연도 가져오기
  const getCurrentYear = () => {
    if (year) return year;
    const now = new Date();
    const koreaTime = new Date(now.getTime() + (9 * 60 * 60 * 1000));
    return koreaTime.getFullYear();
  };

  // 패널티 데이터 가져오기
  const fetchPenalties = async () => {
    setLoading(true);
    setError(null);
    try {
      const currentYear = getCurrentYear();
      const response = await fetch(`/api/penalties?year=${currentYear}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || '패널티 데이터 로딩 중 오류가 발생했습니다.');
      }
      
      setPenalties(data.data);
    } catch (error: any) {
      console.error('패널티 기록 불러오기 오류:', error);
      setError(error.message || '패널티 기록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 선택된 패널티 삭제 함수
  const handleDeleteSelected = async () => {
    if (selectedPenalties.length === 0) return;
    
    if (!confirm(`선택한 ${selectedPenalties.length}개의 패널티 기록을 삭제하시겠습니까?`)) {
      return;
    }
    
    setDeleteLoading(true);
    
    try {
      const deletePromises = selectedPenalties.map(async (id) => {
        const response = await fetch(`/api/penalties/${id}`, {
          method: 'DELETE',
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || '삭제에 실패했습니다.');
        }
        return data;
      });
      
      await Promise.all(deletePromises);
      
      // 삭제 후 목록 새로고침
      fetchPenalties();
      setSelectedPenalties([]);
      
    } catch (error: any) {
      console.error('패널티 기록 삭제 오류:', error);
      alert(error.message || '패널티 기록 삭제 중 오류가 발생했습니다.');
    } finally {
      setDeleteLoading(false);
    }
  };

  // 편집 모드 토글
  const toggleEditMode = () => {
    setIsEditMode(!isEditMode);
    if (isEditMode) {
      setSelectedPenalties([]);
    }
  };

  // 날짜 포맷팅 함수
  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  };

  // 모달이 열릴 때 데이터 가져오기
  useEffect(() => {
    if (isOpen) {
      fetchPenalties();
      setIsEditMode(false);
      setSelectedPenalties([]);
    }
  }, [isOpen, year]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/70"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-4xl w-full mx-2 sm:mx-4 max-h-[90vh] overflow-hidden flex flex-col relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 최상단 우측 버튼들 */}
        <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10 flex items-center gap-2">
          {/* 편집 버튼 */}
          <button
            onClick={toggleEditMode}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 font-semibold text-xs sm:text-sm rounded-sm transition-all duration-200 whitespace-nowrap
                     focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 ${
              isEditMode 
                ? 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800' 
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {isEditMode ? '완료' : '편집'}
          </button>
          
          {/* 닫기 버튼 */}
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-sm"
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

        {/* 헤더 */}
        <div className="border-b border-slate-200 dark:border-slate-700 px-3 sm:px-6 py-3 sm:py-4 pr-24 sm:pr-28 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 flex-shrink-0">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-slate-100">
              패널티 히스토리
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5">
              {getCurrentYear()}년 기록 ({penalties.length}건)
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {isEditMode && (
              <button
                onClick={handleDeleteSelected}
                disabled={selectedPenalties.length === 0 || deleteLoading}
                className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 font-bold text-xs sm:text-sm whitespace-nowrap
                         transition-all duration-200 shadow-sm hover:shadow-md
                         focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                  selectedPenalties.length === 0 || deleteLoading
                    ? 'bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white shadow-rose-500/30 hover:scale-[1.02] focus-visible:ring-rose-400'
                }`}
              >
                {deleteLoading ? (
                  <>
                    <svg className="animate-spin h-3 w-3 sm:h-4 sm:w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="hidden sm:inline">삭제 중...</span>
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-4 sm:w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span className="hidden sm:inline">삭제</span>
                    {selectedPenalties.length > 0 && <span>({selectedPenalties.length})</span>}
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* 내용 */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <svg className="animate-spin h-10 w-10 sm:h-12 sm:w-12 text-blue-600 dark:text-blue-400 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-slate-600 dark:text-slate-400 font-medium text-base sm:text-lg">로딩 중...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20 px-4">
              <div className="text-5xl sm:text-6xl mb-4 opacity-40">⚠️</div>
              <p className="text-rose-600 dark:text-rose-400 font-medium text-base sm:text-lg mb-4 text-center">{error}</p>
              <button 
                className="px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 
                         dark:from-blue-600 dark:to-blue-700 dark:hover:from-blue-700 dark:hover:to-blue-800
                         text-white font-bold text-sm sm:text-base shadow-lg shadow-blue-500/30
                         transition-all duration-200 transform hover:scale-[1.02]
                         focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2"
                onClick={fetchPenalties}
              >
                다시 시도
              </button>
            </div>
          ) : penalties.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl sm:text-5xl mb-4 opacity-40">⚠️</div>
              <p className="text-slate-500 dark:text-slate-400 font-medium text-sm sm:text-base">패널티 기록이 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {penalties.map((penalty) => (
                <div
                  key={penalty._id}
                  className={`bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-3 sm:p-4
                            transition-all duration-200 ${
                    isEditMode && selectedPenalties.includes(penalty._id || '')
                      ? 'ring-2 ring-rose-500 bg-rose-50 dark:bg-rose-900/20'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                >
                  <div className="flex items-start gap-2 sm:gap-4">
                    {isEditMode && (
                      <input
                        type="checkbox"
                        checked={penalty._id ? selectedPenalties.includes(penalty._id) : false}
                        onChange={(e) => {
                          if (penalty._id) {
                            if (e.target.checked) {
                              setSelectedPenalties([...selectedPenalties, penalty._id]);
                            } else {
                              setSelectedPenalties(selectedPenalties.filter(id => id !== penalty._id));
                            }
                          }
                        }}
                        className="mt-0.5 sm:mt-1 w-4 h-4 sm:w-5 sm:h-5 text-rose-600 border-slate-300 rounded focus:ring-rose-500 flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mb-1 sm:mb-2">
                        <span className="text-xl sm:text-2xl font-bold text-rose-600 dark:text-rose-400 whitespace-nowrap">
                          {getPlayerDisplayName(penalty.player)}
                        </span>
                        <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          {formatDate(penalty.createdAt)}
                        </span>
                      </div>
                      {penalty.reason && (
                        <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 mt-1 sm:mt-2 break-words">
                          {penalty.reason}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PenaltyHistoryModal;
