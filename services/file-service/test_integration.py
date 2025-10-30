"""
Integration tests for PDF validation API endpoints

These tests require the service to be running.
Run with: pytest test_integration.py -v
"""

import pytest
import requests
import time
from pathlib import Path
import subprocess
import os
import signal

# Configuration
BASE_URL = "http://127.0.0.1:8001"
SAMPLE_XML_PATH = Path(__file__).parent.parent.parent / "@samples" / "combined-samples" / "sample_ground_truth.xml"


@pytest.fixture(scope="module")
def server():
    """Start the server for testing"""
    # Set environment variables
    env = os.environ.copy()
    env['STORAGE_PATH'] = '/tmp/test_int_storage'
    env['METADATA_PATH'] = '/tmp/test_int_metadata'
    
    # Start server
    process = subprocess.Popen(
        ['uvicorn', 'main:app', '--host', '127.0.0.1', '--port', '8001'],
        env=env,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE
    )
    
    # Wait for server to start
    time.sleep(3)
    
    # Check if server is running
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=5)
        assert response.status_code == 200
    except Exception as e:
        process.terminate()
        raise Exception(f"Server failed to start: {e}")
    
    yield process
    
    # Cleanup
    process.terminate()
    process.wait()


def test_health_endpoint(server):
    """Test health check endpoint"""
    response = requests.get(f"{BASE_URL}/health")
    assert response.status_code == 200
    data = response.json()
    assert data['status'] == 'healthy'
    assert data['storage_available'] is True


def test_upload_xml_file(server):
    """Test uploading XML file"""
    if not SAMPLE_XML_PATH.exists():
        pytest.skip(f"Sample XML not found at {SAMPLE_XML_PATH}")
    
    with open(SAMPLE_XML_PATH, 'rb') as f:
        files = {'file': (SAMPLE_XML_PATH.name, f, 'application/xml')}
        response = requests.post(f"{BASE_URL}/upload", files=files)
    
    assert response.status_code == 200
    data = response.json()
    assert 'id' in data
    assert data['original_filename'] == 'sample_ground_truth.xml'
    assert data['content_type'] == 'application/xml'
    
    # Store file_id for other tests
    pytest.file_id = data['id']


def test_parse_xml_endpoint(server):
    """Test parsing XML ground truth"""
    if not hasattr(pytest, 'file_id'):
        test_upload_xml_file(server)
    
    response = requests.get(f"{BASE_URL}/parse-xml/{pytest.file_id}")
    assert response.status_code == 200
    data = response.json()
    
    assert data['parent_com_id'] == 'pxutqxvrveky75v6dwhymg00000000'
    assert data['owner'] == 'GEULAK'
    assert len(data['split_docs']) == 2
    assert data['split_docs'][0]['doc_type'] == 'FSI'
    assert data['split_docs'][1]['doc_type'] == 'FPL'


def test_validate_perfect_match(server):
    """Test validation with perfect match"""
    if not hasattr(pytest, 'file_id'):
        test_upload_xml_file(server)
    
    payload = {
        "xml_file_id": pytest.file_id,
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
    }
    
    response = requests.post(f"{BASE_URL}/validate/pdf-split", json=payload)
    assert response.status_code == 200
    data = response.json()
    
    assert data['overall_score'] == 1.0
    assert data['total_docs'] == 2
    assert data['validated_docs'] == 2
    assert data['summary']['all_docs_valid'] is True
    assert all(doc['score'] == 1.0 for doc in data['doc_results'])


def test_validate_with_errors(server):
    """Test validation with errors"""
    if not hasattr(pytest, 'file_id'):
        test_upload_xml_file(server)
    
    payload = {
        "xml_file_id": pytest.file_id,
        "split_docs": [
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
    }
    
    response = requests.post(f"{BASE_URL}/validate/pdf-split", json=payload)
    assert response.status_code == 200
    data = response.json()
    
    assert data['overall_score'] == 0.5
    assert data['summary']['all_docs_valid'] is False
    assert data['doc_results'][0]['score'] == 0.0
    assert data['doc_results'][1]['score'] == 1.0


def test_validate_missing_document(server):
    """Test validation with missing document"""
    if not hasattr(pytest, 'file_id'):
        test_upload_xml_file(server)
    
    payload = {
        "xml_file_id": pytest.file_id,
        "split_docs": [
            {
                "doc_type": "FSI",
                "page_count": 1,
                "page_numbers": [1]
            }
        ]
    }
    
    response = requests.post(f"{BASE_URL}/validate/pdf-split", json=payload)
    assert response.status_code == 200
    data = response.json()
    
    assert data['overall_score'] == 0.8  # Penalized for count mismatch
    assert data['total_docs'] == 2
    assert data['validated_docs'] == 1
    assert data['summary']['count_match'] is False


def test_validate_invalid_file_id(server):
    """Test validation with invalid file ID"""
    payload = {
        "xml_file_id": "invalid-id",
        "split_docs": [
            {
                "doc_type": "FSI",
                "page_count": 1,
                "page_numbers": [1]
            }
        ]
    }
    
    response = requests.post(f"{BASE_URL}/validate/pdf-split", json=payload)
    assert response.status_code == 404


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
