<div align="center">
  <img src="public/favicon.svg" alt="CISSPEdge Logo" width="80" height="80" />
  <h1 align="center">🛡️ CISSPEdge</h1>
  <p align="center">
    <strong>Your Offline-First CISSP Exam Preparation Coach</strong>
  </p>
  <p align="center">
    <a href="#features">Features</a> •
    <a href="#getting-started">Getting Started</a> •
    <a href="#project-structure">Project Structure</a> •
    <a href="#tech-stack">Tech Stack</a> •
    <a href="#mobile-app">Mobile App</a> •
    <a href="#contributing">Contributing</a>
  </p>

  <p align="center">
    <img src="https://img.shields.io/badge/version-1.0.0-blue?style=flat-square" alt="Version" />
    <img src="https://img.shields.io/badge/license-MIT-green?style=flat-square" alt="License" />
    <img src="https://img.shields.io/badge/platform-Web%20%7C%20Android-lightgrey?style=flat-square" alt="Platform" />
    <img src="https://img.shields.io/badge/build-passing-brightgreen?style=flat-square" alt="Build" />
    <img src="https://img.shields.io/badge/PRs-welcome-brightgreen?style=flat-square" alt="PRs Welcome" />
  </p>
</div>

---

## 📋 Overview

CISSPEdge is a comprehensive, offline-first study companion for CISSP (Certified Information Systems Security Professional) certification candidates. Built with React and TypeScript, it provides a rich set of tools including mock exams, adaptive testing, spaced-repetition flashcards, and detailed performance analytics — all running entirely on-device via IndexedDB.

Whether you're a beginner building foundational knowledge or an expert refining your exam readiness, CISSPEdge adapts to your skill level and helps you focus on your weakest domains.

## ✨ Features

### 📝 Mock Exams & Adaptive Testing
- **Full exam simulations** — 100+ questions timed to mimic the real CISSP exam
- **Domain-wise practice** — Focus on specific domains (Security Operations, IAM, etc.)
- **Quick practice** — 10 random questions for on-the-go study
- **Adaptive difficulty** — Questions dynamically adjust based on your performance using Item Response Theory (IRT)
- **Auto-advance with feedback** — Get instant correct/incorrect feedback with optional auto-advance

### 🃏 Spaced Repetition Flashcards
- **Smart scheduling** — Cards are reviewed based on the SM-2 algorithm for optimal retention
- **Domain-tagged** — Organize flashcards by CISSP domain
- **Confidence-based ratings** — Rate your recall from "Blackout" to "Perfect"

### 📊 Performance Analytics
- **Domain accuracy cards** — Ranked weakest → strongest with visual progress bars
- **Focus This Week** — AI-driven identification of your top 3 weakest areas
- **CISSP Readiness Score** — Overall readiness, confidence, and pass probability estimates
- **Detailed breakdowns** — Radar charts, bar charts, and per-domain analytics

### 🧠 Study Tools
- **Knowledge Map** — Visual overview of all 8 CISSP domains
- **Interactive Notes** — Domain-tagged notes for personalized study material
- **Study Planner** — Plan your weekly study sessions
- **Recommendations** — Personalized study recommendations based on performance
- **Question Review** — Review past answers with correct/incorrect highlights

### 📱 Cross-Platform
- **Web app** — Runs in any modern browser
- **Android APK** — Native Android app via Capacitor
- **Offline-first** — All data stored locally in IndexedDB (no internet required after initial load)

## 🚀 Getting Started

### Prerequisites

- **Node.js** >= 18.x
- **npm** >= 9.x (or **pnpm** / **yarn**)

### Installation

```bash
# Clone the repository
git clone https://github.com/Ramki479/CISSPEdge.git

# Navigate to the project directory
cd CISSPEdge

# Install dependencies
npm install

# Start the development server
npm run dev
```

The app will be available at `http://localhost:5173`.

### Build for Production

```bash
npm run build
npm run preview   # Preview the production build
```

## 📁 Project Structure

