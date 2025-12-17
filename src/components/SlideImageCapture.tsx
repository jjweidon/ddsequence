'use client';

import React, { useRef } from 'react';
import html2canvas from 'html2canvas';

interface OriginalStyle {
  element: HTMLElement;
  opacity: string;
  animation: string;
  maxHeight?: string;
  overflow?: string;
  height?: string;
  styleProperties?: { [key: string]: string };
}

interface SlideImageCaptureProps {
  captureRef: React.RefObject<HTMLDivElement | null>;
  slideContentRef: React.RefObject<HTMLDivElement | null>;
  fileName: string;
  onCapturingChange?: (isCapturing: boolean) => void;
  onSuccess?: (imageDataUrl: string) => void;
  onError?: (error: Error) => void;
}

// oklab/oklch 색상을 RGB로 변환하는 헬퍼 함수
const convertOklabToRgb = (color: string): string | null => {
  if (!color || typeof color !== 'string') return null;
  
  if (color.includes('oklab') || color.includes('oklch')) {
    // 투명도 추출
    const alphaMatch = color.match(/[\d.]+\)$/);
    const alpha = alphaMatch ? parseFloat(alphaMatch[0].replace(')', '')) : 1;
    
    // 색상 값 추출 (oklab/oklch 함수 내부 값)
    const valuesMatch = color.match(/oklab\(([^)]+)\)|oklch\(([^)]+)\)/);
    
    if (color.includes('white') || color.includes('255')) {
      return `rgba(255, 255, 255, ${alpha})`;
    }
    
    // 기본적으로 흰색 계열로 변환 (투명도 유지)
    return `rgba(255, 255, 255, ${alpha * 0.1})`;
  }
  return null;
};

// 모든 색상 관련 CSS 속성 목록
const colorProperties = [
  'backgroundColor',
  'color',
  'borderColor',
  'borderTopColor',
  'borderRightColor',
  'borderBottomColor',
  'borderLeftColor',
  'outlineColor',
  'textDecorationColor',
  'columnRuleColor',
];

// 요소의 모든 색상 속성을 RGB로 변환
const convertElementColors = (element: HTMLElement, originalStyles: OriginalStyle[]): void => {
  const computedStyle = window.getComputedStyle(element);
  const existingStyle = originalStyles.find(s => s.element === element);
  const styleProps: { [key: string]: string } = existingStyle?.styleProperties || {};
  
  colorProperties.forEach(prop => {
    const colorValue = computedStyle.getPropertyValue(prop.replace(/([A-Z])/g, '-$1').toLowerCase());
    
    if (colorValue && (colorValue.includes('oklab') || colorValue.includes('oklch'))) {
      const rgbColor = convertOklabToRgb(colorValue);
      if (rgbColor) {
        // 원래 스타일 저장
        if (!styleProps[prop]) {
          styleProps[prop] = element.style[prop as keyof CSSStyleDeclaration] as string || '';
        }
        
        // RGB로 변환하여 적용
        (element.style as any)[prop] = rgbColor;
      }
    }
  });
  
  // styleProperties 저장
  if (Object.keys(styleProps).length > 0) {
    if (existingStyle) {
      existingStyle.styleProperties = styleProps;
    } else {
      originalStyles.push({
        element,
        opacity: '',
        animation: '',
        styleProperties: styleProps
      });
    }
  }
};

// SVG 요소가 있는지 확인
const hasSvgElements = (element: HTMLElement): boolean => {
  return element.querySelectorAll('svg').length > 0;
};

