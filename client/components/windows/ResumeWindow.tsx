import React from 'react';
import { RESUME_DATA, DownloadIcon } from '../../constants';

const ResumeWindow: React.FC = () => {
  return (
    <div className="bg-white text-black flex flex-col h-full">
        {/* Toolbar */}
        <div className="bg-[#ECE9D8] p-1 border-b border-gray-400 flex items-center">
            <a href="/cv.pdf" download="MosheMakias-CV.pdf" className="flex items-center text-xs bg-[#ECE9D8] px-2 py-1 border border-t-white border-l-white border-b-gray-500 border-r-gray-500 hover:border-t-gray-500 hover:border-l-gray-500 hover:border-b-white hover:border-r-white">
                <DownloadIcon />
                Download PDF
            </a>
        </div>
        
        {/* Document */}
        <div className="p-4 md:p-8 overflow-y-auto flex-grow">
            <h1 className="text-2xl md:text-3xl font-bold">{RESUME_DATA.name}</h1>
            <p className="text-md md:text-lg">{RESUME_DATA.title}</p>
            <p className="mt-2 text-sm">{RESUME_DATA.summary}</p>
            
            <div className="mt-4 border-b border-gray-300 pb-2">
                <h2 className="text-lg md:text-xl font-bold">Contact</h2>
                <div className="text-xs md:text-sm flex flex-col md:flex-row md:space-x-4">
                    <a href={`mailto:${RESUME_DATA.contact.email}`} className="hover:underline">Email: {RESUME_DATA.contact.email}</a>
                    <a href={RESUME_DATA.contact.linkedin} target="_blank" rel="noopener noreferrer" className="hover:underline">LinkedIn</a>
                    <a href={RESUME_DATA.contact.medium} target="_blank" rel="noopener noreferrer" className="hover:underline">Medium</a>
                </div>
            </div>

            <div className="mt-4 border-b border-gray-300 pb-2">
                <h2 className="text-lg md:text-xl font-bold">Experience</h2>
                {RESUME_DATA.experience.map((job, i) => (
                    <div key={i} className="mt-2">
                        <h3 className="font-bold">{job.role} - {job.company}</h3>
                        <p className="text-sm italic text-gray-600">{job.period}</p>
                        <ul className="list-disc list-inside text-sm mt-1 space-y-1">
                            {job.details.map((detail, j) => <li key={j}>{detail}</li>)}
                        </ul>
                    </div>
                ))}
            </div>

            <div className="mt-4">
                <h2 className="text-lg md:text-xl font-bold">Skills</h2>
                {Object.entries(RESUME_DATA.skills).map(([category, skills]) => (
                    <div key={category} className="mt-2">
                        <h3 className="font-semibold">{category}</h3>
                        <p className="text-sm">{(skills as string[]).join(', ')}</p>
                    </div>
                ))}
            </div>
             <div className="mt-4 border-t border-gray-300 pt-2">
                <h2 className="text-lg md:text-xl font-bold">Education</h2>
                <div>
                    <h3 className="font-bold">{RESUME_DATA.education.degree}</h3>
                    <p className="text-sm">{RESUME_DATA.education.institution}</p>
                    <p className="text-sm italic text-gray-600">{RESUME_DATA.education.period} (Grade: {RESUME_DATA.education.grade})</p>
                </div>
            </div>
        </div>
    </div>
  );
};

export default ResumeWindow;