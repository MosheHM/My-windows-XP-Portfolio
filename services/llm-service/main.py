from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Optional
import json
import asyncio
from llm_handler import LLMHandler
from rag_engine import RAGEngine

app = FastAPI(title="LLM Chat Service", version="1.0.0")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize LLM and RAG
llm_handler = LLMHandler()
rag_engine = RAGEngine()


class Message(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    message: str
    history: Optional[List[Message]] = []
    use_rag: bool = True


class ChatResponse(BaseModel):
    response: str
    sources: Optional[List[str]] = []


@app.on_event("startup")
async def startup_event():
    """Initialize LLM and RAG on startup"""
    await llm_handler.initialize()
    await rag_engine.initialize()


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "llm_loaded": llm_handler.is_loaded(),
        "rag_indexed": rag_engine.is_indexed()
    }


@app.post("/chat")
async def chat(request: ChatRequest):
    """Non-streaming chat endpoint"""
    try:
        # Get relevant context from RAG if enabled
        context = ""
        sources = []
        if request.use_rag:
            rag_results = await rag_engine.search(request.message)
            context = rag_results.get("context", "")
            sources = rag_results.get("sources", [])
        
        # Generate response
        response = await llm_handler.generate(
            message=request.message,
            context=context,
            history=request.history
        )
        
        return ChatResponse(response=response, sources=sources)
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/chat/stream")
async def chat_stream(request: ChatRequest):
    """Streaming chat endpoint using Server-Sent Events"""
    
    async def generate_stream():
        try:
            # Get relevant context from RAG if enabled
            context = ""
            sources = []
            if request.use_rag:
                rag_results = await rag_engine.search(request.message)
                context = rag_results.get("context", "")
                sources = rag_results.get("sources", [])
            
            # Send sources first
            if sources:
                yield f"data: {json.dumps({'type': 'sources', 'data': sources})}\n\n"
            
            # Stream the response
            async for chunk in llm_handler.generate_stream(
                message=request.message,
                context=context,
                history=request.history
            ):
                yield f"data: {json.dumps({'type': 'token', 'data': chunk})}\n\n"
                await asyncio.sleep(0)  # Allow other tasks to run
            
            # Send completion signal
            yield f"data: {json.dumps({'type': 'done'})}\n\n"
        
        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'data': str(e)})}\n\n"
    
    return StreamingResponse(
        generate_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        }
    )


@app.post("/rag/index")
async def index_documents(documents: List[dict]):
    """Index documents for RAG"""
    try:
        await rag_engine.index_documents(documents)
        return {"status": "success", "indexed": len(documents)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/rag/search")
async def search_rag(query: str, top_k: int = 5):
    """Search RAG index"""
    try:
        results = await rag_engine.search(query, top_k=top_k)
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
