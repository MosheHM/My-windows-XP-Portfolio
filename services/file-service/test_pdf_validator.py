"""
Unit tests for PDF split validation
"""

import pytest
from pathlib import Path
import sys
import os

# Add the service directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from pdf_validator import (
    parse_xml_ground_truth,
    validate_split_document,
    validate_pdf_split,
    SplitDocInfo,
    PageInfo,
    ValidationResult,
    OverallValidationResult
)


# Sample XML path - adjust based on your setup
SAMPLE_XML_PATH = Path(__file__).parent.parent.parent / "@samples" / "combined-samples" / "sample_ground_truth.xml"


def test_parse_xml_ground_truth():
    """Test parsing XML ground truth file"""
    if not SAMPLE_XML_PATH.exists():
        pytest.skip(f"Sample XML not found at {SAMPLE_XML_PATH}")
    
    result = parse_xml_ground_truth(SAMPLE_XML_PATH)
    
    # Verify basic structure
    assert result.parent_com_id == "pxutqxvrveky75v6dwhymg00000000"
    assert result.owner == "GEULAK"
    assert result.user == "GEULAK"
    
    # Verify split docs
    assert len(result.split_docs) == 2
    
    # First document
    assert result.split_docs[0].doc_type == "FSI"
    assert result.split_docs[0].filing_doc_type_code == "FSI"
    assert result.split_docs[0].filing_doc_type_name == "Supplier Invoice"
    assert len(result.split_docs[0].pages) == 1
    assert result.split_docs[0].pages[0].page_num == 1
    
    # Second document
    assert result.split_docs[1].doc_type == "FPL"
    assert result.split_docs[1].filing_doc_type_code == "FPL"
    assert result.split_docs[1].filing_doc_type_name == "Packing List"
    assert len(result.split_docs[1].pages) == 1
    assert result.split_docs[1].pages[0].page_num == 41


def test_validate_split_document_perfect_match():
    """Test validation with perfect match"""
    ground_truth = SplitDocInfo(
        doc_type="FSI",
        pages=[PageInfo(page_num=1, rotate=0)],
        filing_doc_type_code="FSI",
        filing_doc_type_name="Supplier Invoice"
    )
    
    actual = {
        'doc_type': 'FSI',
        'page_count': 1,
        'page_numbers': [1]
    }
    
    result = validate_split_document(ground_truth, actual, 0)
    
    assert result.doc_type_match is True
    assert result.page_count_match is True
    assert result.page_numbers_match is True
    assert result.score == 1.0


def test_validate_split_document_type_mismatch():
    """Test validation with document type mismatch"""
    ground_truth = SplitDocInfo(
        doc_type="FSI",
        pages=[PageInfo(page_num=1, rotate=0)],
        filing_doc_type_code="FSI"
    )
    
    actual = {
        'doc_type': 'FPL',
        'page_count': 1,
        'page_numbers': [1]
    }
    
    result = validate_split_document(ground_truth, actual, 0)
    
    assert result.doc_type_match is False
    assert result.page_count_match is True
    assert result.page_numbers_match is True
    assert result.score < 1.0
    assert result.score == 0.6  # Only type fails (40% weight)


def test_validate_split_document_page_count_mismatch():
    """Test validation with page count mismatch"""
    ground_truth = SplitDocInfo(
        doc_type="FSI",
        pages=[PageInfo(page_num=1), PageInfo(page_num=2)],
        filing_doc_type_code="FSI"
    )
    
    actual = {
        'doc_type': 'FSI',
        'page_count': 1,
        'page_numbers': [1]
    }
    
    result = validate_split_document(ground_truth, actual, 0)
    
    assert result.doc_type_match is True
    assert result.page_count_match is False
    assert result.page_numbers_match is False
    assert result.score == 0.4  # Only type matches (40% weight)


def test_validate_split_document_page_numbers_mismatch():
    """Test validation with page numbers mismatch"""
    ground_truth = SplitDocInfo(
        doc_type="FSI",
        pages=[PageInfo(page_num=1), PageInfo(page_num=2)],
        filing_doc_type_code="FSI"
    )
    
    actual = {
        'doc_type': 'FSI',
        'page_count': 2,
        'page_numbers': [1, 3]
    }
    
    result = validate_split_document(ground_truth, actual, 0)
    
    assert result.doc_type_match is True
    assert result.page_count_match is True
    assert result.page_numbers_match is False
    assert result.score == 0.7  # Type and count match (70% weight)


def test_validate_pdf_split_complete():
    """Test complete PDF split validation"""
    if not SAMPLE_XML_PATH.exists():
        pytest.skip(f"Sample XML not found at {SAMPLE_XML_PATH}")
    
    # Perfect match scenario
    actual_split_info = [
        {
            'doc_type': 'FSI',
            'page_count': 1,
            'page_numbers': [1]
        },
        {
            'doc_type': 'FPL',
            'page_count': 1,
            'page_numbers': [41]
        }
    ]
    
    result = validate_pdf_split(SAMPLE_XML_PATH, actual_split_info)
    
    assert result.total_docs == 2
    assert result.validated_docs == 2
    assert result.overall_score == 1.0
    assert len(result.doc_results) == 2
    assert result.summary['all_docs_valid'] is True


def test_validate_pdf_split_partial_match():
    """Test PDF split validation with partial match"""
    if not SAMPLE_XML_PATH.exists():
        pytest.skip(f"Sample XML not found at {SAMPLE_XML_PATH}")
    
    # First doc matches, second doesn't
    actual_split_info = [
        {
            'doc_type': 'FSI',
            'page_count': 1,
            'page_numbers': [1]
        },
        {
            'doc_type': 'WRONG',
            'page_count': 2,
            'page_numbers': [40, 41]
        }
    ]
    
    result = validate_pdf_split(SAMPLE_XML_PATH, actual_split_info)
    
    assert result.total_docs == 2
    assert result.validated_docs == 2
    assert result.overall_score < 1.0
    assert result.summary['all_docs_valid'] is False


def test_validate_pdf_split_count_mismatch():
    """Test PDF split validation with document count mismatch"""
    if not SAMPLE_XML_PATH.exists():
        pytest.skip(f"Sample XML not found at {SAMPLE_XML_PATH}")
    
    # Only one document provided when two expected
    actual_split_info = [
        {
            'doc_type': 'FSI',
            'page_count': 1,
            'page_numbers': [1]
        }
    ]
    
    result = validate_pdf_split(SAMPLE_XML_PATH, actual_split_info)
    
    assert result.total_docs == 2
    assert result.validated_docs == 1
    # Score is penalized for count mismatch
    assert result.overall_score < 1.0
    assert result.summary['count_match'] is False


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
