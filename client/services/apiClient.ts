import axios, { AxiosInstance } from 'axios';

// API configuration
const FILE_SERVICE_URL = import.meta.env.VITE_FILE_SERVICE_URL || 'http://localhost:8001';

// Create axios instance
const fileClient: AxiosInstance = axios.create({
  baseURL: FILE_SERVICE_URL,
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging (optional)
fileClient.interceptors.request.use(
  (config) => {
    console.log('File Request:', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
fileClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('File Service Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export { fileClient, FILE_SERVICE_URL };
