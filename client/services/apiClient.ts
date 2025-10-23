import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

// API configuration
const LLM_SERVICE_URL = import.meta.env.VITE_LLM_SERVICE_URL || 'http://localhost:8000';
const FILE_SERVICE_URL = import.meta.env.VITE_FILE_SERVICE_URL || 'http://localhost:8001';

// Create axios instances
const llmClient: AxiosInstance = axios.create({
  baseURL: LLM_SERVICE_URL,
  timeout: 60000, // 60 seconds for LLM requests
  headers: {
    'Content-Type': 'application/json',
  },
});

const fileClient: AxiosInstance = axios.create({
  baseURL: FILE_SERVICE_URL,
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptors for logging (optional)
llmClient.interceptors.request.use(
  (config) => {
    console.log('LLM Request:', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

fileClient.interceptors.request.use(
  (config) => {
    console.log('File Request:', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptors for error handling
llmClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('LLM Service Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

fileClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('File Service Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export { llmClient, fileClient, LLM_SERVICE_URL, FILE_SERVICE_URL };