```
CISSPEdge/
├── public/                  # Static assets (favicon, icons)
├── src/
│   ├── components/          # Shared UI components
│   │   ├── DragDropQuestion.tsx   # Drag-and-drop question UI
│   │   ├── Layout.tsx             # App shell with navigation
│   │   └── ThemeProvider.tsx      # Theming and dark mode
│   ├── data/
│   │   ├── database.ts            # IndexedDB (Dexie.js) data layer
│   │   └── questionBank.ts        # CISSP question bank (500+ questions)
│   ├── pages/
│   │   ├── Analytics.tsx          # Performance analytics dashboard
│   │   ├── Dashboard.tsx          # Main dashboard
│   │   ├── Flashcards.tsx         # Spaced-repetition flashcards
│   │   ├── KnowledgeMap.tsx       # Domain knowledge visualization
│   │   ├── LearningPath.tsx       # Learning path by level
│   │   ├── Notes.tsx              # Study notes
│   │   ├── Onboarding.tsx         # First-time user onboarding
│   │   ├── QuestionReview.tsx     # Review past answers
│   │   ├── Recommendations.tsx    # Study recommendations
│   │   ├── Settings.tsx           # App settings
│   │   ├── StudyPlanner.tsx       # Study session planner
│   │   └── TestEngine.tsx         # Mock exam engine
│   ├── types/
│   │   └── index.ts               # TypeScript type definitions
│   ├── utils/
│   │   ├── adaptiveTesting.ts     # IRT-based adaptive difficulty
│   │   ├── analytics.ts           # Analytics calculations
│   │   ├── gamification.ts        # XP/streak/gamification logic
│   │   ├── recommendations.ts     # Personalization engine
│   │   └── spacedRepetition.ts    # SM-2 card scheduler
│   ├── App.tsx                    # App root with routing
│   ├── main.tsx                   # Entry point
│   └── index.css                  # Global styles (Tailwind)
├── android/                  # Android native project (Capacitor)
├── capacitor.config.ts        # Capacitor configuration
├── package.json
├── tsconfig.json
├── vite.config.ts
└── vitest.config.ts
```

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | React 19 + TypeScript 6 |
| **Build Tool** | Vite 8 |
| **Styling** | Tailwind CSS 4 |
| **Animation** | Framer Motion 12 |
| **Charts** | Recharts 3 |
| **Data Layer** | Dexie.js (IndexedDB) |
| **Testing** | Vitest + Testing Library |
| **Linting** | ESLint + TypeScript-ESLint |
| **Mobile** | Capacitor 8 (Android) |

## 📱 Mobile App

Build the Android APK:

```bash
npm run build                              # Build the web app
npx cap sync android                       # Sync with Capacitor
cd android && ./gradlew assembleDebug      # Build the APK
```

The APK will be at `android/app/build/outputs/apk/debug/app-debug.apk`.

> **Note:** You need the Android SDK installed to build the APK. Set `ANDROID_HOME` to your SDK path.

## 🧪 Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch
```

## 🏗️ Building & Deployment

```bash
# Type-check the project
npx tsc --noEmit

# Build for production
npm run build

# Preview the production build
npm run preview

# Lint the codebase
npm run lint
```

## 🤝 Contributing

Contributions are welcome! Please read the [CONTRIBUTING.md](CONTRIBUTING.md) guide for detailed instructions.

### Quick Start for Contributors

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests (`npm test`) and type-check (`npx tsc --noEmit`)
5. Commit and push
6. Open a Pull Request

## 🛡️ Security

If you discover a security vulnerability, please see our [SECURITY.md](SECURITY.md) for disclosure procedures.

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- The CISSP domains and structure are based on (ISC)²'s official CISSP Common Body of Knowledge (CBK)
- Flashcard scheduling inspired by the SM-2 algorithm (SuperMemo)
- Built with ❤️ for the CISSP community

---

<p align="center">
  <strong>🛡️ CISSPEdge</strong> — <em>Your Path to CISSP Certification</em>
</p>
