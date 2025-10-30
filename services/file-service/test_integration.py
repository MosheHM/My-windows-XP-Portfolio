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


def wait_for_server(url, timeout=10, interval=0.5):
    """Wait for server to become available"""
    start_time = time.time()
    while time.time() - start_time < timeout:
        try:
            response = requests.get(f"{url}/health", timeout=1)
            if response.status_code == 200:
                return True
        except requests.exceptions.RequestException:
            pass
        time.sleep(interval)
    return False


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
    
    # Wait for server to start with retry mechanism
    if not wait_for_server(BASE_URL, timeout=10):
        try:
            process.terminate()
            process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            process.kill()
        raise Exception("Server failed to start within timeout")
    
    yield process
    
    # Cleanup with proper exception handling
    try:
        process.terminate()
        process.wait(timeout=5)
    except subprocess.TimeoutExpired:
        # If graceful termination fails, force kill
        process.kill()
        process.wait()


@pytest.fixture(scope="module")
def uploaded_xml_id(server):
    """Upload XML file once and share across tests"""
    if not SAMPLE_XML_PATH.exists():
        pytest.skip(f"Sample XML not found at {SAMPLE_XML_PATH}")
    
    with open(SAMPLE_XML_PATH, 'rb') as f:
        files = {'file': (SAMPLE_XML_PATH.name, f, 'application/xml')}
        response = requests.post(f"{BASE_URL}/upload", files=files)
    
    assert response.status_code == 200
    data = response.json()
    assert 'id' in data
    return data['id']


def test_health_endpoint(server):
    """Test health check endpoint"""
    response = requests.get(f"{BASE_URL}/health")
    assert response.status_code == 200
    data = response.json()
    assert data['status'] == 'healthy'
    assert data['storage_available'] is True


def test_upload_xml_file(uploaded_xml_id):
    """Test uploading XML file"""
    # This test verifies the fixture worked correctly
    assert uploaded_xml_id is not None
    assert len(uploaded_xml_id) > 0


def test_parse_xml_endpoint(uploaded_xml_id):
    """Test parsing XML ground truth"""
    response = requests.get(f"{BASE_URL}/parse-xml/{uploaded_xml_id}")
    assert response.status_code == 200
    data = response.json()
    
    assert data['parent_com_id'] == 'pxutqxvrveky75v6dwhymg00000000'
    assert data['owner'] == 'GEULAK'
    assert len(data['split_docs']) == 2
    assert data['split_docs'][0]['doc_type'] == 'FSI'
    assert data['split_docs'][1]['doc_type'] == 'FPL'


def test_validate_perfect_match(uploaded_xml_id):
    """Test validation with perfect match"""
    payload = {
        "xml_file_id": uploaded_xml_id,
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


def test_validate_with_errors(uploaded_xml_id):
    """Test validation with errors"""
    payload = {
        "xml_file_id": uploaded_xml_id,
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


def test_validate_missing_document(uploaded_xml_id):
    """Test validation with missing document"""
    payload = {
        "xml_file_id": uploaded_xml_id,
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
    """Test validation with invalid file ID format"""
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
    # Should return 400 Bad Request for invalid file ID format
    assert response.status_code == 400
    assert 'Invalid file ID' in response.json()['detail']


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
