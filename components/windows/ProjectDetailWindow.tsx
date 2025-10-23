import React from 'react';
import type { Project } from '../../types';
import { LinkIcon } from '../../constants';

interface ProjectDetailProps {
  project: Project;
}

const ProjectDetailWindow: React.FC<ProjectDetailProps> = ({ project }) => {
  if (!project) return <div>Project not found.</div>;

  return (
    <div className="bg-white text-black flex flex-col overflow-hidden h-full">
      <div className="bg-[#ECE9D8] p-1 border-b border-gray-400 flex space-x-2">
        {project.liveLink && (
            <a href={project.liveLink} target="_blank" rel="noopener noreferrer" className="flex items-center text-xs bg-[#ECE9D8] px-2 py-1 border border-t-white border-l-white border-b-gray-500 border-r-gray-500 hover:border-t-gray-500 hover:border-l-gray-500 hover:border-b-white hover:border-r-white">
                <LinkIcon />
                Live Demo
            </a>
        )}
        {project.repoLink && (
            <a href={project.repoLink} target="_blank" rel="noopener noreferrer" className="flex items-center text-xs bg-[#ECE9D8] px-2 py-1 border border-t-white border-l-white border-b-gray-500 border-r-gray-500 hover:border-t-gray-500 hover:border-l-gray-500 hover:border-b-white hover:border-r-white">
                <LinkIcon />
                GitHub Repo
            </a>
        )}
      </div>

      <div className="p-4 overflow-y-auto flex-grow">
        <h2 className="text-2xl font-bold mb-2">{project.name}</h2>
        <p className="text-gray-700 mb-4">{project.longDescription}</p>

        <h3 className="font-bold text-lg mb-2">Tech Stack</h3>
        <div className="flex flex-wrap gap-2 mb-4">
            {project.techStack.map(tech => (
                <span key={tech} className="bg-gray-200 text-gray-800 text-xs font-semibold mr-2 px-2.5 py-0.5 rounded-full">{tech}</span>
            ))}
        </div>

        <h3 className="font-bold text-lg mb-2">Screenshots</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {project.screenshots.map((src, index) => (
                <img key={index} src={src} alt={`${project.name} screenshot ${index + 1}`} className="rounded border border-gray-300" />
            ))}
        </div>
      </div>
    </div>
  );
};

export default ProjectDetailWindow;