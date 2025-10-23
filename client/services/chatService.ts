import { llmClient, LLM_SERVICE_URL } from './apiClient';

export interface Message {
  role: string;
  content: string;
}

export interface ChatRequest {
  message: string;
  history?: Message[];
  use_rag?: boolean;
}

export interface ChatResponse {
  response: string;
  sources?: string[];
}

export interface StreamEvent {
  type: 'sources' | 'token' | 'done' | 'error';
  data?: any;
}

/**
 * Send a chat message and get a non-streaming response
 */
export const sendChatMessage = async (request: ChatRequest): Promise<ChatResponse> => {
  const response = await llmClient.post<ChatResponse>('/chat', {
    message: request.message,
    history: request.history || [],
    use_rag: request.use_rag !== false,
  });
  
  return response.data;
};

/**
 * Send a chat message with streaming response using Server-Sent Events
 */
export const sendChatMessageStream = async (
  request: ChatRequest,
  onToken: (token: string) => void,
  onSources?: (sources: string[]) => void,
  onError?: (error: string) => void,
  onDone?: () => void
): Promise<void> => {
  const url = `${LLM_SERVICE_URL}/chat/stream`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: request.message,
        history: request.history || [],
        use_rag: request.use_rag !== false,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Response body is not readable');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        break;
      }

      // Decode the chunk and add to buffer
      buffer += decoder.decode(value, { stream: true });

      // Process complete SSE messages
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep incomplete line in buffer

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            const event: StreamEvent = data;

            switch (event.type) {
              case 'sources':
                onSources?.(event.data);
                break;
              case 'token':
                onToken(event.data);
                break;
              case 'done':
                onDone?.();
                break;
              case 'error':
                onError?.(event.data);
                break;
            }
          } catch (e) {
            console.error('Failed to parse SSE event:', line, e);
          }
        }
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    onError?.(message);
    throw error;
  }
};

/**
 * Check health of LLM service
 */
export const checkLLMHealth = async () => {
  const response = await llmClient.get('/health');
  return response.data;
};

/**
 * Index documents for RAG
 */
export const indexDocuments = async (documents: any[]) => {
  const response = await llmClient.post('/rag/index', documents);
  return response.data;
};

/**
 * Search RAG index
 */
export const searchRAG = async (query: string, topK: number = 5) => {
  const response = await llmClient.get('/rag/search', {
    params: { query, top_k: topK },
  });
  return response.data;
};
