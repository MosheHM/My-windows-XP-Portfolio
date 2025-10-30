"""
Example usage of PDF split validation API

This script demonstrates how to use the PDF split validation endpoints.
"""

import requests
import json
from pathlib import Path

# Configuration
BASE_URL = "http://localhost:8001"
SAMPLE_XML_PATH = Path(__file__).parent.parent.parent / "@samples" / "combined-samples" / "sample_ground_truth.xml"


def upload_xml_file(xml_path: Path) -> str:
    """
    Upload XML ground truth file to the service
    
    Returns:
        file_id of the uploaded file
    """
    with open(xml_path, 'rb') as f:
        files = {'file': (xml_path.name, f, 'application/xml')}
        response = requests.post(f"{BASE_URL}/upload", files=files)
        response.raise_for_status()
        return response.json()['id']


def parse_xml(file_id: str) -> dict:
    """
    Parse the uploaded XML file to see the expected structure
    
    Returns:
        Parsed XML structure
    """
    response = requests.get(f"{BASE_URL}/parse-xml/{file_id}")
    response.raise_for_status()
    return response.json()


def validate_split(file_id: str, split_docs: list) -> dict:
    """
    Validate the split documents against the XML ground truth
    
    Args:
        file_id: ID of the uploaded XML file
        split_docs: List of split document information
        
    Returns:
        Validation results
    """
    payload = {
        "xml_file_id": file_id,
        "split_docs": split_docs
    }
    response = requests.post(f"{BASE_URL}/validate/pdf-split", json=payload)
    response.raise_for_status()
    return response.json()


def main():
    print("PDF Split Validation Example")
    print("=" * 50)
    
    # Check if sample XML exists
    if not SAMPLE_XML_PATH.exists():
        print(f"Error: Sample XML not found at {SAMPLE_XML_PATH}")
        return
    
    # Step 1: Upload XML ground truth file
    print("\n1. Uploading XML ground truth file...")
    try:
        file_id = upload_xml_file(SAMPLE_XML_PATH)
        print(f"   Uploaded successfully. File ID: {file_id}")
    except Exception as e:
        print(f"   Error uploading file: {e}")
        return
    
    # Step 2: Parse XML to see expected structure
    print("\n2. Parsing XML to see expected structure...")
    try:
        parsed_xml = parse_xml(file_id)
        print(f"   Expected documents: {len(parsed_xml['split_docs'])}")
        for i, doc in enumerate(parsed_xml['split_docs']):
            print(f"   Document {i+1}: Type={doc['doc_type']}, Pages={len(doc['pages'])}")
    except Exception as e:
        print(f"   Error parsing XML: {e}")
        return
    
    # Step 3: Validate with perfect match
    print("\n3. Testing validation with perfect match...")
    perfect_split = [
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
    try:
        result = validate_split(file_id, perfect_split)
        print(f"   Overall Score: {result['overall_score']:.2%}")
        print(f"   All Documents Valid: {result['summary']['all_docs_valid']}")
    except Exception as e:
        print(f"   Error validating: {e}")
    
    # Step 4: Validate with errors
    print("\n4. Testing validation with errors (wrong type and page count)...")
    error_split = [
        {
            "doc_type": "WRONG_TYPE",
            "page_count": 2,
            "page_numbers": [1, 2]
        },
        {
            "doc_type": "FPL",
            "page_count": 1,
            "page_numbers": [41]
        }
    ]
    try:
        result = validate_split(file_id, error_split)
        print(f"   Overall Score: {result['overall_score']:.2%}")
        print(f"   All Documents Valid: {result['summary']['all_docs_valid']}")
        print("\n   Document-level results:")
        for doc_result in result['doc_results']:
            print(f"   - Doc {doc_result['doc_index']}: Score={doc_result['score']:.2%}, "
                  f"Type Match={doc_result['doc_type_match']}, "
                  f"Page Count Match={doc_result['page_count_match']}, "
                  f"Page Numbers Match={doc_result['page_numbers_match']}")
    except Exception as e:
        print(f"   Error validating: {e}")
    
    # Step 5: Validate with missing documents
    print("\n5. Testing validation with missing document...")
    missing_split = [
        {
            "doc_type": "FSI",
            "page_count": 1,
            "page_numbers": [1]
        }
    ]
    try:
        result = validate_split(file_id, missing_split)
        print(f"   Overall Score: {result['overall_score']:.2%}")
        print(f"   Expected: {result['total_docs']} documents")
        print(f"   Validated: {result['validated_docs']} documents")
        print(f"   Count Match: {result['summary']['count_match']}")
    except Exception as e:
        print(f"   Error validating: {e}")
    
    print("\n" + "=" * 50)
    print("Example completed!")


if __name__ == "__main__":
    main()
