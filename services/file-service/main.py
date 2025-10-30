from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import os
import shutil
from pathlib import Path
import uuid
from datetime import datetime
import json
import mimetypes
from pdf_validator import (
    validate_pdf_split,
    parse_xml_ground_truth,
    OverallValidationResult,
    SplittedResultInfo
)

app = FastAPI(title="File Storage Service", version="1.0.0")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Storage configuration
STORAGE_PATH = Path(os.getenv("STORAGE_PATH", "/data/files"))
METADATA_PATH = Path(os.getenv("METADATA_PATH", "/data/metadata"))
MAX_FILE_SIZE = int(os.getenv("MAX_FILE_SIZE", 100 * 1024 * 1024))  # 100MB default

# Ensure storage directories exist
STORAGE_PATH.mkdir(parents=True, exist_ok=True)
METADATA_PATH.mkdir(parents=True, exist_ok=True)


class FileMetadata(BaseModel):
    id: str
    filename: str
    original_filename: str
    size: int
    content_type: str
    upload_date: str
    path: str


class FileListResponse(BaseModel):
    files: List[FileMetadata]
    total: int


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "storage_path": str(STORAGE_PATH),
        "storage_available": STORAGE_PATH.exists()
    }


@app.post("/upload", response_model=FileMetadata)
async def upload_file(file: UploadFile = File(...)):
    """Upload a file"""
    try:
        # Validate file size
        file.file.seek(0, 2)  # Seek to end
        file_size = file.file.tell()
        file.file.seek(0)  # Reset to beginning
        
        if file_size > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=413,
                detail=f"File too large. Max size is {MAX_FILE_SIZE} bytes"
            )
        
        # Generate unique file ID
        file_id = str(uuid.uuid4())
        file_extension = Path(file.filename).suffix
        stored_filename = f"{file_id}{file_extension}"
        file_path = STORAGE_PATH / stored_filename
        
        # Save file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Create metadata
        metadata = FileMetadata(
            id=file_id,
            filename=stored_filename,
            original_filename=file.filename,
            size=file_size,
            content_type=file.content_type or "application/octet-stream",
            upload_date=datetime.utcnow().isoformat(),
            path=str(file_path)
        )
        
        # Save metadata
        metadata_file = METADATA_PATH / f"{file_id}.json"
        with open(metadata_file, "w") as f:
            json.dump(metadata.model_dump(), f)
        
        return metadata
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/upload/multiple", response_model=List[FileMetadata])
async def upload_multiple_files(files: List[UploadFile] = File(...)):
    """Upload multiple files"""
    results = []
    
    for file in files:
        try:
            result = await upload_file(file)
            results.append(result)
        except Exception as e:
            # Continue with other files even if one fails
            print(f"Failed to upload {file.filename}: {str(e)}")
    
    return results


