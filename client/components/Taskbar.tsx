import React from 'react';
import { useWindows } from '../context/WindowsContext';
import type { WindowInstance } from '../types';

export const Taskbar: React.FC = () => {
  const { windows, focusWindow } = useWindows();
  const [time, setTime] = React.useState(new Date());

  React.useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000 * 30); // Update every 30 seconds
    return () => clearInterval(timer);
  }, []);
  
  // Fix: Add explicit type to 'openWindows' to resolve type inference issues.
  const openWindows: WindowInstance[] = Object.values(windows);

  return (
    <footer className="h-8 bg-gradient-to-b from-[#245EDC] to-[#498AF2] border-t border-t-[#5993FF] w-full hidden md:flex items-center justify-between px-1 shrink-0">
      <div className="flex items-center">
        {/* Start Button */}
        <button className="bg-gradient-to-b from-[#74E369] to-[#25911A] text-white font-bold italic text-lg rounded-r-full rounded-l-md px-4 py-0 flex items-center border-t border-t-white/80 border-l border-l-white/80 border-b border-b-black/50 border-r border-r-black/50 shadow-md h-[26px]">
          <span className="text-white [text-shadow:1px_1px_2px_#000]">start</span>
        </button>

        {/* Window Tabs */}
        <div className="flex items-center ml-2 space-x-1">
          {openWindows.map(win => (
            <button
              key={win.id}
              onClick={() => focusWindow(win.id)}
              className={`flex items-center text-sm px-2 py-0.5 max-w-40 h-[22px] border ${
                win.isMinimized ? 'bg-[#2959CE]' : 'bg-[#4076E2] shadow-lg'
              } border-t-[#6FA1F3] border-l-[#6FA1F3] border-b-[#002C8A] border-r-[#002C8A] text-white truncate`}
            >
              <div className="w-4 h-4 mr-1">{win.icon}</div>
              <span>{win.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Clock */}
      <div className="bg-[#279344] h-[22px] px-2 flex items-center border-t border-l border-[#61B56F] border-b border-r border-[#156024] text-white text-xs">
        <span>{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
      </div>
    </footer>
  );
};