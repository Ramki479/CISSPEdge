# 🤝 Contributing to CISSPEdge

Thank you for your interest in contributing to CISSPEdge! We welcome contributions from the community, whether it's bug fixes, feature additions, documentation improvements, or test coverage.

## 🚀 Getting Started

1. **Fork the repository** — Click the "Fork" button on GitHub
2. **Clone your fork** — `git clone https://github.com/your-username/CISSPEdge.git`
3. **Set up the project** — Run `npm install` from the project root
4. **Create a branch** — `git checkout -b feature/your-feature-name`

## 📋 Development Guidelines

### Code Style

- **TypeScript** — The project uses strict TypeScript. Write type-safe code and avoid `any` types.
- **Formatting** — Follow the existing code style (2-space indentation, single quotes, semicolons).
- **Naming** — Use camelCase for variables/functions, PascalCase for components/types/interfaces.
- **Imports** — Group imports: React/core libraries → third-party → local modules.

### Component Guidelines

- Prefer functional components with hooks over class components.
- Keep components single-responsibility. Extract reusable logic into hooks or utilities.
- Use Framer Motion for animations and transitions.
- Style with Tailwind CSS utility classes — avoid inline styles and CSS modules.

### State Management

- Use React hooks (`useState`, `useEffect`, `useRef`) for component state.
- Persist user data via Dexie.js (IndexedDB) — see `src/data/database.ts`.
- Derived state should be computed in the component, not stored.

### Testing

- Write tests for new features and bug fixes.
- Use Vitest + Testing Library for component tests.
- Run `npm test` to verify all tests pass before submitting a PR.

### Commit Messages

Use conventional commit messages:

```
feat: add domain-wise practice mode
fix: correct answer highlighting on navigation
docs: update API documentation
test: add unit tests for adaptive testing
chore: update dependencies
```

## ✅ Pull Request Process

1. Ensure your code type-checks: `npx tsc --noEmit`
2. Run tests: `npm test`
3. Lint your code: `npm run lint`
4. Build the project: `npm run build`
5. Update documentation if needed
6. Submit a PR with a clear description of the changes

## 🐛 Reporting Issues

When reporting a bug, please include:

- A clear description of the issue
- Steps to reproduce
- Expected vs. actual behavior
- Screenshots or error logs (if applicable)
- Environment info (browser, OS, device)

## 💡 Feature Requests

We welcome feature suggestions! Open an issue with:

- A clear description of the feature
- Why it would be useful
- Any implementation ideas you have

## 📚 Adding Questions

To contribute CISSP practice questions:

1. Open `src/data/questionBank.ts`
2. Follow the existing question structure (type, domain, difficulty, options, explanation)
3. Ensure questions are unique and accurate
4. Add appropriate domain tags and difficulty ratings

## 🙌 Recognition

Contributors will be acknowledged in the README. Thank you for helping make CISSPEdge better!

---

<p align="center">
  <strong>🛡️ CISSPEdge</strong> — <em>Built with ❤️ for the CISSP community</em>
</p>
