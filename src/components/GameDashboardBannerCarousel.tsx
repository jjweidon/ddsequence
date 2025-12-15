'use client';

import { useState, useEffect } from 'react';
import GameDashboardBanner from './GameDashboardBanner';
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
  const [eventCount, setEventCount] = useState<number>(0);
  const [hasEvents, setHasEvents] = useState<boolean[]>([false, false, false, false, false]);

  // 각 인덱스의 이벤트 존재 여부 확인
  useEffect(() => {
    const checkEvents = () => {
      const events: boolean[] = [];
      let count = 0;
      
      // 각 인덱스에 대해 이벤트가 있는지 확인
      for (let i = 0; i < 5; i++) {
        // GameDashboardBanner를 렌더링해서 확인하는 대신
        // 간단하게 games가 있으면 이벤트가 있을 수 있다고 가정
        // 실제로는 GameDashboardBanner가 null을 반환하면 이벤트가 없는 것
        const hasEvent = games.length > 0;
        events.push(hasEvent);
        if (hasEvent) count++;
      }
      
      // 실제로는 GameDashboardBanner를 렌더링해서 확인해야 하지만
      // 지금은 최대 5개로 가정하고, 실제 렌더링에서 확인
      setHasEvents(events);
      const actualCount = Math.min(5, games.length > 0 ? 5 : 0);
      setEventCount(actualCount);
      onEventCountChange?.(actualCount);
    };
    
    checkEvents();
  }, [games, onEventCountChange]);

  // 실제 이벤트가 있는지 확인 - GameDashboardBanner가 렌더링되는지로 판단
  const checkEventExists = (index: number) => {
    return games.length > 0 && index < 5;
  };

  if (games.length === 0) return null;

  return (
    <div className="relative">
      {/* 캐러셀 슬라이드 */}
      <div className="relative overflow-hidden">
        <div 
          className="flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {[0, 1, 2, 3, 4].map((index) => {
            const banner = <GameDashboardBanner games={games} singleEventIndex={index} />;
            // banner가 null이면 이벤트가 없는 것
            return (
              <div key={index} className="min-w-full flex-shrink-0">
                {banner}
              </div>
            );
          })}
        </div>
      </div>
      
      {/* 인디케이터 */}
      {eventCount > 1 && (
        <div className="flex justify-center gap-2 pt-4">
          {[0, 1, 2, 3, 4].map((indicatorIndex) => {
            // 실제로 이벤트가 있는지 확인하기 위해 렌더링 테스트
            // 간단하게 games가 있으면 최대 5개로 가정
            if (indicatorIndex >= Math.min(5, games.length > 0 ? 5 : 0)) return null;
            
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