// 텍스트 정렬 및 색상 강제 적용 함수
const enforceTextAlignment = (element: HTMLElement, originalStyles: OriginalStyle[]): void => {
  const computedStyle = window.getComputedStyle(element);
  const existingStyle = originalStyles.find(s => s.element === element);
  const styleProps: { [key: string]: string } = existingStyle?.styleProperties || {};
  
  // 버튼 요소 처리 - 텍스트 색상, 정렬, line-height, display 강제 적용
  if (element.tagName === 'BUTTON') {
    // 원래 스타일 저장
    if (!styleProps.textAlign) {
      styleProps.textAlign = element.style.textAlign || '';
    }
    if (!styleProps.lineHeight) {
      styleProps.lineHeight = element.style.lineHeight || '';
    }
    if (!styleProps.display) {
      styleProps.display = element.style.display || '';
    }
    if (!styleProps.color) {
      styleProps.color = element.style.color || '';
    }
    
    // 색상 강제 적용 (Tailwind 클래스가 제대로 적용되지 않을 수 있음)
    const color = computedStyle.color;
    if (!color.includes('rgb')) {
      // computed style에서 색상 추출 실패 시 인라인 스타일 확인
      const inlineColor = element.getAttribute('style')?.match(/color:\s*([^;]+)/);
      if (inlineColor) {
        element.style.color = inlineColor[1].trim();
      } else {
        // 기본값 설정
        element.style.color = element.classList.contains('text-white') 
          ? 'rgb(255, 255, 255)' 
          : 'rgba(255, 255, 255, 0.7)';
      }
    }
    
    // 정렬 강제 적용
    element.style.textAlign = 'center';
    element.style.lineHeight = '1.5';
    element.style.display = 'block';
  }
  
  // 범례 span 요소 처리
  if (element.tagName === 'SPAN' && element.closest('.flex.items-center')) {
    if (!styleProps.color) {
      styleProps.color = element.style.color || '';
    }
    
    const color = computedStyle.color;
    if (!color.includes('rgb')) {
      element.style.color = 'rgba(255, 255, 255, 0.8)';
    }
  }
  
  // 범례 컨테이너 처리
  if (element.classList.contains('flex') && element.querySelector('span')) {
    if (!styleProps.display) {
      styleProps.display = element.style.display || '';
    }
    if (!styleProps.alignItems) {
      styleProps.alignItems = element.style.alignItems || '';
    }
    element.style.display = 'flex';
    element.style.alignItems = 'center';
  }
  
  // styleProperties 저장
  if (Object.keys(styleProps).length > 0) {
    if (existingStyle) {
      existingStyle.styleProperties = { ...existingStyle.styleProperties, ...styleProps };
    } else {
      originalStyles.push({
        element,
        opacity: '',
        animation: '',
        styleProperties: styleProps
      });
    }
  }
};

// 슬라이드 내용 준비 (opacity, 스크롤, 색상 처리)
const prepareSlideForCapture = (
  slideContent: HTMLElement
): OriginalStyle[] => {
  const allElements = slideContent.querySelectorAll('*') as NodeListOf<HTMLElement>;
  const originalStyles: OriginalStyle[] = [];
  
  allElements.forEach(element => {
    const computedStyle = window.getComputedStyle(element);
    const opacity = computedStyle.opacity;
    
    // opacity 처리
    if (opacity === '0' || element.style.opacity === '0' || element.classList.contains('opacity-0')) {
      const existingStyle = originalStyles.find(s => s.element === element);
      if (existingStyle) {
        existingStyle.opacity = element.style.opacity || '';
        existingStyle.animation = element.style.animation || '';
      } else {
        originalStyles.push({
          element,
          opacity: element.style.opacity || '',
          animation: element.style.animation || ''
        });
      }
      element.style.opacity = '1';
      element.style.animation = 'none';
      element.classList.remove('opacity-0');
    }
    
    // 스크롤 컨테이너 처리
    if (element.classList.contains('overflow-y-auto') || element.classList.contains('max-h-64') || 
        (computedStyle.maxHeight !== 'none' && computedStyle.maxHeight !== '' && computedStyle.maxHeight !== '0px')) {
      const existingStyle = originalStyles.find(s => s.element === element);
      if (existingStyle) {
        existingStyle.maxHeight = element.style.maxHeight || '';
        existingStyle.overflow = element.style.overflow || '';
        existingStyle.height = element.style.height || '';
      } else {
        originalStyles.push({
          element,
          opacity: element.style.opacity || '',
          animation: element.style.animation || '',
          maxHeight: element.style.maxHeight || '',
          overflow: element.style.overflow || '',
          height: element.style.height || ''
        });
      }
      
      element.style.maxHeight = 'none';
      element.style.overflow = 'visible';
      element.style.height = 'auto';
      element.classList.remove('max-h-64', 'overflow-y-auto');
    }
    
    // 모든 색상 속성을 RGB로 변환
    convertElementColors(element, originalStyles);
    
    // 텍스트 정렬 강제 적용
    enforceTextAlignment(element, originalStyles);
  });
  
  return originalStyles;
};

