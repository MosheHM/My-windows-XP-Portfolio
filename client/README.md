# Portfolio Client

React + TypeScript frontend with Windows XP-style UI for the portfolio application.

## Features

- **Windows XP Theme**: Retro Windows XP interface
- **Real-time Chat**: Streaming chat with LLM backend
- **File Management**: Upload and download files
- **React Query**: Smart caching and data synchronization
- **Axios**: HTTP client with SSE support
- **TypeScript**: Type-safe development

## Tech Stack

- React 19
- TypeScript
- Vite (build tool)
- Axios (HTTP client)
- TanStack Query (React Query)
- Tailwind CSS (styling)

## Installation

```bash
# Install dependencies
npm install

# Create environment file
cp .env.example .env.local
```

## Configuration

Edit `.env.local`:

```env
VITE_LLM_SERVICE_URL=http://localhost:8000
VITE_FILE_SERVICE_URL=http://localhost:8001
```

## Development

```bash
# Start development server
npm run dev

# Access at http://localhost:5173
```

The development server supports:
- Hot Module Replacement (HMR)
- Fast refresh
- TypeScript type checking

## Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

Build output is in the `dist/` directory.

## Docker

### Build Image

```bash
docker build -t portfolio-client .
```

### Run Container

```bash
docker run -p 80:80 portfolio-client
```

The container uses nginx to serve the static files.

## Project Structure

```
client/
├── components/           # React components
│   ├── windows/         # Window components
│   │   ├── ChatWindow.tsx
│   │   ├── AboutMeWindow.tsx
│   │   ├── ProjectsWindow.tsx
│   │   └── ...
│   ├── Desktop.tsx      # Desktop component
│   ├── Taskbar.tsx      # Taskbar component
│   └── Window.tsx       # Base window component
├── context/             # React context
│   └── WindowsContext.tsx
├── hooks/               # Custom hooks
│   └── useDraggable.ts
├── services/            # API services
│   ├── apiClient.ts     # Axios configuration
│   ├── chatService.ts   # LLM chat API
│   └── fileService.ts   # File storage API
├── App.tsx              # Root component
├── index.tsx            # Entry point
├── constants.ts         # Constants and data
├── types.ts             # TypeScript types
└── vite.config.ts       # Vite configuration
```

## Services

### Chat Service

Handles communication with the LLM backend:

```typescript
import { sendChatMessageStream } from './services/chatService';

await sendChatMessageStream(
  {
    message: "Tell me about Moshe",
    history: [],
    use_rag: true,
  },
  (token) => console.log(token),  // onToken
  (sources) => console.log(sources),  // onSources
  (error) => console.error(error),  // onError
  () => console.log("Done")  // onDone
);
```

### File Service

Handles file operations:

```typescript
import { uploadFile, downloadFileToUser } from './services/fileService';

// Upload file
const metadata = await uploadFile(file, (progress) => {
  console.log(`Upload: ${progress}%`);
});

// Download file
await downloadFileToUser(fileId);
```

## API Integration

### Environment Variables

The client uses environment variables prefixed with `VITE_`:

- `VITE_LLM_SERVICE_URL`: LLM service endpoint
- `VITE_FILE_SERVICE_URL`: File service endpoint

These are injected at build time.

### Service URLs

In development, services typically run on:
- LLM Service: `http://localhost:8000`
- File Service: `http://localhost:8001`

In Kubernetes:
- LLM Service: `http://llm-service:8000`
- File Service: `http://file-service:8001`

## Components

### ChatWindow

Real-time chat interface with streaming support:
- Displays chat history
- Streams LLM responses
- Command prompt-style UI

### AboutMeWindow

Displays professional information:
- Summary
- Contact details
- Links to profiles

### ProjectsWindow

Shows project portfolio:
- Project cards
- Technology stack
- Links to demos and repos

### ResumeWindow

Professional resume viewer:
- Experience timeline
- Skills matrix
- Education

## Styling

The app uses custom CSS for Windows XP theme:
- Classic Windows XP colors
- Retro window decorations
- Custom fonts
- Pixel-perfect UI elements

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## Performance

- Build size: ~260KB (gzipped: ~85KB)
- First Contentful Paint: <1s
- Time to Interactive: <2s

## Deployment

### Static Hosting

Deploy the `dist/` folder to:
- Netlify
- Vercel
- GitHub Pages
- AWS S3 + CloudFront
- Azure Static Web Apps

### Nginx Configuration

The included `nginx.conf` provides:
- SPA routing
- Static asset caching
- Security headers
- Gzip compression

## Development Tips

### Hot Reload

Vite provides instant HMR. Changes appear immediately without full page reload.

### TypeScript

Use TypeScript for type safety:
```typescript
interface Message {
  type: 'prompt' | 'response' | 'system';
  text: string;
}
```

### React Query

Cache API responses:
```typescript
import { useQuery } from '@tanstack/react-query';

const { data, isLoading } = useQuery({
  queryKey: ['files'],
  queryFn: listFiles,
});
```

## Troubleshooting

### CORS Errors

If you see CORS errors:
1. Check backend CORS configuration
2. Verify service URLs in `.env.local`
3. Ensure backend services are running

### Build Failures

```bash
# Clear cache
rm -rf node_modules dist
npm install
npm run build
```

### Type Errors

```bash
# Check TypeScript errors
npx tsc --noEmit
```

## Testing

```bash
# Add testing dependencies
npm install -D vitest @testing-library/react @testing-library/jest-dom

# Run tests
npm test
```

## Contributing

1. Create a feature branch
2. Make changes
3. Test thoroughly
4. Build successfully
5. Submit PR

## License

MIT License
