import React, { useState } from 'react';

interface DateRangeSelectorProps {
  onDateRangeChange: (startDate: string, endDate: string) => void;
  isActive: boolean;
}

const DateRangeSelector: React.FC<DateRangeSelectorProps> = ({ 
  onDateRangeChange, 
  isActive 
}) => {
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // 오늘 날짜를 YYYY-MM-DD 형식으로 반환 (한국 시간 기준)
  const getTodayString = () => {
    const today = new Date();
    // 한국 시간대로 변환 (UTC+9)
    const koreaTime = new Date(today.getTime() + (9 * 60 * 60 * 1000));
    return koreaTime.toISOString().split('T')[0];
  };

  // 빠른 선택 버튼들
  const quickSelectOptions = [
    { label: '1일', days: 1 },
    { label: '7일', days: 7 },
    { label: '30일', days: 30 },
    { label: '3개월', days: 90 },
    { label: '6개월', days: 180 },
    { label: '365일', days: 365 }
  ];

  // 빠른 선택 처리 (한국 시간 기준)
  const handleQuickSelect = (option: any, e: React.MouseEvent) => {
    e.preventDefault(); // 기본 동작 방지
    e.stopPropagation(); // 이벤트 버블링 방지
    
    const today = new Date();
    // 한국 시간대로 변환
    const koreaTime = new Date(today.getTime() + (9 * 60 * 60 * 1000));
    
    const end = new Date(koreaTime);
    const start = new Date(koreaTime);
    start.setDate(koreaTime.getDate() - option.days + 1);

    const startStr = start.toISOString().split('T')[0];
    const endStr = end.toISOString().split('T')[0];
    
    setStartDate(startStr);
    setEndDate(endStr);
    // 빠른 선택 시에는 즉시 통계를 가져오지 않고, 사용자가 적용 버튼을 클릭할 때까지 대기
  };

  // 수동 날짜 변경 처리
  const handleDateChange = (e: React.MouseEvent) => {
    e.preventDefault(); // 기본 동작 방지
    e.stopPropagation(); // 이벤트 버블링 방지
    
    if (startDate && endDate) {
      onDateRangeChange(startDate, endDate);
    }
  };

  return (
    <div 
      className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-4 shadow-sm transition-all duration-300 ease-in-out ${
        isActive 
          ? 'opacity-100 max-h-96 transform translate-y-0' 
          : 'opacity-0 max-h-0 overflow-hidden transform -translate-y-4 pointer-events-none'
      }`}
    >
      <h3 className="text-sm font-medium text-gray-700 dark:text-white mb-3">기간 선택</h3>
      
      {/* 빠른 선택 버튼들 */}
      <div className="flex flex-wrap gap-2 mb-4">
        {quickSelectOptions.map((option, index) => (
          <button
            key={index}
            type="button"
            onClick={(e) => handleQuickSelect(option, e)}
            className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-md dark:bg-gray-700 dark:text-white
                     hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200 font-bold"
          >
            {option.label}
          </button>
        ))}
      </div>
      
      {/* 수동 날짜 선택 */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
            <label className="block text-xs text-gray-600 dark:text-white mb-1">시작일</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            max={getTodayString()}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm
                     focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
        <div className="flex-1">
          <label className="block text-xs text-gray-600 dark:text-white mb-1">종료일</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            max={getTodayString()}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm
                     focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
      </div>
      
      {/* 적용 버튼 */}
      <button
        type="button"
        onClick={handleDateChange}
        disabled={!startDate || !endDate}
        className="mt-3 w-full bg-indigo-600 text-white text-sm py-2 px-4 rounded-md
                 hover:bg-indigo-700 transition-colors duration-200
                 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        기간 적용
      </button>
    </div>
  );
};

export default DateRangeSelector; 