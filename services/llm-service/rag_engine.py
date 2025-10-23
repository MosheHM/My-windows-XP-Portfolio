from typing import List, Dict, Any
import numpy as np
from sentence_transformers import SentenceTransformer
import faiss
import json
import os


class RAGEngine:
    """Retrieval-Augmented Generation Engine using FAISS"""
    
    def __init__(self):
        self.encoder = None
        self.index = None
        self.documents = []
        self.embedding_dim = 384  # all-MiniLM-L6-v2 dimension
        self.model_name = "sentence-transformers/all-MiniLM-L6-v2"
        self.indexed = False
        self.data_file = os.getenv("RAG_DATA_FILE", "data/resume_data.json")
    
    async def initialize(self):
        """Initialize the RAG engine"""
        if self.indexed:
            return
        
        print("Initializing RAG engine...")
        
        # Load the sentence transformer model
        self.encoder = SentenceTransformer(self.model_name)
        
        # Create FAISS index
        self.index = faiss.IndexFlatL2(self.embedding_dim)
        
        # Load and index default data if exists
        if os.path.exists(self.data_file):
            with open(self.data_file, 'r') as f:
                data = json.load(f)
                await self.index_documents(self._prepare_documents(data))
        
        self.indexed = True
        print("RAG engine initialized")
    
    def is_indexed(self) -> bool:
        """Check if RAG is indexed"""
        return self.indexed and len(self.documents) > 0
    
    def _prepare_documents(self, resume_data: Dict) -> List[Dict]:
        """Convert resume data to searchable documents"""
        documents = []
        
        # Add summary as a document
        if "summary" in resume_data:
            documents.append({
                "content": resume_data["summary"],
                "metadata": {"type": "summary"}
            })
        
        # Add experience entries
        if "experience" in resume_data:
            for exp in resume_data["experience"]:
                content = f"{exp['role']} at {exp['company']} ({exp['period']})\n"
                content += "\n".join(exp.get('details', []))
                documents.append({
                    "content": content,
                    "metadata": {
                        "type": "experience",
                        "company": exp["company"],
                        "role": exp["role"]
                    }
                })
        
        # Add skills as documents
        if "skills" in resume_data:
            for category, skills in resume_data["skills"].items():
                if isinstance(skills, list):
                    content = f"{category}: {', '.join(skills)}"
                else:
                    content = f"{category}: {skills}"
                documents.append({
                    "content": content,
                    "metadata": {"type": "skills", "category": category}
                })
        
        # Add education
        if "education" in resume_data:
            edu = resume_data["education"]
            content = f"{edu.get('degree', '')} from {edu.get('institution', '')} ({edu.get('period', '')})"
            if "grade" in edu:
                content += f"\nGrade: {edu['grade']}"
            documents.append({
                "content": content,
                "metadata": {"type": "education"}
            })
        
        return documents
    
    async def index_documents(self, documents: List[Dict]):
        """Index documents for retrieval"""
        if not self.encoder:
            raise RuntimeError("RAG engine not initialized")
        
        for doc in documents:
            content = doc.get("content", "")
            metadata = doc.get("metadata", {})
            
            # Generate embedding
            embedding = self.encoder.encode([content])[0]
            
            # Add to FAISS index
            self.index.add(np.array([embedding], dtype=np.float32))
            
            # Store document with metadata
            self.documents.append({
                "content": content,
                "metadata": metadata
            })
        
        print(f"Indexed {len(documents)} documents")
    
    async def search(self, query: str, top_k: int = 3) -> Dict[str, Any]:
        """Search for relevant documents"""
        if not self.encoder or not self.index:
            raise RuntimeError("RAG engine not initialized")
        
        if len(self.documents) == 0:
            return {"context": "", "sources": []}
        
        # Generate query embedding
        query_embedding = self.encoder.encode([query])[0]
        
        # Search in FAISS
        distances, indices = self.index.search(
            np.array([query_embedding], dtype=np.float32),
            min(top_k, len(self.documents))
        )
        
        # Retrieve relevant documents
        relevant_docs = []
        sources = []
        for idx in indices[0]:
            if idx < len(self.documents):
                doc = self.documents[idx]
                relevant_docs.append(doc["content"])
                
                # Create source reference
                metadata = doc["metadata"]
                source_text = f"{metadata.get('type', 'document')}"
                if "company" in metadata:
                    source_text += f": {metadata['company']}"
                elif "category" in metadata:
                    source_text += f": {metadata['category']}"
                sources.append(source_text)
        
        # Combine contexts
        context = "\n\n".join(relevant_docs)
        
        return {
            "context": context,
            "sources": sources,
            "query": query
        }
