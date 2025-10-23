import React from 'react';
import { LinkIcon } from '../../constants';

interface InternetExplorerProps {
  url: string;
  title: string;
}

const InternetExplorerWindow: React.FC<InternetExplorerProps> = ({ url, title }) => {
  return (
    <div className="bg-[#ECE9D8] text-black flex flex-col h-full">
      {/* Toolbar */}
      <div className="bg-[#ECE9D8] p-1 border-b-2 border-b-gray-400 flex items-center gap-2">
        <label htmlFor="address-bar" className="text-gray-500 text-sm pl-1">Address</label>
        <div id="address-bar" className="flex-grow bg-white border border-gray-500 h-6 px-1 text-sm flex items-center">
            {url}
        </div>
      </div>
      
      {/* Content */}
      <div className="p-8 flex-grow bg-white flex flex-col items-center justify-center text-center">
        <h1 className="text-lg font-bold mb-2">{title}</h1>
        <p className="mb-4 text-sm text-gray-700">
            This content cannot be displayed in a frame. To help protect the security of information you enter into this website, the publisher of this content does not allow it to be displayed in a frame.
        </p>
        <a 
            href={url} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="flex items-center text-sm bg-gray-200 px-3 py-1 border border-t-white border-l-white border-b-gray-500 border-r-gray-500 hover:border-t-gray-500 hover:border-l-gray-500 hover:border-b-white hover:border-r-white"
        >
            <LinkIcon />
            Open this content in a new window
        </a>
      </div>
    </div>
  );
};

export default InternetExplorerWindow;