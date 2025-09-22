# Contributing to Chatbot with Memory

Thank you for your interest in contributing to the Chatbot with Memory project! This document provides guidelines and information for contributors.

## Code of Conduct

This project follows a code of conduct that we expect all contributors to follow. Please be respectful, inclusive, and constructive in all interactions.

## Getting Started

### Prerequisites
- Python 3.9+
- Node.js 16+
- Git
- OpenAI API key (for testing)

### Development Setup

1. **Fork the repository**
   - Click the "Fork" button on GitHub
   - Clone your fork locally

2. **Set up the development environment**
   ```bash
   git clone https://github.com/your-username/chatbot-with-memory.git
   cd chatbot-with-memory
   
   # Backend setup
   cd backend
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   pip install -r requirements.txt
   cp env.example .env
   # Edit .env with your OpenAI API key
   
   # Frontend setup
   cd ../frontend
   npm install
   cp env.example .env
   # Edit .env with API URL
   ```

3. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Guidelines

### Code Style

#### Python (Backend)
- Follow PEP 8 style guide
- Use type hints for function parameters and return values
- Keep functions small and focused
- Use meaningful variable and function names
- Add docstrings for classes and functions

**Example:**
```python
def get_chat_completion(messages: List[dict], conversation_id: int = None) -> str:
    """
    Generate AI response using OpenAI API with personality system.
    
    Args:
        messages: List of conversation messages
        conversation_id: Optional conversation ID for personality selection
        
    Returns:
        AI-generated response string
        
    Raises:
        RuntimeError: If OpenAI API key is not configured
    """
    # Implementation here
```

#### TypeScript/JavaScript (Frontend)
- Use TypeScript for type safety
- Follow React best practices
- Use functional components with hooks
- Keep components small and focused
- Use meaningful prop and variable names

**Example:**
```typescript
interface MessageProps {
  message: Message;
  isUser: boolean;
}

const MessageComponent: React.FC<MessageProps> = ({ message, isUser }) => {
  // Implementation here
};
```

### Commit Messages

Use clear, descriptive commit messages:

**Good:**
```
feat: add conversation search functionality
fix: resolve memory leak in message component
docs: update API documentation
refactor: simplify OpenAI service integration
```

**Bad:**
```
fix stuff
update
changes
```

### Testing

#### Backend Testing
- Write unit tests for business logic
- Test API endpoints with pytest
- Mock external dependencies (OpenAI API)
- Aim for >80% code coverage

**Example test:**
```python
def test_get_chat_completion():
    # Mock OpenAI response
    with patch('openai.ChatCompletion.create') as mock_create:
        mock_create.return_value.choices[0].message.content = "Test response"
        
        result = get_chat_completion([{"role": "user", "content": "Hello"}])
        assert result == "Test response"
```

#### Frontend Testing
- Write unit tests for components
- Test user interactions
- Mock API calls
- Test error handling

**Example test:**
```typescript
test('renders message correctly', () => {
  const message = { id: 1, role: 'user', content: 'Hello', created_at: '2024-01-01' };
  render(<MessageComponent message={message} isUser={true} />);
  expect(screen.getByText('Hello')).toBeInTheDocument();
});
```

## Pull Request Process

### Before Submitting

1. **Ensure tests pass**
   ```bash
   # Backend
   cd backend
   python -m pytest tests/
   
   # Frontend
   cd frontend
   npm test
   ```

2. **Run linting**
   ```bash
   # Backend
   cd backend
   flake8 app
   black app
   isort app
   
   # Frontend
   cd frontend
   npm run lint
   ```

3. **Update documentation**
   - Update README.md if needed
   - Add/update API documentation
   - Update setup instructions if needed

### Pull Request Template

When creating a pull request, please include:

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Tests pass locally
- [ ] New tests added for new functionality
- [ ] Manual testing completed

## Screenshots (if applicable)
Add screenshots for UI changes

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No breaking changes (or clearly documented)
```

### Review Process

1. **Automated checks** must pass
2. **Code review** by maintainers
3. **Testing** on different environments
4. **Documentation** review

## Feature Requests

### Suggesting Features

1. **Check existing issues** first
2. **Create a new issue** with:
   - Clear description
   - Use case and motivation
   - Proposed implementation (if you have ideas)
   - Label as "enhancement"

### Implementing Features

1. **Discuss the feature** in an issue first
2. **Get approval** from maintainers
3. **Create a feature branch**
4. **Implement with tests**
5. **Submit pull request**

## Bug Reports

### Reporting Bugs

When reporting bugs, please include:

1. **Clear description** of the issue
2. **Steps to reproduce**
3. **Expected behavior**
4. **Actual behavior**
5. **Environment details** (OS, Python version, Node version)
6. **Screenshots** if applicable
7. **Error messages** and logs

### Bug Report Template

```markdown
## Bug Description
Brief description of the bug

## Steps to Reproduce
1. Go to '...'
2. Click on '...'
3. Scroll down to '...'
4. See error

## Expected Behavior
What you expected to happen

## Actual Behavior
What actually happened

## Environment
- OS: [e.g. macOS, Windows, Linux]
- Python version: [e.g. 3.9.7]
- Node version: [e.g. 18.17.0]
- Browser: [e.g. Chrome, Firefox]

## Additional Context
Any other context about the problem
```

## Documentation

### Types of Documentation

1. **Code Documentation**
   - Docstrings for functions and classes
   - Inline comments for complex logic
   - Type hints for better understanding

2. **API Documentation**
   - Endpoint descriptions
   - Request/response examples
   - Error codes and messages

3. **User Documentation**
   - Setup instructions
   - Usage examples
   - Troubleshooting guides

### Documentation Standards

- Use clear, concise language
- Include code examples
- Keep documentation up to date
- Use markdown formatting consistently

## Release Process

### Version Numbering

We use [Semantic Versioning](https://semver.org/):
- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

### Release Checklist

1. **Update version numbers**
2. **Update CHANGELOG.md**
3. **Run full test suite**
4. **Update documentation**
5. **Create release tag**
6. **Deploy to production**

## Getting Help

### Questions and Support

- **GitHub Issues**: For bugs and feature requests
- **Discussions**: For questions and general discussion
- **Email**: For security issues (see SECURITY.md)

### Community Guidelines

- Be respectful and inclusive
- Help others learn and grow
- Share knowledge and best practices
- Follow the code of conduct

## Recognition

Contributors will be recognized in:
- CONTRIBUTORS.md file
- Release notes
- Project documentation

Thank you for contributing to Chatbot with Memory! 🚀
