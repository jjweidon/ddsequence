'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
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
  // 스와이프 관련 상태
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);
  const isDragging = useRef<boolean>(false);
  const [dragOffset, setDragOffset] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const hasMoved = useRef<boolean>(false); // 실제 이동이 있었는지 추적

  // 이벤트를 한 번만 계산 (모든 슬라이드가 같은 이벤트 목록 사용)
  const events = useMemo(() => {
    return calculateDashboardEvents(games);
  }, [games]);

  // 이벤트 개수 업데이트
  useEffect(() => {
    const eventCount = Math.min(5, events.length);
    onEventCountChange?.(eventCount);
  }, [events, onEventCountChange]);

  // 최소 스와이프 거리 (px)
  const minSwipeDistance = 50;
  // 드래그 시작을 인식하는 최소 거리 (px) - 이 거리 이상 움직여야 드래그로 인식
  const minDragStartDistance = 10;

  // 터치 시작 핸들러
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    isDragging.current = true;
    hasMoved.current = false;
    setDragOffset(0);
  };

  // 터치 이동 핸들러
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current) return;
    
    const currentX = e.touches[0].clientX;
    const diff = touchStartX.current - currentX;
    const absDiff = Math.abs(diff);
    
    // 최소 거리 이상 움직였을 때만 드래그로 인식하고 기본 동작 방지
    if (absDiff > minDragStartDistance) {
      if (!hasMoved.current) {
        hasMoved.current = true;
        e.preventDefault(); // 스크롤 등 기본 동작 방지
      }
      setDragOffset(diff);
    }
  };

  // 터치 종료 핸들러
  const handleTouchEnd = () => {
    if (!isDragging.current) return;
    
    touchEndX.current = touchStartX.current - dragOffset;
    const swipeDistance = touchStartX.current - touchEndX.current;
    
    const maxIndex = Math.min(5, events.length) - 1;
    
    // 실제로 이동이 있었고 최소 스와이프 거리 이상일 때만 슬라이드 변경
    if (hasMoved.current && Math.abs(swipeDistance) > minSwipeDistance) {
      if (swipeDistance > 0 && currentIndex < maxIndex) {
        // 오른쪽으로 스와이프 (다음 슬라이드)
        onIndexChange(currentIndex + 1);
      } else if (swipeDistance < 0 && currentIndex > 0) {
        // 왼쪽으로 스와이프 (이전 슬라이드)
        onIndexChange(currentIndex - 1);
      }
    }
    
    // 상태 초기화
    setDragOffset(0);
    isDragging.current = false;
    hasMoved.current = false;
    touchStartX.current = 0;
    touchEndX.current = 0;
  };

  // 마우스 드래그 지원 (데스크톱)
  const handleMouseDown = (e: React.MouseEvent) => {
    touchStartX.current = e.clientX;
    isDragging.current = true;
    hasMoved.current = false;
    setDragOffset(0);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    const currentX = e.clientX;
    const diff = touchStartX.current - currentX;
    const absDiff = Math.abs(diff);
    
    // 최소 거리 이상 움직였을 때만 드래그로 인식
    if (absDiff > minDragStartDistance) {
      hasMoved.current = true;
      setDragOffset(diff);
    }
  };

  const handleMouseUp = () => {
    if (!isDragging.current) return;
    
    touchEndX.current = touchStartX.current - dragOffset;
    const swipeDistance = touchStartX.current - touchEndX.current;
    
    const maxIndex = Math.min(5, events.length) - 1;
    
    // 실제로 이동이 있었고 최소 스와이프 거리 이상일 때만 슬라이드 변경
    if (hasMoved.current && Math.abs(swipeDistance) > minSwipeDistance) {
      if (swipeDistance > 0 && currentIndex < maxIndex) {
        // 오른쪽으로 드래그 (다음 슬라이드)
        onIndexChange(currentIndex + 1);
      } else if (swipeDistance < 0 && currentIndex > 0) {
        // 왼쪽으로 드래그 (이전 슬라이드)
        onIndexChange(currentIndex - 1);
      }
    }
    
    // 상태 초기화
    setDragOffset(0);
    isDragging.current = false;
    hasMoved.current = false;
    touchStartX.current = 0;
    touchEndX.current = 0;
  };

  // 마우스가 요소 밖으로 나갔을 때 처리
  const handleMouseLeave = () => {
    if (isDragging.current) {
      setDragOffset(0);
      isDragging.current = false;
      hasMoved.current = false;
      touchStartX.current = 0;
      touchEndX.current = 0;
    }
  };

  if (games.length === 0 || events.length === 0) return null;

  const maxIndex = Math.min(5, events.length) - 1;
  const containerWidth = containerRef.current?.clientWidth || (typeof window !== 'undefined' ? window.innerWidth : 0);
  // 최소 이동 거리 이상일 때만 dragOffset 적용
  const effectiveDragOffset = Math.abs(dragOffset) > minDragStartDistance ? dragOffset : 0;
  const translateX = containerWidth > 0 
    ? -currentIndex * 100 + (effectiveDragOffset / containerWidth) * 100
    : -currentIndex * 100;

  return (
    <div className="relative w-full max-w-full">
      {/* 캐러셀 슬라이드 */}
      <div 
        ref={containerRef}
        className="relative overflow-hidden w-full max-w-full cursor-grab active:cursor-grabbing"
        style={{ touchAction: 'pan-x' }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        <div 
          className="flex transition-transform duration-500 ease-in-out w-full"
          style={{ 
            transform: `translateX(${translateX}%)`,
            transition: Math.abs(dragOffset) > minDragStartDistance ? 'none' : 'transform 0.5s ease-in-out'
          }}
        >
          {[0, 1, 2, 3, 4].map((index) => {
            if (index >= events.length) return null;
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
                    ? 'w-8 bg-accent-gradient'
                    : 'w-2 bg-border-strong'
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
