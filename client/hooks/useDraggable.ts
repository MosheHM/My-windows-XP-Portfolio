import { useState, useCallback, useRef, useEffect, RefObject, MouseEvent as ReactMouseEvent } from 'react';

interface DraggableOptions {
  onDrag: (x: number, y: number) => void;
  initialPosition: { x: number; y: number };
  boundsRef?: RefObject<HTMLElement>;
}

export const useDraggable = ({ onDrag, initialPosition, boundsRef }: DraggableOptions) => {
  const [isDragging, setIsDragging] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const elementStartPos = useRef({ x: initialPosition.x, y: initialPosition.y });
  const elementRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: ReactMouseEvent<HTMLDivElement>) => {
    if (window.innerWidth < 768) return; // Disable drag on mobile
    e.preventDefault();
    setIsDragging(true);
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    if (elementRef.current) {
        const rect = elementRef.current.getBoundingClientRect();
        // This is a rough estimation. For perfect drag, it should be based on position prop
        elementStartPos.current = { x: initialPosition.x, y: initialPosition.y };
    }
  }, [initialPosition]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    
    const dx = e.clientX - dragStartPos.current.x;
    const dy = e.clientY - dragStartPos.current.y;
    
    let newX = elementStartPos.current.x + dx;
    let newY = elementStartPos.current.y + dy;
    
    if (boundsRef?.current && elementRef.current) {
        const boundsRect = boundsRef.current.getBoundingClientRect();
        const elRect = elementRef.current.getBoundingClientRect();
        
        newX = Math.max(0, Math.min(newX, boundsRect.width - elRect.width));
        newY = Math.max(0, Math.min(newY, boundsRect.height - elRect.height));
    }
    
    onDrag(newX, newY);
  }, [isDragging, onDrag, boundsRef]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);
  
  return { handleMouseDown, elementRef };
};