// 원래 상태로 복원
const restoreSlideStyles = (originalStyles: OriginalStyle[]) => {
  originalStyles.forEach(({ element, opacity, animation, maxHeight, overflow, height, styleProperties }) => {
    element.style.opacity = opacity;
    element.style.animation = animation;
    if (maxHeight !== undefined) {
      element.style.maxHeight = maxHeight;
    }
    if (overflow !== undefined) {
      element.style.overflow = overflow;
    }
    if (height !== undefined) {
      element.style.height = height;
    }
    // 색상 속성 복원
    if (styleProperties) {
      Object.keys(styleProperties).forEach(prop => {
        (element.style as any)[prop] = styleProperties[prop];
      });
    }
    if (!opacity) {
      element.classList.add('opacity-0');
    }
    if (maxHeight === '' && overflow === '') {
      element.classList.add('max-h-64', 'overflow-y-auto');
    }
  });
};

// SVG 요소 처리 (차트 등)
const prepareSvgForCapture = (slideContent: HTMLElement): void => {
  const svgElements = slideContent.querySelectorAll('svg');
  
  svgElements.forEach(svg => {
    // SVG 스타일 강제 적용
    svg.setAttribute('style', 'display: block;');
    
    // SVG 내부 요소의 스타일 강제 적용
    const svgElements = svg.querySelectorAll('*');
    svgElements.forEach(el => {
      const htmlEl = el as HTMLElement;
      const computedStyle = window.getComputedStyle(el);
      
      // fill과 stroke 속성 강제 적용
      const fill = computedStyle.fill;
      const stroke = computedStyle.stroke;
      const opacity = computedStyle.opacity;
      
      if (fill && fill !== 'none') {
        htmlEl.setAttribute('fill', fill);
      }
      if (stroke && stroke !== 'none') {
        htmlEl.setAttribute('stroke', stroke);
        const strokeWidth = computedStyle.strokeWidth;
        if (strokeWidth) {
          htmlEl.setAttribute('stroke-width', strokeWidth);
        }
      }
      if (opacity && opacity !== '1') {
        htmlEl.setAttribute('opacity', opacity);
      }
      
      // oklab/oklch 색상 처리
      if (fill && (fill.includes('oklab') || fill.includes('oklch'))) {
        const rgbColor = convertOklabToRgb(fill);
        if (rgbColor) {
          htmlEl.setAttribute('fill', rgbColor);
        }
      }
      if (stroke && (stroke.includes('oklab') || stroke.includes('oklch'))) {
        const rgbColor = convertOklabToRgb(stroke);
        if (rgbColor) {
          htmlEl.setAttribute('stroke', rgbColor);
        }
      }
    });
  });
};

