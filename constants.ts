import React from 'react';
import type { Project, Blog } from './types';

// Icons
// Fix: Converted JSX to React.createElement calls to be valid in a .ts file.
export const FolderIcon = ({ className = 'w-8 h-8' }: { className?: string }): React.ReactElement => (
  React.createElement('svg', { className, viewBox: "0 0 24 24", fill: "none", xmlns: "http://www.w3.org/2000/svg" },
    React.createElement('path', { d: "M4 5C4 4.44772 4.44772 4 5 4H10.5858C10.851 4 11.1054 4.10536 11.2929 4.29289L13 6H19C20.1046 6 21 6.89543 21 8V18C21 19.1046 20.1046 20 19 20H5C3.89543 20 3 19.1046 3 18V7C3 5.89543 3.89543 5 5 5H4Z", fill: "#FFC107" }),
    React.createElement('path', { d: "M2 7H22V9H2V7Z", fill: "#FFD54F" }),
    React.createElement('path', { d: "M4 19.5L20 19.5", stroke: "#E6A200", strokeWidth: "1", strokeLinecap: "round" })
  )
);

// Fix: Converted JSX to React.createElement calls.
export const WordIcon = ({ className = 'w-8 h-8' }: { className?: string }): React.ReactElement => (
  React.createElement('svg', { className, viewBox: "0 0 24 24", fill: "none", xmlns: "http://www.w3.org/2000/svg" },
    React.createElement('path', { d: "M6 2H18L22 6V20C22 21.1046 21.1046 22 20 22H4C2.89543 22 2 21.1046 2 20V4C2 2.89543 2.89543 2 4 2H6Z", fill: "#295393" }),
    React.createElement('path', { d: "M18 2V6H22L18 2Z", fill: "#1C3A66" }),
    React.createElement('path', { d: "M15 11L12.5 19L10 11H8L11.5 21L17 11H15Z", fill: "white" })
  )
);

// Fix: Converted JSX to React.createElement calls.
export const CmdIcon = ({ className = 'w-8 h-8' }: { className?: string }): React.ReactElement => (
  React.createElement('svg', { className, viewBox: "0 0 24 24", fill: "none", xmlns: "http://www.w3.org/2000/svg" },
    React.createElement('rect', { width: "24", height: "24", rx: "3", fill: "black" }),
    React.createElement('path', { d: "M6 8L10 12L6 16", stroke: "white", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }),
    React.createElement('path', { d: "M12 17H18", stroke: "white", strokeWidth: "2", strokeLinecap: "round" })
  )
);

export const AndroidIcon = ({ className = 'w-8 h-8' }: { className?: string }): React.ReactElement => (
    React.createElement('svg', { className, viewBox: "0 0 24 24", fill: "none", xmlns: "http://www.w3.org/2000/svg" },
        React.createElement('g', { fill: '#A4C639' },
            React.createElement('path', { d: 'M15.5 4.5a.94.94 0 0 0-1-.95.94.94 0 0 0-1 .95V5h2v-.5zM8.5 4.5a.94.94 0 0 0-1-.95.94.94 0 0 0-1 .95V5h2v-.5z' }),
            React.createElement('path', { d: 'M18 6.5h-1.5v-1a2.49 2.49 0 0 0-2.5-2.5A2.49 2.49 0 0 0 11.5 3H10a2.49 2.49 0 0 0-2.5-2.5A2.49 2.49 0 0 0 5 3v2.5H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h1v1.5a2.5 2.5 0 0 0 5 0V17.5h2v1.5a2.5 2.5 0 0 0 5 0V17.5h1a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2zM8 10.5a1 1 0 1 1-1-1 1 1 0 0 1 1 1zm7 0a1 1 0 1 1-1-1 1 1 0 0 1 1 1z' })
        )
    )
);

// Fix: Converted JSX to React.createElement calls.
export const DownloadIcon = (): React.ReactElement => (
    React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", className: "h-4 w-4 mr-1", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor" },
      React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" })
    )
);

// Fix: Converted JSX to React.createElement calls.
export const LinkIcon = (): React.ReactElement => (
  React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", className: "h-4 w-4 mr-1", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor" },
    React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" })
  )
);

