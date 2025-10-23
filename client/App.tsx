import React from 'react';
import { WindowsProvider } from './context/WindowsContext';
import Desktop from './components/Desktop';
import { Taskbar } from './components/Taskbar';

const App: React.FC = () => {
  return (
    <WindowsProvider>
      <div className="bg-[#3A6EA5] h-screen w-screen overflow-hidden flex flex-col font-xp"
           style={{ backgroundImage: 'url(https://i.pinimg.com/736x/e1/61/7a/e1617a3f08ea7aacbf158288137d9ffd.jpg)', backgroundSize: 'cover' }}>
        <Desktop />
        <Taskbar />
      </div>
    </WindowsProvider>
  );
};

export default App;