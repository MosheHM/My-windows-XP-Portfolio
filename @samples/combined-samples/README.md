# PDF Split Validation Samples

This directory contains sample files for testing the PDF split validation functionality.

## File Structure

- `sample_ground_truth.xml` - Sample XML file showing the expected split structure
- PDF files (to be added) - Sample PDF files that correspond to the XML structure

## XML Structure

The ground truth XML file contains:
- `SplittedResult` - Root element
  - `ParentComId` - Parent communication ID
  - `Owner` - Owner of the file
  - `User` - User who processed the file
  - `FilePath` - Original file path
  - `SplittedDocs` - Container for split documents
    - `SplitDoc` - Individual split document
      - `DocType` - Document type (e.g., FSI, FPL)
      - `Pages` - Page information
        - `Page` - Individual page
          - `PageNum` - Page number
          - `Rotate` - Rotation angle
      - `FilingDocTypeCode` - Document type code
      - `FilingDocTypeName` - Document type name

## Validation Criteria

The validation service checks:
1. **Type** - Document type matches (DocType, FilingDocTypeCode)
2. **Length** - Number of pages matches
3. **Number** - Page numbers are correct
4. **Score** - Overall validation score based on all criteria