// Data
export const RESUME_DATA = {
  name: "Moshe Haim Makias",
  title: "Full Stack Engineer",
  summary: "Full Stack Engineer with experience designing and implementing scalable web applications across React, TypeScript, and backend architectures. Skilled in building modular systems, optimizing performance, and integrating real-time communication protocols. Combines strong system-level thinking with frontend craftsmanship to deliver reliable, user-centered, production-ready software. Experienced with Docker, Kubernetes, AWS, and CI/CD (Jenkins) pipelines. Passionate about scalable architectures, clean code, and continuous learning.",
  contact: {
    email: "mhm23811@gmail.com",
    linkedin: "https://www.linkedin.com/in/moshe-haim-makias/",
    medium: "https://medium.com/",
    phone: "050-348-0946",
  },
  experience: [
    {
      company: "Methodz",
      role: "Frontend Infrastructure Engineer",
      period: "September 2025 – Present",
      details: [
        "Architecting a dynamic rendering infrastructure enabling multi-team component integration and live visualization.",
        "Building Angular-based playground environments supporting real-time updates for internal development workflows.",
        "Collaborating with backend and DevOps teams to align component pipelines with CI/CD best practices.",
        "Improved frontend build efficiency by 20% through modularization and caching strategy refinement.",
      ],
    },
    {
      company: "Elbit Systems Israel",
      role: "Full Stack Engineer",
      period: "July 2023 – September 2025",
      details: [
        "Designed and implemented secure communication and data synchronization systems for real-time, mission-critical applications.",
        "Developed full-stack modules integrating backend logic and responsive frontend interfaces in high-reliability environments.",
        "Led R&D efforts building a code generation framework from spec to runtime components, improving development efficiency.",
        "Optimized data serialization and transport protocols, reducing latency and increasing performance reliability.",
      ],
    },
    {
      company: "MeGo - Haredi Tech Training Initiative",
      role: "Teaching Assistant & Mentor",
      period: "September 2022 – October 2023",
      details: [
          "Mentored programming and math study groups, creating culturally adapted learning paths.",
          "Supported over 50 students in mastering modern software engineering foundations and job-readiness preparation.",
          "Developed teaching materials focused on full-stack fundamentals and software design principles.",
      ]
    },
    {
        company: "Israel Tax Authority",
        role: "Student Intern - Real Estate Taxation Department",
        period: "March 2021 - October 2022",
        details: [
            "Assisted department management in operational decision-making and case analysis.",
            "Supported digital transformation initiatives and cross-department data process improvement.",
        ]
    }
  ],
  skills: {
    "Frontend": ["React", "TypeScript", "Redux Toolkit", "AngularJS"],
    "Backend": ["Node.js", "Express", "REST APIs", "Python", "Java", "C++"],
    "Databases": ["PostgreSQL", "Elastic-search"],
    "DevOps & Cloud": ["Docker", "Kubernetes", "Jenkins", "AWS"],
    "Systems & Architecture": ["Scalable infrastructure design", "API development", "communication protocols"],
    "Soft Skills": ["Ownership mindset", "collaboration across teams", "architectural problem-solving"],
  },
   education: {
    degree: "B.Sc. in Computer Science",
    institution: "The College of Management Academic Studies",
    period: "2020 - 2023",
    grade: "95+",
  },
};

export const PROJECTS_DATA: Project[] = [
  {
    id: 'project-insight',
    name: 'Project Insight',
    // Fix: Use React.createElement instead of JSX for component instantiation.
    icon: React.createElement(FolderIcon),
    description: 'A data visualization dashboard for business intelligence.',
    longDescription: 'Project Insight is a powerful, real-time business intelligence dashboard built to help companies make data-driven decisions. It connects to various data sources, processes information on the fly, and presents it through interactive charts and graphs. The architecture is designed for high-performance and scalability.',
    screenshots: ['https://picsum.photos/seed/insight1/600/400', 'https://picsum.photos/seed/insight2/600/400'],
    techStack: ['React', 'D3.js', 'Node.js', 'Express', 'PostgreSQL', 'WebSocket'],
    liveLink: '#',
    repoLink: '#',
  },
  {
    id: 'dev-connect',
    name: 'DevConnect',
    // Fix: Use React.createElement instead of JSX for component instantiation.
    icon: React.createElement(FolderIcon),
    description: 'A social networking platform for developers.',
    longDescription: 'DevConnect is a community-driven platform where developers can showcase their projects, connect with peers, and collaborate. It features rich user profiles, a project portfolio section, real-time messaging, and discussion forums, all tailored to the needs of the tech community.',
    screenshots: ['https://picsum.photos/seed/devconnect1/600/400', 'https://picsum.photos/seed/devconnect2/600/400'],
    techStack: ['Next.js', 'TypeScript', 'Tailwind CSS', 'Firebase', 'GraphQL'],
    liveLink: '#',
    repoLink: '#',
  },
];

export const BLOG_POSTS: Blog[] = [
    { title: "Building a Real-Time Intent Router: Why You Don't Need a Large LLM", url: 'https://medium.com/' },
    { title: 'RTK Query Cache Invalidation', url: 'https://medium.com/' },
];