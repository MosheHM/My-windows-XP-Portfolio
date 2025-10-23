import React, { useState } from 'react';

interface DesktopIconProps {
  // Fix: Use React.ReactElement<{ className?: string }> to allow cloning with a className prop.
  icon: React.ReactElement<{ className?: string }>;
  label: string;
  onDoubleClick: () => void;
}

const DesktopIcon: React.FC<DesktopIconProps> = ({ icon, label, onDoubleClick }) => {
  const [isClicked, setIsClicked] = useState(false);

  const handleClick = () => {
    setIsClicked(true);
    setTimeout(() => setIsClicked(false), 5000); // Remove selection after a while
  };

  return (
    <div
      className="flex flex-col items-center justify-start text-center md:w-24 p-1 md:p-0 cursor-pointer"
      onDoubleClick={onDoubleClick}
      onClick={handleClick}
    >
      <div className={`p-1 ${isClicked ? 'bg-blue-500 bg-opacity-50' : ''}`}>
        {React.cloneElement(icon, { className: 'w-12 h-12 md:w-10 md:h-10' })}
      </div>
      <span className={`text-white text-xs md:text-sm mt-1 p-0.5 md:p-1 md:shadow-black md:[text-shadow:1px_1px_2px_var(--tw-shadow-color)] ${isClicked ? 'bg-blue-700' : ''}`}>
        {label}
      </span>
    </div>
  );
};

export default DesktopIcon;