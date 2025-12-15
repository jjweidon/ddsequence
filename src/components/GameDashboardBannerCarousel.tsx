'use client';

import { useState, useEffect, useMemo } from 'react';
import GameDashboardBanner, { DashboardEvent, calculateDashboardEvents } from './GameDashboardBanner';
import { IGame } from '@/models/Game';

interface GameDashboardBannerCarouselProps {
  games: IGame[];
  onEventCountChange?: (count: number) => void;
  currentIndex: number;
  onIndexChange: (index: number) => void;
}

export default function GameDashboardBannerCarousel({ 
  games, 
  onEventCountChange,
  currentIndex,
  onIndexChange 
}: GameDashboardBannerCarouselProps) {
  // 이벤트를 한 번만 계산 (모든 슬라이드가 같은 이벤트 목록 사용)
  const events = useMemo(() => {
    return calculateDashboardEvents(games);
  }, [games]);

  // 이벤트 개수 업데이트
  useEffect(() => {
    const eventCount = Math.min(5, events.length);
    onEventCountChange?.(eventCount);
  }, [events, onEventCountChange]);

  if (games.length === 0 || events.length === 0) return null;

  return (
    <div className="relative w-full max-w-full">
      {/* 캐러셀 슬라이드 */}
      <div className="relative overflow-hidden w-full max-w-full">
        <div 
          className="flex transition-transform duration-500 ease-in-out w-full"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {[0, 1, 2, 3, 4].map((index) => {
            // 계산된 이벤트를 각 슬라이드에 전달
            return (
              <div key={index} className="min-w-full w-full flex-shrink-0 max-w-full">
                <GameDashboardBanner games={games} singleEventIndex={index} events={events} />
              </div>
            );
          })}
        </div>
      </div>
      
      {/* 인디케이터 */}
      {events.length > 1 && (
        <div className="flex justify-center gap-2 pt-4">
          {[0, 1, 2, 3, 4].map((indicatorIndex) => {
            if (indicatorIndex >= events.length) return null;
            
            return (
              <button
                key={indicatorIndex}
                onClick={() => onIndexChange(indicatorIndex)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  currentIndex === indicatorIndex
                    ? 'w-8 bg-blue-600 dark:bg-blue-400'
                    : 'w-2 bg-slate-300 dark:bg-slate-600'
                }`}
                aria-label={`배너 ${indicatorIndex + 1}로 이동`}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
