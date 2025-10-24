# System Architecture

## Overview

The Windows XP Portfolio application uses a microservices architecture with an nginx gateway serving as the single entry point for all client requests.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Browser                          │
│                     http://localhost/                           │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ HTTP/HTTPS
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                      Nginx Gateway (:80)                        │
│  - Reverse Proxy                                                │
│  - API Routing                                                  │
│  - Load Balancing                                               │
│  - SSL/TLS Termination                                          │
│  - Security Headers                                             │
│  - Compression                                                  │
└─────────────┬──────────────┬──────────────┬─────────────────────┘
              │              │              │
       ┌──────▼─────┐ ┌─────▼──────┐ ┌────▼──────┐
       │   Route    │ │   Route    │ │  Route    │
       │    /*      │ │ /api/llm/* │ │/api/files/│
       └──────┬─────┘ └─────┬──────┘ └────┬──────┘
              │              │              │
┌─────────────▼─────┐ ┌──────▼──────┐ ┌────▼─────────┐
│  Client Service   │ │ LLM Service │ │File Service  │
│    (React App)    │ │  (FastAPI)  │ │  (FastAPI)   │
│      :80          │ │    :8000    │ │    :8001     │
├───────────────────┤ ├─────────────┤ ├──────────────┤
│ - Windows XP UI   │ │ - TinyLlama │ │ - Upload     │
│ - Chat Interface  │ │ - RAG/FAISS │ │ - Download   │
│ - File Manager    │ │ - Streaming │ │ - Metadata   │
│ - Static Files    │ │ - Embedding │ │ - Storage    │
└───────────────────┘ └──────┬──────┘ └────┬─────────┘
                             │              │
                      ┌──────▼──────┐ ┌────▼─────────┐
                      │ Model Cache │ │ File Storage │
                      │  (Volume)   │ │   (Volume)   │
                      └─────────────┘ └──────────────┘
```

## Request Flow

### Static Content Request

```
Browser → GET /
          ↓
    Nginx Gateway
          ↓
    location /
          ↓
    Client Container (:80)
          ↓
    Static HTML/JS/CSS
          ↓
    ← Response
```

### API Request (LLM Chat)

```
Browser → POST /api/llm/chat/stream
          ↓
    Nginx Gateway
          ↓
    location /api/llm/
          ↓
    proxy_pass http://llm-service:8000/
          ↓
    LLM Service → POST /chat/stream
          ↓
    LLM Handler
          ├→ RAG Engine (retrieve context)
          └→ Model Inference (generate response)
          ↓
    SSE Stream (text/event-stream)
          ↓
    ← Streaming Response
          ↓
    Nginx (proxy_buffering off)
          ↓
    ← Browser (EventSource)
```

### File Upload Request

```
Browser → POST /api/files/upload
          ↓
    Nginx Gateway (client_max_body_size 100M)
          ↓
    location /api/files/
          ↓
    proxy_pass http://file-service:8001/
          ↓
    File Service → POST /upload
          ↓
    File Handler
          ├→ Validate file
          ├→ Generate UUID
          ├→ Save to storage volume
          └→ Save metadata
          ↓
    ← Response (file metadata)
          ↓
    Nginx Gateway
          ↓
    ← Browser (upload confirmation)
```

## Component Architecture

### Client (Frontend)

```
┌────────────────────────────────────────┐
│           Client Application           │
├────────────────────────────────────────┤
│                                        │
│  ┌──────────────────────────────────┐ │
│  │        Components Layer          │ │
│  │  - Desktop                       │ │
│  │  - Windows (Chat, Projects, etc) │ │
│  │  - Taskbar                       │ │
│  │  - Icons                         │ │
│  └────────────┬─────────────────────┘ │
│               │                        │
│  ┌────────────▼─────────────────────┐ │
│  │        Services Layer            │ │
│  │  - chatService                   │ │
│  │  - fileService                   │ │
│  │  - apiClient (Axios)             │ │
│  └────────────┬─────────────────────┘ │
│               │                        │
│  ┌────────────▼─────────────────────┐ │
│  │        State Management          │ │
│  │  - WindowsContext                │ │
│  │  - React Query Cache             │ │
│  └──────────────────────────────────┘ │
│                                        │
└────────────────────────────────────────┘
```

### LLM Service (Backend)

```
┌────────────────────────────────────────┐
│           LLM Service                  │
├────────────────────────────────────────┤
│                                        │
│  ┌──────────────────────────────────┐ │
│  │        FastAPI Router            │ │
│  │  - /chat (POST)                  │ │
│  │  - /chat/stream (POST, SSE)      │ │
│  │  - /rag/index (POST)             │ │
│  │  - /rag/search (GET)             │ │
│  │  - /health (GET)                 │ │
│  └────────────┬─────────────────────┘ │
│               │                        │
│  ┌────────────▼─────────────────────┐ │
│  │        LLM Handler               │ │
│  │  - Model Loading                 │ │
│  │  - Token Generation              │ │
│  │  - Streaming                     │ │
│  └────────────┬─────────────────────┘ │
│               │                        │
│  ┌────────────▼─────────────────────┐ │
│  │        RAG Engine                │ │
│  │  - FAISS Vector Store            │ │
│  │  - Sentence Embeddings           │ │
│  │  - Document Search               │ │
│  └──────────────────────────────────┘ │
│               │                        │
│  ┌────────────▼─────────────────────┐ │
│  │        Model Layer               │ │
│  │  - TinyLlama (HuggingFace)       │ │
│  │  - Transformer Pipeline          │ │
│  │  - GPU/CPU Support               │ │
│  └──────────────────────────────────┘ │
│                                        │
└────────────────────────────────────────┘
```

### File Service (Backend)

```
┌────────────────────────────────────────┐
│           File Service                 │
├────────────────────────────────────────┤
│                                        │
│  ┌──────────────────────────────────┐ │
│  │        FastAPI Router            │ │
│  │  - /upload (POST)                │ │
│  │  - /upload/multiple (POST)       │ │
│  │  - /download/{id} (GET)          │ │
│  │  - /stream/{id} (GET)            │ │
│  │  - /metadata/{id} (GET)          │ │
│  │  - /list (GET)                   │ │
│  │  - /delete/{id} (DELETE)         │ │
│  │  - /health (GET)                 │ │
│  └────────────┬─────────────────────┘ │
│               │                        │
│  ┌────────────▼─────────────────────┐ │
│  │        File Handler              │ │
│  │  - Upload Processing             │ │
│  │  - Download Streaming            │ │
│  │  - Validation                    │ │
│  └────────────┬─────────────────────┘ │
│               │                        │
│  ┌────────────▼─────────────────────┐ │
│  │        Storage Layer             │ │
│  │  - File System Storage           │ │
│  │  - Metadata Store (JSON)         │ │
│  │  - UUID Generation               │ │
│  └──────────────────────────────────┘ │
│                                        │
└────────────────────────────────────────┘
```

### Nginx Gateway

```
┌────────────────────────────────────────┐
│           Nginx Gateway                │
├────────────────────────────────────────┤
│                                        │
│  ┌──────────────────────────────────┐ │
│  │        HTTP Server               │ │
│  │  - Listen :80                    │ │
│  │  - SSL/TLS Ready                 │ │
│  └────────────┬─────────────────────┘ │
│               │                        │
│  ┌────────────▼─────────────────────┐ │
│  │        Routing Layer             │ │
│  │  - / → client:80                 │ │
│  │  - /api/llm/* → llm-service:8000 │ │
│  │  - /api/files/* → file:8001      │ │
│  └────────────┬─────────────────────┘ │
│               │                        │
│  ┌────────────▼─────────────────────┐ │
│  │        Middleware                │ │
│  │  - Compression (gzip)            │ │
│  │  - Security Headers              │ │
│  │  - Buffering Control             │ │
│  │  - Timeout Management            │ │
│  └────────────┬─────────────────────┘ │
│               │                        │
│  ┌────────────▼─────────────────────┐ │
│  │        Upstream Pool             │ │
│  │  - llm_service                   │ │
│  │  - file_service                  │ │
│  │  - client                        │ │
│  └──────────────────────────────────┘ │
│                                        │
└────────────────────────────────────────┘
```

## Deployment Architectures

### Development Environment

```
┌─────────────────────────────────────────────────────────────┐
│                    Docker Host (Development)                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │              Docker Network (Bridge)                  │ │
│  │                                                       │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐           │ │
│  │  │  Client  │  │   LLM    │  │   File   │           │ │
│  │  │   :80    │  │  :8000   │  │  :8001   │           │ │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘           │ │
│  │       │             │             │                  │ │
│  │       ▲             ▲             ▲                  │ │
│  │       │             │             │                  │ │
│  │  ┌────┴─────────────┴─────────────┴──────┐          │ │
│  │  │        Nginx Gateway :80              │          │ │
│  │  └────────────────┬──────────────────────┘          │ │
│  │                   │                                  │ │
│  └───────────────────┼──────────────────────────────────┘ │
│                      │                                    │
│  ┌───────────────────▼──────────────────────────────────┐ │
│  │             Mounted Volumes                          │ │
│  │  - Source Code (Hot Reload)                          │ │
│  │  - LLM Model Cache                                   │ │
│  │  - File Storage                                      │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                             │
└────────────────────────┬────────────────────────────────────┘
                         │
                    Port 80 (Host)
```

### Production Environment

```
┌─────────────────────────────────────────────────────────────┐
│                    Docker Host (Production)                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │              Docker Network (Bridge)                  │ │
│  │                                                       │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐           │ │
│  │  │  Client  │  │   LLM    │  │   File   │           │ │
│  │  │   :80    │  │  :8000   │  │  :8001   │           │ │
│  │  │ (256MB)  │  │  (8GB)   │  │  (1GB)   │           │ │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘           │ │
│  │       │             │             │                  │ │
│  │       ▲             ▲             ▲                  │ │
│  │       │             │             │                  │ │
│  │  ┌────┴─────────────┴─────────────┴──────┐          │ │
│  │  │    Nginx Gateway :80 (256MB)          │          │ │
│  │  └────────────────┬──────────────────────┘          │ │
│  │                   │                                  │ │
│  └───────────────────┼──────────────────────────────────┘ │
│                      │                                    │
│  ┌───────────────────▼──────────────────────────────────┐ │
│  │             Persistent Volumes                       │ │
│  │  - LLM Model Cache (10GB)                            │ │
│  │  - LLM Data (10GB)                                   │ │
│  │  - File Storage (20GB)                               │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                             │
└────────────────────────┬────────────────────────────────────┘
                         │
                    Port 80 (Host)
                         │
                    SSL/TLS Termination
                    (Future Enhancement)
```

## Data Flow Patterns

### Server-Sent Events (SSE) Flow

```
Client                Nginx               LLM Service
  │                     │                      │
  │  EventSource        │                      │
  │  /api/llm/chat      │                      │
  ├────────────────────>│                      │
  │                     │  POST /chat/stream   │
  │                     ├─────────────────────>│
  │                     │                      │
  │                     │  200 OK              │
  │                     │  text/event-stream   │
  │                     │<─────────────────────┤
  │  200 OK             │                      │
  │  text/event-stream  │                      │
  │<────────────────────┤                      │
  │                     │                      │
  │                     │  data: token1\n\n    │
  │  data: token1\n\n   │<─────────────────────┤
  │<────────────────────┤                      │
  │                     │                      │
  │                     │  data: token2\n\n    │
  │  data: token2\n\n   │<─────────────────────┤
  │<────────────────────┤                      │
  │                     │                      │
  │                     │  ...                 │
  │                     │                      │
  │                     │  data: [DONE]\n\n    │
  │  data: [DONE]\n\n   │<─────────────────────┤
  │<────────────────────┤                      │
  │                     │                      │
  │  Connection Close   │                      │
  │─ ─ ─ ─ ─ ─ ─ ─ ─ ─>│                      │
  │                     │  Connection Close    │
  │                     │─ ─ ─ ─ ─ ─ ─ ─ ─ ─>│
```

### File Upload Flow

```
Client                Nginx               File Service
  │                     │                      │
  │  FormData           │                      │
  │  /api/files/upload  │                      │
  ├────────────────────>│                      │
  │                     │  POST /upload        │
  │                     │  multipart/form-data │
  │                     ├─────────────────────>│
  │                     │                      │
  │                     │                      ├──> Validate
  │                     │                      │
  │                     │                      ├──> Generate UUID
  │                     │                      │
  │                     │                      ├──> Save File
  │                     │                      │
  │                     │                      ├──> Save Metadata
  │                     │                      │
  │                     │  200 OK              │
  │                     │  { file_id, ... }    │
  │                     │<─────────────────────┤
  │  200 OK             │                      │
  │  { file_id, ... }   │                      │
  │<────────────────────┤                      │
```

## Security Architecture

### Network Security

```
Internet
    │
    │ (Firewall)
    │
    ▼
┌───────────────────────┐
│   Nginx Gateway :80   │  ◄── Single Entry Point
│   - SSL/TLS           │
│   - Rate Limiting     │
│   - Security Headers  │
└───────┬───────────────┘
        │
        │ (Internal Network)
        │
    ┌───┴────┬──────────┬────────┐
    ▼        ▼          ▼        ▼
┌────────┐ ┌────┐ ┌─────────┐ ┌────┐
│ Client │ │LLM │ │  File   │ │Data│
│  :80   │ │:8000│ │  :8001  │ │Vols│
└────────┘ └────┘ └─────────┘ └────┘
    │        │         │          │
    └────────┴─────────┴──────────┘
       (No External Access)
```

### Authentication Flow (Future)

```
Client                Nginx               Services
  │                     │                      │
  │  Request            │                      │
  │  + JWT Token        │                      │
  ├────────────────────>│                      │
  │                     │                      │
  │                     ├──> Verify JWT        │
  │                     │                      │
  │                     ├──> Valid?            │
  │                     │    Yes               │
  │                     │                      │
  │                     │  Forward Request     │
  │                     ├─────────────────────>│
  │                     │                      │
  │                     │  Response            │
  │  Response           │<─────────────────────┤
  │<────────────────────┤                      │
```

## Scalability Patterns

### Horizontal Scaling (Future)

```
         Load Balancer
              │
    ┌─────────┼─────────┐
    │         │         │
    ▼         ▼         ▼
┌────────┐┌────────┐┌────────┐
│ Nginx  ││ Nginx  ││ Nginx  │
│ GW #1  ││ GW #2  ││ GW #3  │
└───┬────┘└───┬────┘└───┬────┘
    │         │         │
    └─────────┼─────────┘
              │
    ┌─────────┼─────────┐
    │         │         │
    ▼         ▼         ▼
┌────────┐┌────────┐┌────────┐
│ LLM #1 ││ LLM #2 ││ LLM #3 │
└────────┘└────────┘└────────┘
```

## Resource Requirements

### Development

| Component | CPU | Memory | Storage |
|-----------|-----|--------|---------|
| Nginx | Unlimited | Unlimited | - |
| Client | Unlimited | Unlimited | - |
| LLM Service | Unlimited | Unlimited | 10GB |
| File Service | Unlimited | Unlimited | 5GB |

### Production

| Component | CPU Reserve | CPU Limit | Memory Reserve | Memory Limit | Storage |
|-----------|-------------|-----------|----------------|--------------|---------|
| Nginx | 0.25 | 0.5 | 128MB | 256MB | - |
| Client | 0.25 | 0.5 | 128MB | 256MB | - |
| LLM Service | 2.0 | 4.0 | 4GB | 8GB | 10GB |
| File Service | 0.5 | 1.0 | 512MB | 1GB | 20GB |

## Summary

This architecture provides:

- ✅ **Single Entry Point**: All requests through nginx gateway
- ✅ **Service Isolation**: Microservices with clear boundaries
- ✅ **Scalability**: Easy to scale individual services
- ✅ **Security**: Centralized security control
- ✅ **Flexibility**: Easy to add new services
- ✅ **Maintainability**: Clear separation of concerns
- ✅ **Performance**: Optimized with caching and compression
- ✅ **Development**: Hot reload and easy debugging

For detailed configuration, see:
- [ENVIRONMENTS.md](ENVIRONMENTS.md) - Environment setup
- [nginx/README.md](nginx/README.md) - Gateway configuration
- [README.md](README.md) - Main documentation
