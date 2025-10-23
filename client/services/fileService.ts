import { fileClient, FILE_SERVICE_URL } from './apiClient';

export interface FileMetadata {
  id: string;
  filename: string;
  original_filename: string;
  size: number;
  content_type: string;
  upload_date: string;
  path: string;
}

export interface FileListResponse {
  files: FileMetadata[];
  total: number;
}

/**
 * Upload a single file
 */
export const uploadFile = async (
  file: File,
  onProgress?: (progress: number) => void
): Promise<FileMetadata> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fileClient.post<FileMetadata>('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      if (progressEvent.total) {
        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress?.(progress);
      }
    },
  });

  return response.data;
};

/**
 * Upload multiple files
 */
export const uploadMultipleFiles = async (
  files: File[],
  onProgress?: (progress: number) => void
): Promise<FileMetadata[]> => {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append('files', file);
  });

  const response = await fileClient.post<FileMetadata[]>('/upload/multiple', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      if (progressEvent.total) {
        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress?.(progress);
      }
    },
  });

  return response.data;
};

/**
 * Download a file
 */
export const downloadFile = async (fileId: string): Promise<Blob> => {
  const response = await fileClient.get(`/download/${fileId}`, {
    responseType: 'blob',
  });

  return response.data;
};

/**
 * Download a file and trigger browser download
 */
export const downloadFileToUser = async (fileId: string, filename?: string): Promise<void> => {
  // First get metadata to get the original filename
  let originalFilename = filename;
  if (!originalFilename) {
    const metadata = await getFileMetadata(fileId);
    originalFilename = metadata.original_filename;
  }

  const blob = await downloadFile(fileId);
  
  // Create download link
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = originalFilename || 'download';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

/**
 * Stream a file (useful for large files)
 */
export const streamFile = async (
  fileId: string,
  onChunk: (chunk: Uint8Array) => void,
  onComplete?: () => void,
  onError?: (error: Error) => void
): Promise<void> => {
  const url = `${FILE_SERVICE_URL}/stream/${fileId}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Response body is not readable');
    }

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        onComplete?.();
        break;
      }

      onChunk(value);
    }
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Unknown error');
    onError?.(err);
    throw error;
  }
};

/**
 * Get file metadata
 */
export const getFileMetadata = async (fileId: string): Promise<FileMetadata> => {
  const response = await fileClient.get<FileMetadata>(`/metadata/${fileId}`);
  return response.data;
};

/**
 * List files
 */
export const listFiles = async (skip: number = 0, limit: number = 100): Promise<FileListResponse> => {
  const response = await fileClient.get<FileListResponse>('/list', {
    params: { skip, limit },
  });
  return response.data;
};

/**
 * Delete a file
 */
export const deleteFile = async (fileId: string): Promise<void> => {
  await fileClient.delete(`/delete/${fileId}`);
};

/**
 * Check health of file service
 */
export const checkFileServiceHealth = async () => {
  const response = await fileClient.get('/health');
  return response.data;
};
