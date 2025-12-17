import html2canvas from 'html2canvas';

interface OriginalStyle {
  element: HTMLElement;
  opacity: string;
  animation: string;
  maxHeight?: string;
  overflow?: string;
  height?: string;
  backgroundColor?: string;
  borderColor?: string;
}

// oklab/oklch 색상을 RGB로 변환하는 헬퍼 함수
const convertOklabToRgb = (color: string): string | null => {
  // oklab/oklch 색상을 간단히 처리 - 실제 변환은 복잡하므로 기본 색상 사용
  if (color.includes('oklab') || color.includes('oklch')) {
    // 투명도 추출
    const alphaMatch = color.match(/[\d.]+\)$/);
    const alpha = alphaMatch ? parseFloat(alphaMatch[0].replace(')', '')) : 1;
    
    // 기본 색상으로 변환 (흰색 계열)
    if (color.includes('white')) {
      return `rgba(255, 255, 255, ${alpha})`;
    }
    // 기본값
    return `rgba(255, 255, 255, ${alpha * 0.1})`;
  }
  return null;
};

// 슬라이드 내용 준비 (opacity, 스크롤, 색상 처리)
export const prepareSlideForCapture = (
  slideContent: HTMLElement
): OriginalStyle[] => {
  const allElements = slideContent.querySelectorAll('*') as NodeListOf<HTMLElement>;
  const originalStyles: OriginalStyle[] = [];
  
  // 모든 요소의 opacity를 1로 설정하고 원래 스타일 저장
  allElements.forEach(element => {
    const computedStyle = window.getComputedStyle(element);
    const opacity = computedStyle.opacity;
    
    // opacity 처리
    if (opacity === '0' || element.style.opacity === '0' || element.classList.contains('opacity-0')) {
      originalStyles.push({
        element,
        opacity: element.style.opacity || '',
        animation: element.style.animation || ''
      });
      element.style.opacity = '1';
      element.style.animation = 'none';
      element.classList.remove('opacity-0');
    }
    
    // 스크롤 컨테이너 처리 (max-height, overflow 제거하여 모든 내용 표시)
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
    
    // oklab/oklch 색상 문제 해결: 배경색과 테두리 색상을 RGB로 변환
    const bgColor = computedStyle.backgroundColor;
    const borderColor = computedStyle.borderColor;
    
    if (bgColor && (bgColor.includes('oklab') || bgColor.includes('oklch'))) {
      const rgbColor = convertOklabToRgb(bgColor);
      if (rgbColor) {
        const existingStyle = originalStyles.find(s => s.element === element);
        if (existingStyle) {
          existingStyle.backgroundColor = element.style.backgroundColor || '';
        } else {
          originalStyles.push({
            element,
            opacity: element.style.opacity || '',
            animation: element.style.animation || '',
            backgroundColor: element.style.backgroundColor || ''
          });
        }
        element.style.backgroundColor = rgbColor;
      }
    }
    
    if (borderColor && (borderColor.includes('oklab') || borderColor.includes('oklch'))) {
      const rgbColor = convertOklabToRgb(borderColor);
      if (rgbColor) {
        const existingStyle = originalStyles.find(s => s.element === element);
        if (existingStyle) {
          existingStyle.borderColor = element.style.borderColor || '';
        } else {
          originalStyles.push({
            element,
            opacity: element.style.opacity || '',
            animation: element.style.animation || '',
            borderColor: element.style.borderColor || ''
          });
        }
        element.style.borderColor = rgbColor;
      }
    }
  });
  
  return originalStyles;
};

// 원래 상태로 복원
export const restoreSlideStyles = (originalStyles: OriginalStyle[]) => {
  originalStyles.forEach(({ element, opacity, animation, maxHeight, overflow, height, backgroundColor, borderColor }) => {
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
    if (backgroundColor !== undefined) {
      element.style.backgroundColor = backgroundColor;
    }
    if (borderColor !== undefined) {
      element.style.borderColor = borderColor;
    }
    if (!opacity) {
      element.classList.add('opacity-0');
    }
    if (maxHeight === '' && overflow === '') {
      element.classList.add('max-h-64', 'overflow-y-auto');
    }
  });
};

// 이미지 캡처 함수
export const captureSlideAsImage = async (
  captureRef: React.RefObject<HTMLDivElement>,
  slideContentRef: React.RefObject<HTMLDivElement>,
  fileName: string,
  onCapturingChange?: (isCapturing: boolean) => void
): Promise<string | null> => {
  if (!captureRef.current || !slideContentRef.current) return null;
  
  onCapturingChange?.(true);
  
  try {
    // 애니메이션 일시 정지 및 버튼 숨기기
    const buttons = document.querySelectorAll('[data-exclude-from-capture]');
    buttons.forEach(btn => {
      (btn as HTMLElement).style.display = 'none';
    });
    
    // 슬라이드 내용 준비
    const originalStyles = prepareSlideForCapture(slideContentRef.current);
    
    // SVG 요소 처리 (차트 등)
    const svgElements = slideContentRef.current.querySelectorAll('svg');
    svgElements.forEach(svg => {
      // SVG의 외부 리소스 로드 대기
      const images = svg.querySelectorAll('image');
      images.forEach(img => {
        if (img.getAttribute('href') || img.getAttribute('xlink:href')) {
          // 외부 이미지가 있으면 처리
        }
      });
    });
    
    // 잠시 대기하여 렌더링 완료 대기 (스크롤 제거 후 높이 재계산)
    await new Promise(resolve => setTimeout(resolve, 500));
    
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
      onclone: (clonedDoc) => {
        // 복제된 문서에서 SVG 요소 처리
        const clonedSvgs = clonedDoc.querySelectorAll('svg');
        clonedSvgs.forEach(svg => {
          // SVG 스타일 강제 적용
          svg.setAttribute('style', 'display: block;');
          const svgElements = svg.querySelectorAll('*');
          svgElements.forEach(el => {
            const htmlEl = el as HTMLElement;
            const computedStyle = window.getComputedStyle(el);
            // SVG 내부 요소의 색상이 oklab인 경우 처리
            const fill = computedStyle.fill;
            const stroke = computedStyle.stroke;
            
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