// 이미지 캡처 함수
export const captureSlideImage = async (
  captureRef: React.RefObject<HTMLDivElement | null>,
  slideContentRef: React.RefObject<HTMLDivElement | null>,
  fileName: string,
  onCapturingChange?: (isCapturing: boolean) => void
): Promise<string | null> => {
  if (!captureRef.current || !slideContentRef.current) return null;
  
  onCapturingChange?.(true);
  
  try {
    // 버튼 숨기기
    const buttons = document.querySelectorAll('[data-exclude-from-capture]');
    buttons.forEach(btn => {
      (btn as HTMLElement).style.display = 'none';
    });
    
    // 슬라이드 내용 준비
    const originalStyles = prepareSlideForCapture(slideContentRef.current);
    
    // SVG 요소가 있는지 확인
    const hasSvg = hasSvgElements(slideContentRef.current);
    
    // SVG 요소 처리
    if (hasSvg) {
      prepareSvgForCapture(slideContentRef.current);
      // SVG 렌더링을 위한 더 긴 대기 시간
      await new Promise(resolve => setTimeout(resolve, 1000));
    } else {
      // 일반 슬라이드의 경우 짧은 대기 시간
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    // 스크롤 제거 후 실제 높이 재계산
    const actualHeight = Math.max(
      captureRef.current.scrollHeight,
      captureRef.current.clientHeight,
      window.innerHeight
    );
    
    const canvas = await html2canvas(captureRef.current, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#1e1b4b',
      windowWidth: captureRef.current.scrollWidth,
      windowHeight: actualHeight,
      ignoreElements: (element: HTMLElement) => {
        return element.hasAttribute('data-exclude-from-capture');
      },
      onclone: (clonedDoc: Document) => {
        // 복제된 문서의 모든 요소에서 색상 및 정렬 처리
        const allElements = clonedDoc.querySelectorAll('*') as NodeListOf<HTMLElement>;
        
        allElements.forEach(element => {
          // 복제된 문서의 computed style 가져오기
          const computedStyle = clonedDoc.defaultView?.getComputedStyle(element) || window.getComputedStyle(element);
          
          // 버튼 요소 처리 - 텍스트 색상과 정렬 강제 적용
          if (element.tagName === 'BUTTON') {
            const color = computedStyle.color;
            if (color && !color.includes('rgb')) {
              // Tailwind 클래스로 인한 색상을 RGB로 변환
              if (color.includes('white')) {
                element.style.color = 'rgb(255, 255, 255)';
              } else if (color.includes('0.7') || color.includes('70')) {
                element.style.color = 'rgba(255, 255, 255, 0.7)';
              }
            }
            element.style.textAlign = 'center';
            element.style.display = 'block';
            element.style.lineHeight = '1.5';
          }
          
          // 범례 span 요소 처리
          if (element.tagName === 'SPAN' && element.closest('.flex.items-center')) {
            const color = computedStyle.color;
            if (color && !color.includes('rgb')) {
              if (color.includes('white') || color.includes('0.8') || color.includes('80')) {
                element.style.color = 'rgba(255, 255, 255, 0.8)';
              }
            }
          }
          
          // 모든 색상 속성 체크 및 변환
          colorProperties.forEach(prop => {
            const cssProp = prop.replace(/([A-Z])/g, '-$1').toLowerCase();
            try {
              const colorValue = computedStyle.getPropertyValue(cssProp);
              
              if (colorValue && (colorValue.includes('oklab') || colorValue.includes('oklch'))) {
                const rgbColor = convertOklabToRgb(colorValue);
                if (rgbColor) {
                  element.style.setProperty(cssProp, rgbColor, 'important');
                } else {
                  // 변환 실패 시 기본값으로 설정
                  element.style.setProperty(cssProp, 'rgba(255, 255, 255, 0.1)', 'important');
                }
              }
            } catch (e) {
              // 속성 접근 실패 시 무시
            }
          });
          
          // SVG 요소의 fill과 stroke 처리
          if (element.tagName.toLowerCase() === 'svg' || element.closest('svg')) {
            try {
              const fill = computedStyle.fill;
              const stroke = computedStyle.stroke;
              
              if (fill && fill !== 'none') {
                if (fill.includes('oklab') || fill.includes('oklch')) {
                  const rgbColor = convertOklabToRgb(fill);
                  if (rgbColor) {
                    element.setAttribute('fill', rgbColor);
                  } else {
                    element.setAttribute('fill', 'rgba(255, 255, 255, 0.1)');
                  }
                } else {
                  element.setAttribute('fill', fill);
                }
              }
              
              if (stroke && stroke !== 'none') {
                if (stroke.includes('oklab') || stroke.includes('oklch')) {
                  const rgbColor = convertOklabToRgb(stroke);
                  if (rgbColor) {
                    element.setAttribute('stroke', rgbColor);
                  } else {
                    element.setAttribute('stroke', 'rgba(255, 255, 255, 0.1)');
                  }
                } else {
                  element.setAttribute('stroke', stroke);
                }
                
                const strokeWidth = computedStyle.strokeWidth;
                if (strokeWidth) {
                  element.setAttribute('stroke-width', strokeWidth);
                }
              }
            } catch (e) {
              // SVG 속성 처리 실패 시 무시
            }
          }
        });
      },
    } as any);
    
    // 원래 상태로 복원
    restoreSlideStyles(originalStyles);
    
    // 버튼 다시 표시
    buttons.forEach(btn => {
      (btn as HTMLElement).style.display = '';
    });
    
    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error('이미지 캡처 오류:', error);
    throw error;
  } finally {
    onCapturingChange?.(false);
    // 버튼 다시 표시 (에러 발생 시 대비)
    const buttons = document.querySelectorAll('[data-exclude-from-capture]');
    buttons.forEach(btn => {
      (btn as HTMLElement).style.display = '';
    });
  }
};

