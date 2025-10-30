"""
PDF Split Validation Module

This module provides functionality to validate PDF split results against XML ground truth files.
It parses the XML structure and validates that the split PDFs match the expected structure.
"""

import xml.etree.ElementTree as ET
from typing import List, Dict, Optional, Tuple, Any
from pathlib import Path
from pydantic import BaseModel


class PageInfo(BaseModel):
    """Page information from XML"""
    page_num: int
    rotate: int = 0


class SplitDocInfo(BaseModel):
    """Split document information from XML"""
    doc_type: str
    primary_num: Optional[str] = None
    pages: List[PageInfo]
    filing_doc_type_code: Optional[str] = None
    filing_doc_type_name: Optional[str] = None
    processed_file: Optional[str] = None


class SplittedResultInfo(BaseModel):
    """Complete splitted result information from XML"""
    parent_com_id: Optional[str] = None
    owner: Optional[str] = None
    user: Optional[str] = None
    file_path: Optional[str] = None
    split_docs: List[SplitDocInfo]


class ValidationResult(BaseModel):
    """Validation result for a single split document"""
    doc_index: int
    doc_type_match: bool
    page_count_match: bool
    page_numbers_match: bool
    score: float
    details: Dict[str, Any]


class OverallValidationResult(BaseModel):
    """Overall validation result"""
    total_docs: int
    validated_docs: int
    overall_score: float
    doc_results: List[ValidationResult]
    summary: Dict[str, Any]


def parse_xml_ground_truth(xml_path: Path) -> SplittedResultInfo:
    """
    Parse XML ground truth file and extract split document information
    
    Args:
        xml_path: Path to the XML ground truth file
        
    Returns:
        SplittedResultInfo object containing parsed information
        
    Raises:
        FileNotFoundError: If XML file doesn't exist
        ET.ParseError: If XML is malformed
    """
    if not xml_path.exists():
        raise FileNotFoundError(f"XML file not found: {xml_path}")
    
    tree = ET.parse(xml_path)
    root = tree.getroot()
    
    # Extract root level information
    parent_com_id = root.findtext('ParentComId')
    owner = root.findtext('Owner')
    user = root.findtext('User')
    file_path = root.findtext('FilePath')
    
    # Parse split documents
    split_docs = []
    splitted_docs_elem = root.find('SplittedDocs')
    
    if splitted_docs_elem is not None:
        for split_doc_elem in splitted_docs_elem.findall('SplitDoc'):
            # Extract document information
            doc_type = split_doc_elem.findtext('DocType', '')
            primary_num = split_doc_elem.findtext('PrimaryNum')
            filing_doc_type_code = split_doc_elem.findtext('FilingDocTypeCode')
            filing_doc_type_name = split_doc_elem.findtext('FilingDocTypeName')
            processed_file = split_doc_elem.findtext('ProcessedFile')
            
            # Parse pages
            pages = []
            pages_elem = split_doc_elem.find('Pages')
            if pages_elem is not None:
                for page_elem in pages_elem.findall('Page'):
                    page_num = int(page_elem.findtext('PageNum', '0'))
                    rotate = int(page_elem.findtext('Rotate', '0'))
                    pages.append(PageInfo(page_num=page_num, rotate=rotate))
            
            split_docs.append(SplitDocInfo(
                doc_type=doc_type,
                primary_num=primary_num,
                pages=pages,
                filing_doc_type_code=filing_doc_type_code,
                filing_doc_type_name=filing_doc_type_name,
                processed_file=processed_file
            ))
    
    return SplittedResultInfo(
        parent_com_id=parent_com_id,
        owner=owner,
        user=user,
        file_path=file_path,
        split_docs=split_docs
    )