@app.get("/download/{file_id}")
async def download_file(file_id: str):
    """Download a file by ID"""
    try:
        # Load metadata
        metadata_file = METADATA_PATH / f"{file_id}.json"
        if not metadata_file.exists():
            raise HTTPException(status_code=404, detail="File not found")
        
        with open(metadata_file, "r") as f:
            metadata = FileMetadata(**json.load(f))
        
        file_path = Path(metadata.path)
        if not file_path.exists():
            raise HTTPException(status_code=404, detail="File not found on disk")
        
        return FileResponse(
            path=file_path,
            filename=metadata.original_filename,
            media_type=metadata.content_type
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/stream/{file_id}")
async def stream_file(file_id: str):
    """Stream a file by ID"""
    try:
        # Load metadata
        metadata_file = METADATA_PATH / f"{file_id}.json"
        if not metadata_file.exists():
            raise HTTPException(status_code=404, detail="File not found")
        
        with open(metadata_file, "r") as f:
            metadata = FileMetadata(**json.load(f))
        
        file_path = Path(metadata.path)
        if not file_path.exists():
            raise HTTPException(status_code=404, detail="File not found on disk")
        
        def iter_file():
            with open(file_path, "rb") as file:
                while chunk := file.read(8192):
                    yield chunk
        
        return StreamingResponse(
            iter_file(),
            media_type=metadata.content_type,
            headers={
                "Content-Disposition": f'attachment; filename="{metadata.original_filename}"'
            }
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/metadata/{file_id}", response_model=FileMetadata)
async def get_file_metadata(file_id: str):
    """Get file metadata"""
    try:
        metadata_file = METADATA_PATH / f"{file_id}.json"
        if not metadata_file.exists():
            raise HTTPException(status_code=404, detail="File not found")
        
        with open(metadata_file, "r") as f:
            metadata = FileMetadata(**json.load(f))
        
        return metadata
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/list", response_model=FileListResponse)
async def list_files(skip: int = 0, limit: int = 100):
    """List all files"""
    try:
        metadata_files = list(METADATA_PATH.glob("*.json"))
        total = len(metadata_files)
        
        files = []
        for metadata_file in metadata_files[skip:skip + limit]:
            with open(metadata_file, "r") as f:
                metadata = FileMetadata(**json.load(f))
                files.append(metadata)
        
        # Sort by upload date (newest first)
        files.sort(key=lambda x: x.upload_date, reverse=True)
        
        return FileListResponse(files=files, total=total)
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/delete/{file_id}")
async def delete_file(file_id: str):
    """Delete a file"""
    try:
        # Load metadata
        metadata_file = METADATA_PATH / f"{file_id}.json"
        if not metadata_file.exists():
            raise HTTPException(status_code=404, detail="File not found")
        
        with open(metadata_file, "r") as f:
            metadata = FileMetadata(**json.load(f))
        
        # Delete file
        file_path = Path(metadata.path)
        if file_path.exists():
            file_path.unlink()
        
        # Delete metadata
        metadata_file.unlink()
        
        return {"status": "success", "message": f"File {file_id} deleted"}
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class SplitDocValidationInput(BaseModel):
    """Input model for validating a split document"""
    doc_type: str
    page_count: int
    page_numbers: List[int]


class ValidationRequest(BaseModel):
    """Request model for PDF split validation"""
    xml_file_id: str
    split_docs: List[SplitDocValidationInput]


@app.post("/validate/pdf-split", response_model=OverallValidationResult)
async def validate_pdf_split_endpoint(request: ValidationRequest):
    """
    Validate PDF split results against XML ground truth
    
    Args:
        request: ValidationRequest containing XML file ID and actual split document info
        
    Returns:
        OverallValidationResult with validation scores and details
    """
    try:
        # Load XML file metadata
        metadata_file = METADATA_PATH / f"{request.xml_file_id}.json"
        if not metadata_file.exists():
            raise HTTPException(status_code=404, detail="XML file not found")
        
        with open(metadata_file, "r") as f:
            metadata = FileMetadata(**json.load(f))
        
        xml_path = Path(metadata.path)
        if not xml_path.exists():
            raise HTTPException(status_code=404, detail="XML file not found on disk")
        
        # Validate it's an XML file
        if not xml_path.suffix.lower() == '.xml':
            raise HTTPException(status_code=400, detail="File must be an XML file")
        
        # Convert input to dict format expected by validator
        actual_split_info = [
            {
                'doc_type': doc.doc_type,
                'page_count': doc.page_count,
                'page_numbers': doc.page_numbers
            }
            for doc in request.split_docs
        ]
        
        # Perform validation
        result = validate_pdf_split(xml_path, actual_split_info)
        
        return result
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/parse-xml/{file_id}", response_model=SplittedResultInfo)
async def parse_xml_endpoint(file_id: str):
    """
    Parse XML ground truth file and return structured information
    
    Args:
        file_id: ID of the uploaded XML file
        
    Returns:
        SplittedResultInfo with parsed XML structure
    """
    try:
        # Load metadata
        metadata_file = METADATA_PATH / f"{file_id}.json"
        if not metadata_file.exists():
            raise HTTPException(status_code=404, detail="File not found")
        
        with open(metadata_file, "r") as f:
            metadata = FileMetadata(**json.load(f))
        
        xml_path = Path(metadata.path)
        if not xml_path.exists():
            raise HTTPException(status_code=404, detail="File not found on disk")
        
        # Validate it's an XML file
        if not xml_path.suffix.lower() == '.xml':
            raise HTTPException(status_code=400, detail="File must be an XML file")
        
        # Parse XML
        result = parse_xml_ground_truth(xml_path)
        
        return result
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
