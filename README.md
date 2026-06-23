# Career-Ops India 🇮🇳

> **Local-first, AI-agnostic, India-adapted job search and career-switch operating system.**

Career-Ops India is a complete, self-hostable, production-grade job search, resume, application tracking, and career-switch tool designed specifically for the Indian job market. It works for both technical and non-technical roles — from Software Engineers to Sales Executives to Operations Managers.

## ✨ Key Features

### 🔍 Universal Job Search
- Search, filter, and score jobs from multiple sources
- India-specific filters: city, state, tier, work mode, salary (LPA), experience
- Automatic quality flags: scam detection, bond alerts, consultancy warnings

### 📊 10-Dimension Scoring Engine
- Role fit, experience match, salary fairness, location viability
- Switch-friendliness, company quality, work mode match, growth opportunity
- Risk scoring and freshness — all deterministic, no AI required

### 📋 Application Tracker
- 16-stage pipeline: Discovered → Saved → Applied → Interview → Offer
- Valid transition enforcement
- Notes, recruiter contact, follow-up dates, timeline

### 📝 Resume Studio
- Structured section editor: personal info, summary, experience, education, skills
- Multiple templates: Modern (ATS), Classic Indian, Minimal, Career Switch
- Master + role-specific versions

### 🔄 Career Switch Planner
- Adjacent, hard, or dual-track switch modes
- Transferable skills analysis
- 7/30/90-day action plans

### 🎤 Interview Preparation
- Role-specific question generation
- HR, technical, salary, notice period, career switch categories

### 📈 Skill Gap Planner
- Compare your skills vs. target role requirements
- Identify transferable vs. missing skills
- Actionable learning recommendations

### 🎯 Role Pack System
- 12 built-in role packs (Software, Data, Product, Sales, HR, etc.)
- India-specific title normalization (GET, MIS Executive, BDE → standard roles)
- Create unlimited custom role packs

### 🤖 AI Provider Support (Optional)
- OpenAI, Gemini, Anthropic, OpenRouter, Groq
- Ollama, LM Studio (local/offline)
- Custom OpenAI-compatible endpoints
- Test connection from admin panel

### 🔒 Privacy & Security
- 100% local-first: all data on your machine
- Zero telemetry, zero cloud sync
- API keys encrypted at rest
- Full audit logging

## 🏗️ Architecture

```
career-ops-india/
├── apps/
│   ├── web/           # React + Vite frontend + Hono API backend
│   └── site/          # Public website (planned)
├── packages/
│   ├── ai/            # AI provider adapters (OpenAI, Gemini, etc.)
│   ├── core/          # Scoring, salary, roles, pipeline, dedup, quality
│   ├── db/            # Drizzle ORM schema + SQLite client
│   └── locations/     # India states, cities, regions, work modes
├── turbo.json         # Turborepo task pipeline
├── pnpm-workspace.yaml
└── .env.example
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- pnpm 8+

### Install & Run

```bash
# Clone the repository
git clone https://github.com/Shanjai110603/Career-Ops-India.git
cd Career-Ops-India

# Install dependencies
pnpm install

# Copy environment config
cp .env.example .env

# Run the development server
pnpm dev:web
```

The app will be available at:
- Frontend: `http://localhost:5173`
- API: `http://localhost:3000`

### First-Time Setup
1. Go to **My Profile** and fill in your details
2. Optionally configure an **AI Provider** under Admin → AI Providers
3. Go to **Admin → Job Sources** and seed the default Indian portals
4. Start searching and tracking jobs!

## 📦 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite 5, React Router 6 |
| Backend API | Hono (Node.js) |
| Database | SQLite (better-sqlite3) + Drizzle ORM |
| State | Zustand |
| Monorepo | pnpm Workspaces + Turborepo |
| Styling | Vanilla CSS (custom design system) |
| AI | OpenAI, Gemini, Anthropic, Groq, Ollama, LM Studio |

## 🇮🇳 India-Specific Features

- **Salary in LPA**: Full CTC ↔ monthly ↔ in-hand conversion
- **36 States & UTs**: Complete India location database
- **50+ Cities**: Metro, Tier 1, Tier 2 classification
- **Work Modes**: Remote, WFH, walk-in, field role, campus hiring, etc.
- **Title Normalization**: Handles Indian job titles (GET, BDE, MIS Executive, etc.)
- **Market Ranges**: India-specific salary ranges for lowball detection
- **Bond Detection**: Flags service agreements and lock-in clauses
- **Consultancy Detection**: Identifies staffing/consultancy spam

## 📄 License

MIT

## 🙏 Credits

- Inspired by [santifer/career-ops](https://github.com/santifer/career-ops) — the upstream CLI-based career toolkit
- Built by [Shanjai](https://github.com/Shanjai110603)
