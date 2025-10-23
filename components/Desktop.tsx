import React, { useRef, useState, useEffect } from 'react';
import DesktopIcon from './DesktopIcon';
import Window from './Window';
import { useWindows } from '../context/WindowsContext';
import { WordIcon, FolderIcon, CmdIcon, AndroidIcon } from '../constants';
import type { WindowInstance } from '../types';

const Desktop: React.FC = () => {
  const { windows, openWindow } = useWindows();
  const desktopRef = useRef<HTMLDivElement>(null);
  
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timerId = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timerId);
  }, []);
  
  const formattedTime = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const formattedDate = time.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' });
  
  const icons = (
    <>
      <DesktopIcon icon={<FolderIcon />} label="About Me" onDoubleClick={() => openWindow('about')} />
      <DesktopIcon icon={<WordIcon />} label="CV/Resume" onDoubleClick={() => openWindow('resume')} />
      <DesktopIcon icon={<FolderIcon />} label="Projects" onDoubleClick={() => openWindow('projects')} />
      <DesktopIcon icon={<CmdIcon />} label="AI Chat" onDoubleClick={() => openWindow('chat')} />
    </>
  );

  return (
    <main ref={desktopRef} className="flex-grow relative h-full w-full md:bg-transparent overflow-hidden">
      
      {/* --- Mobile View --- */}
      <div 
        className="md:hidden flex flex-col h-full" 
        style={{ 
          backgroundImage: `url('https://i.imgur.com/gO9kP9G.png')`,
          backgroundSize: 'cover', 
          backgroundPosition: 'center' 
        }}
      >
        <div className="pt-8 px-4 text-center text-white font-sans">
            <p className="text-6xl font-thin tracking-wider">{formattedTime}</p>
            <p className="text-md opacity-80">{formattedDate}</p>
        </div>
        <div className="flex-grow p-4 pt-8">
            <div className="grid grid-cols-4 gap-y-4 gap-x-2">
                {icons}
            </div>
        </div>
        <div className="pb-4 flex justify-center">
            <AndroidIcon className="h-8 w-8" />
        </div>
      </div>

      {/* --- Desktop View --- */}
      <div className="hidden md:block p-4">
        <div className="flex flex-col items-start space-y-4">
            {icons}
        </div>
      </div>
      
      {/* Fix: Add explicit type to 'win' to resolve type inference issues with Object.values() */}
      {Object.values(windows).map((win: WindowInstance) => (
         <Window key={win.id} {...win} boundsRef={desktopRef} />
      ))}
    </main>
  );
};

export default Desktop;