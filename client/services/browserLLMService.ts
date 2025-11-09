import { pipeline, TextGenerationPipeline } from '@xenova/transformers';

// Resume data embedded as system context
const RESUME_DATA = {
  name: "Moshe Haim Makias",
  title: "Full Stack Engineer",
  summary: "Full Stack Engineer with experience designing and implementing scalable web applications across React, TypeScript, and backend architectures. Skilled in building modular systems, optimizing performance, and integrating real-time communication protocols. Combines strong system-level thinking with frontend craftsmanship to deliver reliable, user-centered, production-ready software. Experienced with Docker, Kubernetes, AWS, and CI/CD (Jenkins) pipelines. Passionate about scalable architectures, clean code, and continuous learning.",
  contact: {
    email: "mhm23811@gmail.com",
    linkedin: "https://www.linkedin.com/in/moshe-haim-makias/",
    medium: "https://medium.com/",
    phone: "050-348-0946"
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
        "Improved frontend build efficiency by 20% through modularization and caching strategy refinement."
      ]
    },
    {
      company: "Elbit Systems Israel",
      role: "Full Stack Engineer",
      period: "July 2023 – September 2025",
      details: [
        "Designed and implemented secure communication and data synchronization systems for real-time, mission-critical applications.",
        "Developed full-stack modules integrating backend logic and responsive frontend interfaces in high-reliability environments.",
        "Led R&D efforts building a code generation framework from spec to runtime components, improving development efficiency.",
        "Optimized data serialization and transport protocols, reducing latency and increasing performance reliability."
      ]
    },
    {
      company: "MeGo - Haredi Tech Training Initiative",
      role: "Teaching Assistant & Mentor",
      period: "September 2022 – October 2023",
      details: [
        "Mentored programming and math study groups, creating culturally adapted learning paths.",
        "Supported over 50 students in mastering modern software engineering foundations and job-readiness preparation.",
        "Developed teaching materials focused on full-stack fundamentals and software design principles."
      ]
    },
    {
      company: "Israel Tax Authority",
      role: "Student Intern - Real Estate Taxation Department",
      period: "March 2021 - October 2022",
      details: [
        "Assisted department management in operational decision-making and case analysis.",
        "Supported digital transformation initiatives and cross-department data process improvement."
      ]
    }
  ],
  skills: {
    Frontend: ["React", "TypeScript", "Redux Toolkit", "AngularJS"],
    Backend: ["Node.js", "Express", "REST APIs", "Python", "Java", "C++"],
    Databases: ["PostgreSQL", "Elastic-search"],
    "DevOps & Cloud": ["Docker", "Kubernetes", "Jenkins", "AWS"],
    "Systems & Architecture": ["Scalable infrastructure design", "API development", "communication protocols"],
    "Soft Skills": ["Ownership mindset", "collaboration across teams", "architectural problem-solving"]
  },
  education: {
    degree: "B.Sc. in Computer Science",
    institution: "The College of Management Academic Studies",
    period: "2020 - 2023",
    grade: "95+"
  }
};

// Format resume data into a structured system prompt
function createSystemPrompt(): string {
  const experienceText = RESUME_DATA.experience
    .map(exp => `
    ${exp.company} - ${exp.role} (${exp.period})
    ${exp.details.map(d => `    • ${d}`).join('\n')}
  `).join('\n');

  const skillsText = Object.entries(RESUME_DATA.skills)
    .map(([category, skills]) => `    ${category}: ${Array.isArray(skills) ? skills.join(', ') : skills}`)
    .join('\n');

  return `You are a helpful AI assistant for ${RESUME_DATA.name}'s portfolio website.
Your role is to answer questions about ${RESUME_DATA.name}'s professional background, skills, and experience.

ABOUT ${RESUME_DATA.name.toUpperCase()}:
Title: ${RESUME_DATA.title}
Contact: ${RESUME_DATA.contact.email} | ${RESUME_DATA.contact.phone}
LinkedIn: ${RESUME_DATA.contact.linkedin}

SUMMARY:
${RESUME_DATA.summary}

EXPERIENCE:
${experienceText}

SKILLS:
${skillsText}

EDUCATION:
${RESUME_DATA.education.degree} - ${RESUME_DATA.education.institution} (${RESUME_DATA.education.period})
Grade: ${RESUME_DATA.education.grade}

When answering questions:
- Be concise and professional
- Use information from the context above
- If asked about something not in the resume, politely state that you don't have that information
- Keep responses focused and relevant to ${RESUME_DATA.name}'s professional background`;
}

