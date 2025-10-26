# Contributing to Windows XP Portfolio

Thank you for your interest in contributing! This document provides guidelines for contributing to the project.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/My-windows-XP-Portfolio.git`
3. Create a feature branch: `git checkout -b feature/your-feature-name`
4. Make your changes
5. Test thoroughly
6. Submit a pull request

## Development Setup

See [QUICKSTART.md](QUICKSTART.md) for detailed setup instructions.

Quick setup:
```bash
# Backend services
cd services/llm-service && pip install -r requirements.txt
cd ../file-service && pip install -r requirements.txt

# Frontend
cd ../../client && npm install
```

## Project Structure

```
.
├── client/                 # React frontend
├── services/
│   ├── llm-service/       # Python LLM service
│   └── file-service/      # Python file service
├── k8s/                   # Kubernetes manifests
└── scripts/               # Deployment scripts
```

## Coding Standards

### TypeScript/React (Client)

- Use TypeScript for all new files
- Follow existing component patterns
- Use functional components with hooks
- Add types for props and state
- Format with Prettier (if configured)

Example:
```typescript
interface MyComponentProps {
  title: string;
  onClose: () => void;
}

const MyComponent: React.FC<MyComponentProps> = ({ title, onClose }) => {
  // Component implementation
};
```

### Python (Backend)

- Follow PEP 8 style guide
- Use type hints
- Write docstrings for functions and classes
- Use async/await for I/O operations
- Handle errors gracefully

Example:
```python
from typing import List, Optional

async def process_data(data: List[str]) -> Optional[dict]:
    """
    Process the input data and return results.
    
    Args:
        data: List of strings to process
        
    Returns:
        Dictionary with results or None if failed
    """
    try:
        # Implementation
        return result
    except Exception as e:
        logger.error(f"Processing failed: {e}")
        return None
```

## Making Changes

### Frontend Changes

1. Create/modify components in `client/components/`
2. Update services in `client/services/` if API changes
3. Test in development mode: `npm run dev`
4. Build: `npm run build`
5. Verify no TypeScript errors: `npx tsc --noEmit`

### Backend Changes

1. Modify Python files in respective service directories
2. Update requirements.txt if adding dependencies
3. Test locally: `uvicorn main:app --reload`
4. Check syntax: `python -m py_compile *.py`
5. Update API documentation in README if endpoints change

### Kubernetes Changes

1. Modify YAML files in `k8s/`
2. Test with: `kubectl apply -f k8s/ --dry-run=client -n portfolio`
3. Validate: `kubectl apply -f k8s/ -n portfolio`
4. Update k8s README with any configuration changes

## Testing

### Manual Testing

1. Start all services (Kubernetes or locally via ./scripts/dev-start.sh)
2. Test each feature:
   - Chat functionality with streaming
   - File upload/download
   - UI interactions
3. Check browser console for errors
4. Test on multiple browsers (Chrome, Firefox, Safari)

### API Testing

```bash
# Test LLM service
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "test", "use_rag": true}'

# Test file service
curl -X POST http://localhost:8001/upload \
  -F "file=@test.txt"
```

### Automated Tests

If adding tests (encouraged!):

```bash
# Frontend
cd client
npm test

# Backend
cd services/llm-service
pytest tests/
```

## Adding Dependencies

### Frontend Dependencies

```bash
cd client
npm install package-name
# Or for dev dependencies
npm install -D package-name
```

Update package.json and commit the changes.

### Backend Dependencies

```bash
cd services/llm-service  # or file-service
pip install package-name
pip freeze > requirements.txt
```

Commit the updated requirements.txt.

## Documentation

Update documentation when:
- Adding new features
- Changing API endpoints
- Modifying configuration options
- Changing deployment procedures

Files to update:
- Service-specific READMEs
- Main README.md
- QUICKSTART.md (if setup changes)
- API documentation (inline comments)

## Pull Request Process

1. **Update documentation** for any changes
2. **Test thoroughly** - all functionality should work
3. **Write clear commit messages**
   - Use present tense: "Add feature" not "Added feature"
   - Be descriptive: "Add streaming support to chat" not "Update chat"
4. **Create pull request** with:
   - Clear title
   - Description of changes
   - Testing performed
   - Screenshots for UI changes
5. **Respond to feedback** - address review comments
6. **Keep commits clean** - squash if needed

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
How was this tested?

## Screenshots (if applicable)
Add screenshots for UI changes

## Checklist
- [ ] Code follows project style
- [ ] Documentation updated
- [ ] Tests pass
- [ ] No console errors
```

## Areas for Contribution

### High Priority

- [ ] Add authentication/authorization
- [ ] Implement file type validation
- [ ] Add automated tests
- [ ] Improve error handling
- [ ] Add monitoring/logging

### Features

- [ ] User profiles
- [ ] Multiple chat sessions
- [ ] File sharing with expiring links
- [ ] Image thumbnail generation
- [ ] Advanced RAG features
- [ ] Mobile responsiveness improvements

### Documentation

- [ ] Video tutorials
- [ ] API examples
- [ ] Deployment guides (AWS, Azure, GCP)
- [ ] Troubleshooting guide expansion
- [ ] Performance optimization guide

### Infrastructure

- [ ] CI/CD pipeline
- [ ] Automated testing
- [ ] Performance benchmarks
- [ ] Load testing
- [ ] Security scanning

## Code Review

All submissions require review. We use GitHub pull requests for this purpose.

Reviewers will check:
- Code quality and style
- Functionality and testing
- Documentation updates
- Security considerations
- Performance impact

## Security

If you discover a security vulnerability:
1. **Do NOT** open a public issue
2. Email: mhm23811@gmail.com
3. Include:
   - Description of vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

## Questions?

- Open an issue for questions
- Check existing issues first
- Tag appropriately (question, bug, feature)

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes
- Project documentation

Thank you for contributing! 🎉
