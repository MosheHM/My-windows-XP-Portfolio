import React, { createContext, useState, useCallback, useContext, ReactNode } from 'react';
import type { WindowInstance, WindowContextType } from '../types';
import AboutMeWindow from '../components/windows/AboutMeWindow';
import ResumeWindow from '../components/windows/ResumeWindow';
import ProjectsWindow from '../components/windows/ProjectsWindow';
import ChatWindow from '../components/windows/ChatWindow';
import ProjectDetailWindow from '../components/windows/ProjectDetailWindow';
import { WordIcon, FolderIcon, CmdIcon } from '../constants';

// Fix: Add missing `size` property to defaultProps to match the WindowInstance type.
const WINDOW_COMPONENTS: Record<string, { Content: React.FC<any>, defaultProps: Omit<WindowInstance, 'isMinimized' | 'isMaximized' | 'position' | 'zIndex' | 'Content' | 'contentProps'> }> = {
  about: { Content: AboutMeWindow, defaultProps: { id: 'about', title: 'About Me', icon: <FolderIcon />, size: { width: 500, height: 400 } } },
  resume: { Content: ResumeWindow, defaultProps: { id: 'resume', title: 'CV-Resume.doc', icon: <WordIcon />, size: { width: 600, height: 500 } } },
  projects: { Content: ProjectsWindow, defaultProps: { id: 'projects', title: 'My Projects', icon: <FolderIcon />, size: { width: 500, height: 400 } } },
  chat: { Content: ChatWindow, defaultProps: { id: 'chat', title: 'Command Prompt', icon: <CmdIcon />, size: { width: 640, height: 400 } } },
  projectDetail: { Content: ProjectDetailWindow, defaultProps: { id: 'projectDetail', title: 'Project Details', icon: <FolderIcon />, size: { width: 640, height: 480 } } },
};

const WindowsContext = createContext<WindowContextType | undefined>(undefined);

// Fix: Explicitly type WindowsProvider as a React.FC with children to solve type inference issues.
export const WindowsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [windows, setWindows] = useState<Record<string, WindowInstance>>({});
  const [focusOrder, setFocusOrder] = useState<string[]>([]);

  const getTopZIndex = useCallback(() => {
    if (focusOrder.length === 0) return 10;
    const topWindowId = focusOrder[focusOrder.length - 1];
    return windows[topWindowId]?.zIndex ?? 10;
  }, [focusOrder, windows]);

  const focusWindow = useCallback((id: string) => {
    setFocusOrder(prev => [...prev.filter(winId => winId !== id), id]);
    setWindows(prev => {
      const newZ = getTopZIndex() + 1;
      return {
        ...prev,
        [id]: { ...prev[id], zIndex: newZ, isMinimized: false },
      };
    });
  }, [getTopZIndex]);

  const openWindow = useCallback((id: string, props: any = {}) => {
    const windowId = id === 'projectDetail' ? `projectDetail-${props.project.id}` : id;

    setWindows(prev => {
      const windowConfig = WINDOW_COMPONENTS[id];
      if (!windowConfig) return prev;

      const existingWindow = prev[windowId];
      if (existingWindow) {
        focusWindow(windowId);
        return {
          ...prev,
          [windowId]: { ...existingWindow, isMinimized: false }
        }
      }

      // Fix: Removed `isOpen` which is not in WindowInstance type, and removed redundant `size` property.
      const newWindow: WindowInstance = {
        ...windowConfig.defaultProps,
        id: windowId,
        title: id === 'projectDetail' ? props.project.name : windowConfig.defaultProps.title,
        isMinimized: false,
        isMaximized: false,
        position: { x: Math.random() * 200 + 50, y: Math.random() * 100 + 20 },
        zIndex: getTopZIndex() + 1,
        Content: windowConfig.Content,
        contentProps: props,
      };
      
      setFocusOrder(prevOrder => [...prevOrder, windowId]);
      return { ...prev, [windowId]: newWindow };
    });
  }, [getTopZIndex, focusWindow]);

  const closeWindow = useCallback((id: string) => {
    setWindows(prev => {
      const newWindows = { ...prev };
      delete newWindows[id];
      return newWindows;
    });
    setFocusOrder(prev => prev.filter(winId => winId !== id));
  }, []);

  const minimizeWindow = useCallback((id: string) => {
    setWindows(prev => ({
      ...prev,
      [id]: { ...prev[id], isMinimized: true },
    }));
  }, []);

  const toggleMaximize = useCallback((id: string) => {
    setWindows(prev => ({
      ...prev,
      [id]: { ...prev[id], isMaximized: !prev[id].isMaximized },
    }));
    focusWindow(id);
  }, [focusWindow]);

  const updateWindowPosition = useCallback((id: string, x: number, y: number) => {
    setWindows(prev => ({
      ...prev,
      [id]: { ...prev[id], position: { x, y } },
    }));
  }, []);

  return (
    <WindowsContext.Provider value={{ windows, openWindow, closeWindow, minimizeWindow, toggleMaximize, focusWindow, updateWindowPosition }}>
      {children}
    </WindowsContext.Provider>
  );
};

export const useWindows = () => {
  const context = useContext(WindowsContext);
  if (!context) {
    throw new Error('useWindows must be used within a WindowsProvider');
  }
  return context;
};