class BrowserLLMService {
  private pipeline: TextGenerationPipeline | null = null;
  private isLoading = false;
  private isReady = false;
  private systemPrompt: string;
  private conversationHistory: Array<{ role: string; content: string }> = [];

  constructor() {
    this.systemPrompt = createSystemPrompt();
  }

  async initialize(): Promise<void> {
    if (this.isReady || this.isLoading) {
      return;
    }

    this.isLoading = true;
    try {
      console.log('Loading browser-based LLM model...');

      // Use a lightweight text generation model
      // Options: 'Xenova/flan-t5-small' (~80MB), 'Xenova/LaMini-Flan-T5-783M' (~300MB)
      this.pipeline = await pipeline(
        'text2text-generation',
        'Xenova/flan-t5-small',
        {
          // Quantized model for smaller size and faster loading
          quantized: true,
        }
      );

      this.isReady = true;
      console.log('LLM model loaded successfully!');
    } catch (error) {
      console.error('Error loading LLM model:', error);
      throw new Error('Failed to load the language model. Please refresh the page and try again.');
    } finally {
      this.isLoading = false;
    }
  }

  async chat(userMessage: string): Promise<string> {
    if (!this.isReady) {
      await this.initialize();
    }

    if (!this.pipeline) {
      throw new Error('Model not initialized');
    }

    // Add user message to history
    this.conversationHistory.push({ role: 'user', content: userMessage });

    // Create context from recent conversation (last 3 exchanges to keep it lightweight)
    const recentHistory = this.conversationHistory.slice(-6);
    const conversationContext = recentHistory
      .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
      .join('\n');

    // Create the prompt with system context
    const prompt = `${this.systemPrompt}

CONVERSATION:
${conversationContext}
Assistant:`;

    try {
      // Generate response
      const result = await this.pipeline(prompt, {
        max_new_tokens: 150,
        temperature: 0.7,
        do_sample: true,
        top_k: 50,
        top_p: 0.95,
      });

      // Extract the generated text
      const response = Array.isArray(result)
        ? result[0]?.generated_text || 'I apologize, but I could not generate a response.'
        : result.generated_text || 'I apologize, but I could not generate a response.';

      // Clean up the response (remove the prompt if it's included)
      const cleanResponse = response.replace(prompt, '').trim();

      // Add assistant response to history
      this.conversationHistory.push({ role: 'assistant', content: cleanResponse });

      return cleanResponse;
    } catch (error) {
      console.error('Error generating response:', error);
      throw new Error('Failed to generate response. Please try again.');
    }
  }

  async chatStream(
    userMessage: string,
    onToken: (token: string) => void,
    onComplete: () => void,
    onError: (error: Error) => void
  ): Promise<void> {
    try {
      // For now, use non-streaming and simulate streaming
      // Transformers.js doesn't support streaming natively yet
      const response = await this.chat(userMessage);

      // Simulate streaming by sending chunks
      const words = response.split(' ');
      for (let i = 0; i < words.length; i++) {
        const word = words[i] + (i < words.length - 1 ? ' ' : '');
        onToken(word);
        // Small delay to simulate streaming
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      onComplete();
    } catch (error) {
      onError(error as Error);
    }
  }

  clearHistory(): void {
    this.conversationHistory = [];
  }

  getStatus(): { isReady: boolean; isLoading: boolean } {
    return {
      isReady: this.isReady,
      isLoading: this.isLoading,
    };
  }
}

// Export singleton instance
export const browserLLM = new BrowserLLMService();
