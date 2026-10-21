import React, { useEffect, useRef, useState } from 'react';

export const MagicCursor: React.FC = () => {
  const cursorRef = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  useEffect(() => {
    // Hide default cursor across all elements
    document.documentElement.style.cursor = 'none';
    document.body.style.cursor = 'none';

    let lastX = -100;
    let lastY = -100;
    let ticking = false;

    const updatePosition = () => {
      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate3d(${lastX}px, ${lastY}px, 0) translate(-50%, -50%)${
          isPressed ? ' scale(0.8)' : ''
        }`;
      }
      ticking = false;
    };

    const handlePointerMove = (e: PointerEvent | MouseEvent) => {
      lastX = e.clientX;
      lastY = e.clientY;

      if (!isVisible) setIsVisible(true);

      if (!ticking) {
        requestAnimationFrame(updatePosition);
        ticking = true;
      }

      // Check if target is an interactive clickable element
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.closest('a') ||
          target.closest('button') ||
          target.closest('input') ||
          target.closest('textarea') ||
          target.closest('select') ||
          target.closest('[role="button"]') ||
          target.closest('.cursor-pointer') ||
          target.closest('.envelope-container') ||
          target.closest('.secret-whisper') ||
          target.closest('.menu-item') ||
          target.closest('.magic-btn') ||
          target.closest('.music-player') ||
          target.classList.contains('cursor-pointer'))
      ) {
        setIsHovered(true);
      } else {
        setIsHovered(false);
      }
    };

    const handlePointerDown = () => setIsPressed(true);
    const handlePointerUp = () => setIsPressed(false);
    const handleMouseLeave = () => setIsVisible(false);
    const handleMouseEnter = () => setIsVisible(true);

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('mousemove', handlePointerMove, { passive: true });
    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointerup', handlePointerUp);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointerup', handlePointerUp);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
    };
  }, [isVisible, isPressed]);

  return (
    <div
      ref={cursorRef}
      id="magic-cursor"
      className={`${isHovered ? 'cursor-hover' : ''} ${isPressed ? 'cursor-active' : ''}`}
      style={{
        opacity: isVisible ? 1 : 0,
        pointerEvents: 'none',
      }}
      aria-hidden="true"
    />
  );
};
