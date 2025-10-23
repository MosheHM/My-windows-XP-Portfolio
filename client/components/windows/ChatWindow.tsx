import React, { useState, useRef, useEffect } from 'react';
import { sendChatMessageStream, Message as APIMessage } from '../../services/chatService';

interface Message {
  type: 'prompt' | 'response' | 'system';
  text: string;
}

const ChatWindow: React.FC = () => {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<Message[]>([
    { type: 'system', text: 'Microsoft Windows XP [Version 5.1.2600]' },
    { type: 'system', text: '(C) Copyright 1985-2001 Microsoft Corp.' },
    { type: 'system', text: ' ' },
    { type: 'system', text: "Welcome! Ask me anything about Moshe's professional background." },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { type: 'prompt', text: input };
    const currentInput = input;
    setHistory(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Build history for API
    const apiHistory: APIMessage[] = history
      .filter(msg => msg.type !== 'system')
      .map(msg => ({
        role: msg.type === 'prompt' ? 'user' : 'assistant',
        content: msg.text,
      }));

    let streamedResponse = '';

    try {
      await sendChatMessageStream(
        {
          message: currentInput,
          history: apiHistory,
          use_rag: true,
        },
        // onToken
        (token: string) => {
          streamedResponse += token;
          // Update the last message in history with accumulated response
          setHistory(prev => {
            const newHistory = [...prev];
            const lastMsg = newHistory[newHistory.length - 1];
            if (lastMsg && lastMsg.type === 'response') {
              lastMsg.text = streamedResponse;
            } else {
              newHistory.push({ type: 'response', text: streamedResponse });
            }
            return newHistory;
          });
        },
        // onSources
        (sources: string[]) => {
          console.log('Sources:', sources);
        },
        // onError
        (error: string) => {
          console.error('Stream error:', error);
          if (!streamedResponse) {
            const errorMessage: Message = { 
              type: 'response', 
              text: 'An error occurred. Please check if the backend service is running.' 
            };
            setHistory(prev => [...prev, errorMessage]);
          }
        },
        // onDone
        () => {
          setIsLoading(false);
        }
      );
    } catch (error) {
      console.error('Chat error:', error);
      if (!streamedResponse) {
        const errorMessage: Message = { 
          type: 'response', 
          text: 'An error occurred. Please check if the backend service is running.' 
        };
        setHistory(prev => [...prev, errorMessage]);
      }
      setIsLoading(false);
    }
  };

  return (
    <div className="font-cmd bg-black text-white p-2 h-full flex flex-col">
      <div className="overflow-y-auto flex-grow">
        {history.map((item, index) => {
            if (item.type === 'prompt') {
                return (
                    <div key={index}>
                        <span className="text-gray-400">C:\Users\Guest&gt; </span>
                        {/* Use a span to keep the text on the same line as the prompt prefix */}
                        <span>{item.text}</span>
                    </div>
                );
            }

            // For response and system messages, which can be multiline
            return (
                <div key={index} className="whitespace-pre-wrap">
                    {item.text.split('\n').map((line, i) => (
                        <p key={i} className="leading-tight">{line}</p>
                    ))}
                    {/* Add extra spacing after system messages to match original intent */}
                    {item.type === 'system' && <br />}
                </div>
            );
        })}
        {isLoading && <div className="animate-pulse">AI is thinking...</div>}
        <div ref={endOfMessagesRef} />
      </div>
      <form onSubmit={handleSubmit} className="flex items-center mt-2">
        <span className="text-gray-400">C:\Users\Guest&gt;</span>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="bg-transparent border-none text-white focus:outline-none flex-grow ml-2 font-cmd"
          autoFocus
          disabled={isLoading}
        />
      </form>
    </div>
  );
};

export default ChatWindow;
