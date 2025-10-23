# File Service

Python FastAPI service for file storage, upload, download, and streaming.

## Features

- **File Upload**: Single and multiple file upload
- **File Download**: Direct download and streaming
- **Metadata Management**: Store and retrieve file metadata
- **File Listing**: Paginated file listing
- **File Deletion**: Remove files and metadata
- **Streaming**: Efficient streaming for large files

## Requirements

- Python 3.11+
- Disk space based on expected file storage

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

- `STORAGE_PATH`: File storage path (default: /data/files)
- `METADATA_PATH`: Metadata storage path (default: /data/metadata)
- `MAX_FILE_SIZE`: Max file size in bytes (default: 104857600 = 100MB)

## Usage

### Development

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8001
```

### Production

```bash
uvicorn main:app --host 0.0.0.0 --port 8001 --workers 4
```

### Docker

```bash
docker build -t file-service .
docker run -p 8001:8001 -v file-storage:/data file-service
```

## API Endpoints

### POST /upload
Upload a single file

```bash
curl -X POST http://localhost:8001/upload \
  -F "file=@/path/to/file.pdf"
```

Response:
```json
{
  "id": "abc123",
  "filename": "abc123.pdf",
  "original_filename": "file.pdf",
  "size": 1024,
  "content_type": "application/pdf",
  "upload_date": "2024-01-01T00:00:00",
  "path": "/data/files/abc123.pdf"
}
```

### POST /upload/multiple
Upload multiple files

```bash
curl -X POST http://localhost:8001/upload/multiple \
  -F "files=@file1.pdf" \
  -F "files=@file2.jpg"
```

### GET /download/{file_id}
Download a file

```bash
curl http://localhost:8001/download/abc123 -O -J
```

### GET /stream/{file_id}
Stream a file (useful for large files)

```bash
curl http://localhost:8001/stream/abc123 --output downloaded_file.pdf
```

### GET /metadata/{file_id}
Get file metadata

```bash
curl http://localhost:8001/metadata/abc123
```

### GET /list
List all files

```bash
# Get first 100 files
curl http://localhost:8001/list

# With pagination
curl "http://localhost:8001/list?skip=100&limit=50"
```

Response:
```json
{
  "files": [
    {
      "id": "abc123",
      "filename": "abc123.pdf",
      "original_filename": "file.pdf",
      "size": 1024,
      "content_type": "application/pdf",
      "upload_date": "2024-01-01T00:00:00",
      "path": "/data/files/abc123.pdf"
    }
  ],
  "total": 150
}
```

### DELETE /delete/{file_id}
Delete a file

```bash
curl -X DELETE http://localhost:8001/delete/abc123
```

### GET /health
Health check

```bash
curl http://localhost:8001/health
```

## Architecture

### Storage Structure

```
/data/
├── files/              # Actual file storage
│   ├── abc123.pdf
│   ├── def456.jpg
│   └── ...
└── metadata/           # File metadata (JSON)
    ├── abc123.json
    ├── def456.json
    └── ...
```

### File Naming

Files are stored with UUID-based names to prevent conflicts and maintain uniqueness. Original filenames are preserved in metadata.

## Security Considerations

### Current Implementation

⚠️ This is a basic implementation. For production use, add:

1. **Authentication**: Add API key or OAuth
2. **Authorization**: User-based file access control
3. **File Type Validation**: Restrict allowed file types
4. **Virus Scanning**: Scan uploaded files
5. **Rate Limiting**: Prevent abuse
6. **CORS**: Restrict allowed origins

### Example: Add File Type Validation

```python
ALLOWED_EXTENSIONS = {'.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx'}

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    file_extension = Path(file.filename).suffix.lower()
    if file_extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"File type {file_extension} not allowed"
        )
    # ... rest of upload logic
```

## Performance

### Optimization Tips

1. **Large Files**: Use streaming endpoint for files > 50MB
2. **Multiple Files**: Use bulk upload endpoint
3. **Caching**: Add CDN or reverse proxy for frequently accessed files
4. **Storage**: Use external storage (S3, Azure Blob) for production

### Scaling

For high-traffic scenarios:

1. **Multiple Workers**: Scale horizontally with load balancer
2. **Shared Storage**: Use NFS or cloud storage (S3)
3. **Caching**: Add Redis for metadata caching
4. **CDN**: Serve files through CDN

## Troubleshooting

### Upload fails with 413 error
- File exceeds MAX_FILE_SIZE
- Increase limit: `export MAX_FILE_SIZE=209715200` (200MB)

### File not found
- Check STORAGE_PATH and METADATA_PATH exist
- Verify file ID is correct
- Check file system permissions

### Disk full
- Monitor disk usage: `df -h`
- Clean up old files
- Implement file retention policy

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
file-service/
├── main.py              # FastAPI app and endpoints
├── requirements.txt     # Python dependencies
├── Dockerfile          # Docker image
└── README.md           # This file
```

## Future Enhancements

- [ ] Image thumbnail generation
- [ ] File compression
- [ ] Duplicate detection
- [ ] File versioning
- [ ] Automatic cleanup of old files
- [ ] Cloud storage integration (S3, Azure)
- [ ] File sharing with expiring links