def validate_split_document(
    ground_truth_doc: SplitDocInfo,
    actual_doc_info: Dict[str, Any],
    doc_index: int
) -> ValidationResult:
    """
    Validate a single split document against ground truth
    
    Args:
        ground_truth_doc: Expected document information from XML
        actual_doc_info: Actual document information (should include doc_type, page_count, page_numbers)
        doc_index: Index of the document being validated
        
    Returns:
        ValidationResult with scores and details
    """
    # Validate document type
    actual_doc_type = actual_doc_info.get('doc_type', '')
    doc_type_match = (
        actual_doc_type == ground_truth_doc.doc_type or
        actual_doc_type == ground_truth_doc.filing_doc_type_code
    )
    
    # Validate page count
    expected_page_count = len(ground_truth_doc.pages)
    actual_page_count = actual_doc_info.get('page_count', 0)
    page_count_match = expected_page_count == actual_page_count
    
    # Validate page numbers
    expected_page_numbers = sorted([p.page_num for p in ground_truth_doc.pages])
    actual_page_numbers = sorted(actual_doc_info.get('page_numbers', []))
    page_numbers_match = expected_page_numbers == actual_page_numbers
    
    # Calculate score (weighted average)
    score_components = {
        'doc_type': 1.0 if doc_type_match else 0.0,
        'page_count': 1.0 if page_count_match else 0.0,
        'page_numbers': 1.0 if page_numbers_match else 0.0
    }
    
    # Weights: type=40%, count=30%, numbers=30%
    score = (
        score_components['doc_type'] * 0.4 +
        score_components['page_count'] * 0.3 +
        score_components['page_numbers'] * 0.3
    )
    
    details = {
        'expected_doc_type': ground_truth_doc.doc_type,
        'actual_doc_type': actual_doc_type,
        'expected_page_count': expected_page_count,
        'actual_page_count': actual_page_count,
        'expected_page_numbers': expected_page_numbers,
        'actual_page_numbers': actual_page_numbers,
        'score_components': score_components
    }
    
    return ValidationResult(
        doc_index=doc_index,
        doc_type_match=doc_type_match,
        page_count_match=page_count_match,
        page_numbers_match=page_numbers_match,
        score=score,
        details=details
    )


def validate_pdf_split(
    xml_ground_truth_path: Path,
    actual_split_info: List[Dict[str, Any]]
) -> OverallValidationResult:
    """
    Validate PDF split results against XML ground truth
    
    Args:
        xml_ground_truth_path: Path to XML ground truth file
        actual_split_info: List of dictionaries containing actual split document information.
                          Each dict should have: doc_type, page_count, page_numbers
        
    Returns:
        OverallValidationResult with overall score and individual document results
    """
    # Parse ground truth
    ground_truth = parse_xml_ground_truth(xml_ground_truth_path)
    
    # Validate count matches
    expected_count = len(ground_truth.split_docs)
    actual_count = len(actual_split_info)
    count_match = expected_count == actual_count
    
    # Validate each document
    doc_results = []
    min_count = min(expected_count, actual_count)
    
    for i in range(min_count):
        result = validate_split_document(
            ground_truth.split_docs[i],
            actual_split_info[i],
            i
        )
        doc_results.append(result)
    
    # Calculate overall score
    if doc_results:
        overall_score = sum(r.score for r in doc_results) / len(doc_results)
        # Penalize if counts don't match
        if not count_match:
            overall_score *= 0.8
    else:
        overall_score = 0.0
    
    summary = {
        'expected_doc_count': expected_count,
        'actual_doc_count': actual_count,
        'count_match': count_match,
        'all_docs_valid': all(r.score == 1.0 for r in doc_results) and count_match,
        'avg_doc_type_match': sum(1 for r in doc_results if r.doc_type_match) / len(doc_results) if doc_results else 0,
        'avg_page_count_match': sum(1 for r in doc_results if r.page_count_match) / len(doc_results) if doc_results else 0,
        'avg_page_numbers_match': sum(1 for r in doc_results if r.page_numbers_match) / len(doc_results) if doc_results else 0
    }
    
    return OverallValidationResult(
        total_docs=expected_count,
        validated_docs=len(doc_results),
        overall_score=overall_score,
        doc_results=doc_results,
        summary=summary
    )
