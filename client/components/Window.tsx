import React from 'react';
import type { WindowInstance } from '../types';
import { useWindows } from '../context/WindowsContext';
import { useDraggable } from '../hooks/useDraggable';

interface WindowProps extends WindowInstance {
  boundsRef: React.RefObject<HTMLElement>;
}

const Window: React.FC<WindowProps> = ({ id, title, icon, isMinimized, isMaximized, position, zIndex, Content, contentProps, size, boundsRef }) => {
  const { closeWindow, minimizeWindow, toggleMaximize, focusWindow, updateWindowPosition } = useWindows();
  
  const { handleMouseDown, elementRef } = useDraggable({
    initialPosition: position,
    onDrag: (x, y) => updateWindowPosition(id, x, y),
    boundsRef: boundsRef,
  });
  
  if (isMinimized) return null;

  const windowStyle = {
      zIndex,
      '--window-top': `${position.y}px`,
      '--window-left': `${position.x}px`,
      '--window-width': `${size.width}px`,
      '--window-height': `${size.height}px`,
  };

  return (
    <div
      ref={elementRef}
      className={`flex flex-col bg-[#ECE9D8] z-10
          /* Mobile styles: fixed and fullscreen */
          fixed top-0 left-0 w-full h-full
          /* Desktop base styles: absolute and sized via CSS vars */
          md:absolute md:top-[var(--window-top)] md:left-[var(--window-left)] md:w-[var(--window-width)] md:h-[var(--window-height)]
          md:rounded-t-lg md:shadow-2xl md:border md:border-t-[#0831D9] md:border-l-[#0831D9] md:border-b-white md:border-r-white
          /* Desktop maximized styles */
          ${isMaximized ? 'md:top-0 md:left-0 md:w-full md:h-full' : ''}
      `}
      style={windowStyle}
      onMouseDown={() => focusWindow(id)}
    >
      {/* Title Bar */}
      <div
        className="h-10 md:h-7 bg-[#333] md:bg-gradient-to-b md:from-[#0055E3] md:to-[#3985FF] flex items-center justify-between px-1 md:rounded-t-md text-white font-bold text-sm md:cursor-grab md:active:cursor-grabbing"
        onMouseDown={!isMaximized ? handleMouseDown : undefined}
      >
        <div className="flex items-center gap-1">
          <div className="w-5 h-5">{icon}</div>
          <span>{title}</span>
        </div>
        <div className="flex items-center space-x-1">
          {/* Minimize */}
          <button onClick={() => minimizeWindow(id)} className="w-6 h-6 bg-[#3582FF] border border-t-white/80 border-l-white/80 border-r-black/50 border-b-black/50 hidden md:flex items-center justify-center text-black font-bold text-lg">_</button>
          {/* Maximize */}
          <button onClick={() => toggleMaximize(id)} className="w-6 h-6 bg-[#3582FF] border border-t-white/80 border-l-white/80 border-r-black/50 border-b-black/50 hidden md:flex items-center justify-center">
            <div className="w-3 h-3 border-2 border-black" />
          </button>
          {/* Close */}
          <button onClick={() => closeWindow(id)} className="w-8 h-8 md:w-6 md:h-6 bg-transparent md:bg-[#E52213] border-none md:border md:border-t-white/80 md:border-l-white/80 md:border-r-black/50 md:border-b-black/50 flex items-center justify-center text-white font-bold text-2xl md:text-base">
            <span className="hidden md:block">X</span>
            <span className="md:hidden">&times;</span>
          </button>
        </div>
      </div>
      
      {/* Content */}
      <div className="p-0.5 bg-[#ECE9D8] flex-grow overflow-y-auto">
          <Content {...contentProps} />
      </div>
    </div>
  );
};

export default Window;