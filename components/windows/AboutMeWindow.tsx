import React from 'react';
import { BLOG_POSTS } from '../../constants';
import { useWindows } from '../../context/WindowsContext';

const ShortcutIcon = () => (
    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z" fill="#F3F3F3"/>
      <path d="M14 2V8H20L14 2Z" fill="#D1D1D1"/>
      <path d="M9 14H15" stroke="#3A88F7" strokeWidth="2" strokeLinecap="round"/>
      <path d="M9 17H12" stroke="#3A88F7" strokeWidth="2" strokeLinecap="round"/>
      <rect x="5.5" y="1.5" width="2" height="2" rx="0.5" fill="#3A88F7"/>
    </svg>
);
  
const AboutMeWindow: React.FC = () => {
  const { openWindow } = useWindows();

  const handlePostDoubleClick = (post: typeof BLOG_POSTS[0]) => {
    openWindow('internetExplorer', { url: post.url, title: post.title });
  };

  return (
    <div className="bg-white h-full p-4 grid grid-cols-3 md:flex md:flex-wrap gap-4 items-start content-start">
        {BLOG_POSTS.map(post => (
            <div
                key={post.title}
                onDoubleClick={() => handlePostDoubleClick(post)}
                className="flex flex-col items-center text-center cursor-pointer hover:bg-blue-200 p-2 rounded"
            >
                <ShortcutIcon />
                <span className="text-xs mt-1">{post.title}</span>
            </div>
        ))}
    </div>
  );
};

export default AboutMeWindow;