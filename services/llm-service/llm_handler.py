from typing import List, AsyncGenerator, Optional
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer, TextIteratorStreamer
from threading import Thread
import asyncio
import os


class LLMHandler:
    """Handler for local LLaMA model"""
    
    def __init__(self):
        self.model = None
        self.tokenizer = None
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        # Use a lightweight model by default
        self.model_name = os.getenv("LLM_MODEL_NAME", "TinyLlama/TinyLlama-1.1B-Chat-v1.0")
        self.max_length = int(os.getenv("LLM_MAX_LENGTH", "2048"))
        self.temperature = float(os.getenv("LLM_TEMPERATURE", "0.7"))
        self.loaded = False
    
    async def initialize(self):
        """Load the model and tokenizer"""
        if self.loaded:
            return
        
        print(f"Loading model: {self.model_name} on {self.device}")
        
        # Run in thread pool to avoid blocking
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, self._load_model)
        
        self.loaded = True
        print("Model loaded successfully")
    
    def _load_model(self):
        """Load model synchronously"""
        self.tokenizer = AutoTokenizer.from_pretrained(self.model_name)
        self.model = AutoModelForCausalLM.from_pretrained(
            self.model_name,
            torch_dtype=torch.float16 if self.device == "cuda" else torch.float32,
            device_map="auto" if self.device == "cuda" else None,
            low_cpu_mem_usage=True
        )
        
        if self.device == "cpu":
            self.model = self.model.to(self.device)
    
    def is_loaded(self) -> bool:
        """Check if model is loaded"""
        return self.loaded
    
    def _build_prompt(self, message: str, context: str = "", history: Optional[List] = None) -> str:
        """Build the prompt with context and history"""
        system_prompt = """You are a helpful AI assistant embedded in a portfolio website for Moshe Haim Makias, a full-stack developer. 
Answer questions about Moshe's professional background based on the provided context. 
Be concise and professional. If information is not in the context, say so."""
        
        prompt_parts = [f"<|system|>\n{system_prompt}\n</s>"]
        
        if context:
            prompt_parts.append(f"<|system|>\nContext:\n{context}\n</s>")
        
        # Add conversation history
        if history:
            for msg in history[-5:]:  # Keep last 5 messages
                role = msg.get("role", "user")
                content = msg.get("content", "")
                if role == "user":
                    prompt_parts.append(f"<|user|>\n{content}\n</s>")
                elif role == "assistant":
                    prompt_parts.append(f"<|assistant|>\n{content}\n</s>")
        
        # Add current message
        prompt_parts.append(f"<|user|>\n{message}\n</s>")
        prompt_parts.append("<|assistant|>\n")
        
        return "\n".join(prompt_parts)
    
    async def generate(
        self,
        message: str,
        context: str = "",
        history: Optional[List] = None
    ) -> str:
        """Generate a response (non-streaming)"""
        if not self.loaded:
            raise RuntimeError("Model not loaded. Call initialize() first.")
        
        prompt = self._build_prompt(message, context, history)
        
        # Run in thread pool to avoid blocking
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(None, self._generate_sync, prompt)
        
        return response
    
    def _generate_sync(self, prompt: str) -> str:
        """Synchronous generation"""
        inputs = self.tokenizer(prompt, return_tensors="pt").to(self.device)
        
        with torch.no_grad():
            outputs = self.model.generate(
                **inputs,
                max_new_tokens=512,
                temperature=self.temperature,
                do_sample=True,
                top_p=0.9,
                pad_token_id=self.tokenizer.eos_token_id
            )
        
        response = self.tokenizer.decode(outputs[0][inputs.input_ids.shape[1]:], skip_special_tokens=True)
        return response.strip()
    
    async def generate_stream(
        self,
        message: str,
        context: str = "",
        history: Optional[List] = None
    ) -> AsyncGenerator[str, None]:
        """Generate a response with streaming"""
        if not self.loaded:
            raise RuntimeError("Model not loaded. Call initialize() first.")
        
        prompt = self._build_prompt(message, context, history)
        
        # Use TextIteratorStreamer for streaming generation
        streamer = TextIteratorStreamer(
            self.tokenizer,
            skip_prompt=True,
            skip_special_tokens=True
        )
        
        inputs = self.tokenizer(prompt, return_tensors="pt").to(self.device)
        
        generation_kwargs = {
            **inputs,
            "max_new_tokens": 512,
            "temperature": self.temperature,
            "do_sample": True,
            "top_p": 0.9,
            "streamer": streamer,
            "pad_token_id": self.tokenizer.eos_token_id
        }
        
        # Start generation in a separate thread
        thread = Thread(target=self.model.generate, kwargs=generation_kwargs)
        thread.start()
        
        # Yield tokens as they come
        for text in streamer:
            yield text
            await asyncio.sleep(0)  # Allow other tasks to run
        
        thread.join()
