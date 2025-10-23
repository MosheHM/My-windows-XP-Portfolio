import React from 'react';
import { PROJECTS_DATA } from '../../constants';
import { useWindows } from '../../context/WindowsContext';

const ProjectsWindow: React.FC = () => {
  const { openWindow } = useWindows();

  const handleProjectClick = (project: (typeof PROJECTS_DATA)[0]) => {
    openWindow('projectDetail', { project });
  };

  return (
    <div className="bg-white h-full p-4 grid grid-cols-3 md:flex md:flex-wrap gap-4 items-start content-start">
      {PROJECTS_DATA.map(project => (
        <div
          key={project.id}
          onDoubleClick={() => handleProjectClick(project)}
          className="flex flex-col items-center text-center cursor-pointer hover:bg-blue-200 p-2 rounded"
        >
          {React.cloneElement(project.icon, { className: 'w-10 h-10' })}
          <span className="text-xs mt-1">{project.name}</span>
        </div>
      ))}
    </div>
  );
};

export default ProjectsWindow;