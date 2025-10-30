# PDF Split Validation

This service provides functionality to validate PDF split results against XML ground truth files.

## Overview

The PDF Split Validation feature allows you to:
1. Upload an XML ground truth file that defines how a PDF should be split
2. Validate your actual split results against the ground truth
3. Receive detailed scoring and validation results

## XML Ground Truth Format

The XML file should follow this structure:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<SplittedResult>
    <ParentComId>...</ParentComId>
    <Owner>...</Owner>
    <User>...</User>
    <FilePath>...</FilePath>
    <SplittedDocs>
        <SplitDoc>
            <DocType>FSI</DocType>
            <PrimaryNum>81124047</PrimaryNum>
            <Pages>
                <Page>
                    <PageNum>1</PageNum>
                    <Rotate>0</Rotate>
                </Page>
            </Pages>
            <FilingDocTypeCode>FSI</FilingDocTypeCode>
            <FilingDocTypeName>Supplier Invoice</FilingDocTypeName>
        </SplitDoc>
        <!-- More SplitDoc elements -->
    </SplittedDocs>
</SplittedResult>
```

## API Endpoints

### 1. Upload XML Ground Truth

Upload the XML ground truth file.

```bash
curl -X POST http://localhost:8001/upload \
  -F "file=@sample_ground_truth.xml"
```

Response:
```json
{
  "id": "abc123",
  "filename": "abc123.xml",
  "original_filename": "sample_ground_truth.xml",
  "size": 2541,
  "content_type": "application/xml",
  "upload_date": "2024-01-15T10:30:00",
  "path": "/data/files/abc123.xml"
}
```

### 2. Parse XML Ground Truth

Parse the XML to see the expected structure.

```bash
curl http://localhost:8001/parse-xml/abc123
```

Response:
```json
{
  "parent_com_id": "pxutqxvrveky75v6dwhymg00000000",
  "owner": "GEULAK",
  "user": "GEULAK",
  "file_path": "\\ScansSrv\\DMClients\\geulak\\Preview\\P_CGD-5091094-1_1.PDF",
  "split_docs": [
    {
      "doc_type": "FSI",
      "primary_num": "81124047",
      "pages": [
        {
          "page_num": 1,
          "rotate": 0
        }
      ],
      "filing_doc_type_code": "FSI",
      "filing_doc_type_name": "Supplier Invoice",
      "processed_file": "..."
    },
    {
      "doc_type": "FPL",
      "primary_num": "81124047",
      "pages": [
        {
          "page_num": 41,
          "rotate": 0
        }
      ],
      "filing_doc_type_code": "FPL",
      "filing_doc_type_name": "Packing List",
      "processed_file": "..."
    }
  ]
}
```

### 3. Validate PDF Split

Validate your actual split results against the XML ground truth.

```bash
curl -X POST http://localhost:8001/validate/pdf-split \
  -H "Content-Type: application/json" \
  -d '{
    "xml_file_id": "abc123",
    "split_docs": [
      {
        "doc_type": "FSI",
        "page_count": 1,
        "page_numbers": [1]
      },
      {
        "doc_type": "FPL",
        "page_count": 1,
        "page_numbers": [41]
      }
    ]
  }'
```

Response:
```json
{
  "total_docs": 2,
  "validated_docs": 2,
  "overall_score": 1.0,
  "doc_results": [
    {
      "doc_index": 0,
      "doc_type_match": true,
      "page_count_match": true,
      "page_numbers_match": true,
      "score": 1.0,
      "details": {
        "expected_doc_type": "FSI",
        "actual_doc_type": "FSI",
        "expected_page_count": 1,
        "actual_page_count": 1,
        "expected_page_numbers": [1],
        "actual_page_numbers": [1],
        "score_components": {
          "doc_type": 1.0,
          "page_count": 1.0,
          "page_numbers": 1.0
        }
      }
    },
    {
      "doc_index": 1,
      "doc_type_match": true,
      "page_count_match": true,
      "page_numbers_match": true,
      "score": 1.0,
      "details": { ... }
    }
  ],
  "summary": {
    "expected_doc_count": 2,
    "actual_doc_count": 2,
    "count_match": true,
    "all_docs_valid": true,
    "avg_doc_type_match": 1.0,
    "avg_page_count_match": 1.0,
    "avg_page_numbers_match": 1.0
  }
}
```

## Validation Criteria

The validation system checks the following criteria for each split document:

1. **Document Type** (40% weight)
   - Matches the `DocType` or `FilingDocTypeCode` from the XML
   
2. **Page Count** (30% weight)
   - The number of pages matches the expected count
   
3. **Page Numbers** (30% weight)
   - The specific page numbers match exactly

## Scoring

### Document-Level Score

Each document receives a score between 0.0 and 1.0 based on the weighted criteria:
- Score = (doc_type_match * 0.4) + (page_count_match * 0.3) + (page_numbers_match * 0.3)

### Overall Score

The overall score is calculated as:
- Average of all document-level scores
- Penalized by 20% if the total document count doesn't match

### Interpretation

- **1.0**: Perfect match
- **0.8-0.99**: Minor issues (e.g., page number mismatch but correct type and count)
- **0.5-0.79**: Moderate issues (e.g., wrong page count or type)
- **0.0-0.49**: Major issues (multiple mismatches)

## Example Usage

See `example_usage.py` for a complete Python example demonstrating:
- Uploading XML ground truth
- Parsing XML structure
- Testing validation with perfect match
- Testing validation with errors
- Testing validation with missing documents

To run the example:

```bash
# Start the service first
python main.py

# In another terminal, run the example
python example_usage.py
```

## Testing

Run the unit tests:

```bash
pytest test_pdf_validator.py -v
```

The tests cover:
- XML parsing
- Document-level validation with various scenarios
- Overall validation with perfect match, partial match, and count mismatches

## Integration

### With File Service

The validation endpoints are integrated into the existing file service:
- Use the same `/upload` endpoint to upload XML files
- The service automatically detects XML files by extension
- All file management features (download, delete, list) work with XML files

### Sample Files

Sample XML ground truth files are provided in the `@samples/combined-samples` directory for testing and reference.

## Error Handling

The API returns appropriate HTTP status codes:
- `200 OK`: Successful validation
- `404 Not Found`: XML file not found
- `400 Bad Request`: Invalid request (e.g., non-XML file)
- `500 Internal Server Error`: Server-side error

Error response format:
```json
{
  "detail": "Error message description"
}
```

## Future Enhancements

Potential improvements:
- Support for PDF file analysis to automatically extract page counts and types
- Batch validation of multiple XML files
- Configurable scoring weights
- Export validation reports in various formats (JSON, CSV, PDF)
- Integration with PDF splitting tools
