# Contributing to Nutriclaude

## Philosophy

Nutriclaude prioritizes:

- **Determinism**
- **Simplicity**
- **Clear boundaries**
- **Schema-first design**

All contributions must maintain these principles.

## Development Setup

1. Clone repository
2. Create `.env` file
3. Add required environment variables
4. Install dependencies
5. Run development server

## Contribution Guidelines

- Keep AI outputs deterministic
- Maintain strict JSON schema validation
- No feature creep without roadmap update
- All new DB fields require migration file
- All prompts must be versioned

## Pull Request Requirements

- Clear description
- No breaking schema changes
- Type-safe code
- Lint passing
- Updated documentation

## Branch Naming Convention

```
feature/<feature-name>
fix/<bug-name>
refactor/<area>
```

## Code Standards

- TypeScript preferred
- Functional decomposition
- Explicit return types
- No hidden side effects

## Commit Message Convention

```
feat: add workout logging
fix: correct macro calculation
refactor: separate claude service
```
