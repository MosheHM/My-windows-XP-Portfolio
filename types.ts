import React from 'react';

export interface WindowInstance {
  id: string;
  title: string;
  // Fix: Use React.ReactElement instead of JSX.Element
  icon: React.ReactElement;
  isMinimized: boolean;
  isMaximized: boolean;
  position: { x: number; y: number };
  size: { width: number; height: number };
  zIndex: number;
  Content: React.FC<any>; 
  contentProps?: any;
}

export interface WindowContextType {
  windows: Record<string, WindowInstance>;
  openWindow: (id: string, props?: any) => void;
  closeWindow: (id: string) => void;
  minimizeWindow: (id: string) => void;
  toggleMaximize: (id: string) => void;
  focusWindow: (id: string) => void;
  updateWindowPosition: (id: string, x: number, y: number) => void;
}

export type Project = {
  id: string;
  name: string;
  // Fix: Use React.ReactElement<{ className?: string }> to allow cloning with a className prop.
  icon: React.ReactElement<{ className?: string }>;
  description: string;
  longDescription: string;
  screenshots: string[];
  techStack: string[];
  liveLink?: string;
  repoLink?: string;
};

export type Blog = {
  title: string;
  url: string;
};