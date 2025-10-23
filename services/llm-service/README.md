# LLM Service

Python FastAPI service providing chat functionality with a local LLaMA model and RAG capabilities.

## Features

- **Local LLM**: TinyLlama model running locally (customizable)
- **RAG**: Retrieval-Augmented Generation using FAISS for semantic search
- **Streaming**: Server-Sent Events for real-time response streaming
- **Document Indexing**: Index custom documents for context-aware responses
- **GPU/CPU Support**: Automatic device selection

## Requirements

- Python 3.11+
- At least 4GB RAM (8GB recommended)
- 5-10GB disk space for model downloads

## Installation

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

## Configuration

Environment variables:

- `LLM_MODEL_NAME`: HuggingFace model name (default: TinyLlama/TinyLlama-1.1B-Chat-v1.0)
- `LLM_MAX_LENGTH`: Max token length (default: 2048)
- `LLM_TEMPERATURE`: Generation temperature (default: 0.7)
- `RAG_DATA_FILE`: Path to resume data JSON (default: data/resume_data.json)

## Usage

### Development

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Production

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 1
```

Note: Use only 1 worker due to model memory requirements.

### Docker

```bash
docker build -t llm-service .
docker run -p 8000:8000 -v $(pwd)/data:/app/data llm-service
```

## API Endpoints

### POST /chat
Non-streaming chat endpoint

```bash
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Tell me about Moshe",
    "history": [],
    "use_rag": true
  }'
```

### POST /chat/stream
Streaming chat endpoint with SSE

```bash
curl -N -X POST http://localhost:8000/chat/stream \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is Moshe'\''s experience?",
    "use_rag": true
  }'
```

### GET /health
Health check

```bash
curl http://localhost:8000/health
```

### POST /rag/index
Index documents for RAG

```bash
curl -X POST http://localhost:8000/rag/index \
  -H "Content-Type: application/json" \
  -d '[
    {
      "content": "Document content here",
      "metadata": {"type": "experience"}
    }
  ]'
```

### GET /rag/search
Search RAG index

```bash
curl "http://localhost:8000/rag/search?query=experience&top_k=5"
```

## Architecture

### Components

1. **main.py**: FastAPI application with endpoints
2. **llm_handler.py**: LLaMA model wrapper with streaming support
3. **rag_engine.py**: RAG implementation using FAISS and sentence transformers

### Model Selection

The default model is TinyLlama (1.1B parameters) for lightweight operation. You can use larger models:

```bash
# Llama 2 7B (requires 16GB+ RAM)
export LLM_MODEL_NAME="meta-llama/Llama-2-7b-chat-hf"

# Mistral 7B (requires 16GB+ RAM)
export LLM_MODEL_NAME="mistralai/Mistral-7B-Instruct-v0.2"
```

## Performance

- **TinyLlama**: 1-2 seconds per response on CPU, <1 second on GPU
- **Memory Usage**: 2-4GB for TinyLlama, 12-16GB for 7B models
- **Streaming**: Tokens appear in real-time with minimal latency

## Troubleshooting

### Model download fails
- Check internet connection
- Verify HuggingFace model name is correct
- Models are cached in `~/.cache/huggingface/`

### Out of memory
- Use a smaller model (TinyLlama)
- Reduce max_length parameter
- Ensure no other memory-intensive processes are running

### Slow responses
- Enable GPU support (requires CUDA)
- Reduce model size
- Decrease max_new_tokens in generation

## Development

### Testing

```bash
# Install dev dependencies
pip install pytest pytest-asyncio httpx

# Run tests (if tests exist)
pytest tests/
```

### Code Structure

```
llm-service/
├── main.py              # FastAPI app and endpoints
├── llm_handler.py       # LLM model handler
├── rag_engine.py        # RAG implementation
├── requirements.txt     # Python dependencies
├── Dockerfile          # Docker image
└── data/
    └── resume_data.json # Default RAG data
```