// 이미지 저장 훅
export const useSlideImageCapture = () => {
  const saveImage = async (
    captureRef: React.RefObject<HTMLDivElement | null>,
    slideContentRef: React.RefObject<HTMLDivElement | null>,
    fileName: string,
    setIsCapturing: (value: boolean) => void
  ): Promise<void> => {
    try {
      const imageDataUrl = await captureSlideImage(
        captureRef,
        slideContentRef,
        fileName,
        setIsCapturing
      );
      
      if (imageDataUrl) {
        const link = document.createElement('a');
        link.download = fileName;
        link.href = imageDataUrl;
        link.click();
      }
    } catch (error) {
      console.error('이미지 저장 오류:', error);
      alert('이미지 저장에 실패했습니다.');
    }
  };

  const shareToKakao = async (
    captureRef: React.RefObject<HTMLDivElement | null>,
    slideContentRef: React.RefObject<HTMLDivElement | null>,
    fileName: string,
    setIsCapturing: (value: boolean) => void,
    shareUrl?: string
  ): Promise<void> => {
    try {
      const imageDataUrl = await captureSlideImage(
        captureRef,
        slideContentRef,
        fileName,
        setIsCapturing
      );
      
      if (imageDataUrl) {
        // base64를 Blob으로 변환
        const response = await fetch(imageDataUrl);
        const blob = await response.blob();
        const file = new File([blob], fileName, { type: 'image/png' });
        
        // Web Share API를 사용하여 이미지 공유 (모바일에서 카카오톡으로 공유 가능)
        if (navigator.share) {
          try {
            // 파일 공유 시도
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
              await navigator.share({
                title: fileName.replace('.png', ''),
                text: 'Recap을 확인해보세요!',
                files: [file],
              });
              return;
            }
          } catch (shareError: any) {
            // 파일 공유가 실패하면 텍스트만 공유 시도
            if (shareError.name !== 'AbortError') {
              console.log('파일 공유 실패, 텍스트 공유 시도:', shareError);
            }
          }
          
          // 파일 공유가 불가능한 경우 텍스트와 URL만 공유
          try {
            await navigator.share({
              title: fileName.replace('.png', ''),
              text: 'Recap을 확인해보세요!',
              url: shareUrl || window.location.href,
            });
            return;
          } catch (textShareError: any) {
            if (textShareError.name === 'AbortError') {
              return; // 사용자가 취소한 경우
            }
          }
        }
        
        // Web Share API가 없는 경우 (데스크톱 등)
        // 이미지를 다운로드하고 카카오톡 링크 공유 안내
        const link = document.createElement('a');
        link.download = fileName;
        link.href = imageDataUrl;
        link.click();
        
        // 이미지 다운로드 후 카카오톡 공유 안내
        setTimeout(() => {
          if (confirm('이미지가 다운로드되었습니다. 카카오톡으로 공유하시겠습니까?')) {
            // 카카오톡 링크 공유 (이미지는 다운로드된 파일 사용)
            if (shareUrl) {
              window.open(`https://story.kakao.com/share?url=${encodeURIComponent(shareUrl)}`, '_blank');
            } else {
              window.open('https://story.kakao.com/', '_blank');
            }
          }
        }, 500);
      }
    } catch (error) {
      console.error('카카오톡 공유 오류:', error);
      alert('공유에 실패했습니다.');
    }
  };

  const shareToInstagram = async (
    captureRef: React.RefObject<HTMLDivElement | null>,
    slideContentRef: React.RefObject<HTMLDivElement | null>,
    fileName: string,
    setIsCapturing: (value: boolean) => void
  ): Promise<void> => {
    try {
      const imageDataUrl = await captureSlideImage(
        captureRef,
        slideContentRef,
        fileName,
        setIsCapturing
      );
      
      if (imageDataUrl) {
        // base64를 Blob으로 변환
        const response = await fetch(imageDataUrl);
        const blob = await response.blob();
        const file = new File([blob], fileName, { type: 'image/png' });
        
        // 모바일에서 인스타그램 스토리로 직접 이동
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        
        if (isMobile) {
          // Web Share API를 사용하여 인스타그램으로 공유 시도
          if (navigator.share) {
            try {
              if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                  title: fileName.replace('.png', ''),
                  files: [file],
                });
                return;
              }
            } catch (shareError: any) {
              if (shareError.name === 'AbortError') {
                return; // 사용자가 취소한 경우
              }
            }
          }
          
          // Web Share API가 실패하거나 없는 경우 인스타그램 앱으로 이동
          // 인스타그램 스토리 공유를 위한 URL 스킴 시도
          try {
            // 먼저 이미지를 클립보드에 복사 시도 (iOS)
            if (navigator.clipboard && navigator.clipboard.write) {
              await navigator.clipboard.write([
                new ClipboardItem({
                  'image/png': blob
                })
              ]);
              
              // 클립보드에 복사 후 인스타그램 스토리로 이동
              setTimeout(() => {
                window.location.href = 'instagram-stories://share';
              }, 300);
              return;
            }
          } catch (clipboardError) {
            console.log('클립보드 복사 실패:', clipboardError);
          }
          
          // 클립보드 복사 실패 시 이미지 다운로드 후 인스타그램 앱으로 이동
          const link = document.createElement('a');
          link.download = fileName;
          link.href = imageDataUrl;
          link.click();
          
          setTimeout(() => {
            // 인스타그램 스토리로 이동
            window.location.href = 'instagram-stories://share';
          }, 500);
        } else {
          // 데스크톱의 경우 이미지 다운로드 후 안내
          const link = document.createElement('a');
          link.download = fileName;
          link.href = imageDataUrl;
          link.click();
          
          setTimeout(() => {
            alert('이미지가 다운로드되었습니다. 인스타그램 웹사이트에서 이미지를 업로드해주세요.');
            window.open('https://www.instagram.com/', '_blank');
          }, 500);
        }
      }
    } catch (error) {
      console.error('인스타그램 공유 오류:', error);
      alert('이미지 저장에 실패했습니다.');
    }
  };

  return {
    saveImage,
    shareToKakao,
    shareToInstagram,
  };
};

