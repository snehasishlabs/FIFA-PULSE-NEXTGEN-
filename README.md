# 🏟️ ApexStadium: Next-Generation AI Stadium Command Center

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.0-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.1-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Express](https://img.shields.io/badge/Express-4.21-lightgrey?style=for-the-badge&logo=express)](https://expressjs.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-green?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![Gemini API](https://img.shields.io/badge/Gemini_API-Google_Gen_AI-orange?style=for-the-badge&logo=google-gemini)](https://ai.google.dev/)
[![Vitest](https://img.shields.io/badge/Vitest-Passed-green?style=for-the-badge&logo=vitest)](https://vitest.dev/)

---

## 📌 Problem Statement

Managing modern mega-stadium operations during high-capacity events (like major league sporting matches and international concerts) involves an overwhelming convergence of challenges. Operations staff must monitor thousands of live IoT metric nodes, coordinate security and emergency personnel, dispatch transport and logistics fleets, adapt to real-time crowd safety emergencies, and maintain 100% accessibility compliance for operations coordinators—all under massive time pressure.

**ApexStadium** solves this by providing a unified, full-stack command and control application. It integrates real-time telemetry streaming, a state-of-the-art Match Day Simulator, advanced AI routing engines utilizing the Google Maps Platform, an active AI Copilot powered by Google Gemini, and a comprehensive accessibility suite ensuring seamless navigation for all users.

---

## 🚀 Key Features

### 1. 📊 Command Center Dashboard
*   **Live Telemetry Synced**: Monitors live crowd density, security deployment status, gate flow rate, emergency alert triggers, and power consumption.
*   **Dynamic Visualizations**: Rendered using high-performance `recharts` for operational charting and capacity curves.
*   **Real-time Synchronization**: Dynamic live data state-handlers powered by Supabase and local high-performance fallback context.

### 2. 🧠 AIAssistant (AI Copilot)
*   **Dual-dispatch Copilot**: Dynamic natural-language intelligence powered by the standard `@google/genai` SDK on the backend server.
*   **Fault-Tolerant Conversational UI**: Features immediate local contingencies and custom response generation if network connectivity goes offline.
*   **Actionable Context Integration**: Understands current stadium statuses and recommends operational procedures.

### 3. 🎯 Match Day Simulator
*   **Operational Drills**: Enables simulated triggers for Crowd Overflows, Security Breaches, Extreme Weather, and Power Grid failures.
*   **Drill Intensity Controllers**: Interactive drill duration, severity levels, and staff count adjusting sliders.
*   **Real-Time Simulation Log**: Emits live updates as simulated events cascade throughout the stadium grids.

### 4. 🗺️ Logistics Map & AI Navigation
*   **Interactive Maps**: Configured using `@vis.gl/react-google-maps` to display transport operational grids, security posts, and stadium gates.
*   **AI Navigation Trajectory**: Calculates real-time optimal routing trajectories from current security hubs to incident gates with instant breakdown lists, alternative routes, and transit times.
*   **Failure Resilience**: Displays custom inline warnings and immediate contingency instructions if navigation routes fail to compute.

### 5. 🔔 Live Notifications
*   **Actionable Alert Dispatch**: Centralized panel classifying notifications by severity (Critical, Warning, Info).
*   **Interactive Controls**: Ability to mark alerts as resolved, filter by type, and trigger mock alarms for security drills.

### 6. ♿ Universal Accessibility Panel
*   **Visual Adjustments**: Easy toggle between Default, Large, and Extra Large display text sizes, along with an Ultra High-Contrast mode.
*   **Audio Assistance**: Fully integrated screen-reader descriptive audio captions for complex visual tables and charts.
*   **Vocal Announcer**: Real-time synthesized speech announcements for critical system notification triggers.
*   **Full Keyboard Support**: Hotkeys enabled for seamless, mouse-free command-center operation.

---

## 🏗️ Architecture Overview

```
                      ┌────────────────────────────────────────┐
                      │             Web Browser                │
                      │   (React 19, Tailwind CSS v4, Motion)  │
                      └───────────────────┬────────────────────┘
                                          │
                                   HTTP / REST API
                                          │
                                          ▼
                      ┌────────────────────────────────────────┐
                      │          Express Node.js Server        │
                      │  (Helmet, Rate-Limit, Zod, Security)   │
                      └───────┬───────────┬───────────┬────────┘
                              │           │           │
                     Real-time Sub        │      Gemini SDK
                              │       REST API        │
                              ▼           ▼           ▼
                      ┌───────────┐ ┌───────────┐ ┌───────────┐
                      │  Supabase │ │Google Maps│ │Google     │
                      │ PostgreSQL│ │ Platform  │ │ Gemini    │
                      └───────────┘ └───────────┘ └───────────┘
```

---

## 💻 Technology Stack

*   **Frontend**: React 19, TypeScript 5.8, Tailwind CSS v4, `@vis.gl/react-google-maps`, `motion` (animations), `recharts` (data charts).
*   **Backend**: Node.js, Express, `tsx` (TypeScript execute), `esbuild` (production bundle).
*   **Database & Migrations**: Supabase (PostgreSQL), dynamic database synchronization schemas in `supabase/migrations/`.
*   **AI/LLM**: Google Gen AI SDK (`@google/genai`) - Server Side integration for secret safety.
*   **Security & Safety**: Helmet, Express-Rate-Limit, Zod schemas, HTML Input Sanitizer, Secure API proxies.
*   **Testing**: Vitest, `@testing-library/react`, JSDOM, Vitest V8 Coverage.

---

## 📂 Folder Structure

```
├── .env.example                # Example configuration placeholders (no secrets)
├── .github/                    # GitHub actions & workflows
├── .gitignore                  # Exclusion file for IDEs, build files, and secrets
├── assets/                     # AI Studio metadata configurations
├── index.html                  # Core application entry point
├── package.json                # Project dependencies, metadata & execution scripts
├── server.ts                   # Core Express backend server & proxy routes
├── server/                     # Full-stack backend module code
│   ├── controllers/            # Controller layer validating requests & sending responses
│   ├── lib/                    # Core library initializers
│   ├── middleware/             # Rate limiters, security headers, and static managers
│   ├── routes/                 # Express API endpoints definition
│   ├── services/               # Core business logic (AI, Navigation, Stadium, etc.)
│   ├── types/                  # Shared backend type systems
│   ├── utils/                  # Safe formatting & processing helpers
│   └── validators/             # Zod schema validation layers
├── src/                        # Full-stack frontend module code
│   ├── main.tsx                # React entry point
│   ├── App.tsx                 # Core App layout router
│   ├── index.css               # Global Tailwind CSS directives & theme config
│   ├── components/             # Reusable UI Atoms (Button, Card, Maps, Layouts)
│   ├── features/               # High-level operational feature modules
│   │   ├── accessibility/      # Universal settings panel & audio context
│   │   ├── ai-assistant/       # Conversational Copilot interface
│   │   ├── auth/               # Secure session logins & protected portals
│   │   ├── dashboard/          # Metrics center & interactive visualization charts
│   │   ├── logistics/          # Google Maps container, grids, and trajectory list
│   │   ├── notifications/      # Real-time warning queues & resolution panels
│   │   └── simulator/          # Drills parameter configurations & logs
│   ├── hooks/                  # Custom React Hooks (Real-time data feeds, audio)
│   ├── routes/                 # Navigation schemas & routing portals
│   ├── tests/                  # Highly comprehensive Vitest validation suites
│   └── types/                  # Frontend TS definitions
└── tsconfig.json               # TypeScript compiler options
```

---

## 🛠️ Installation & Setup

### Prerequisites
*   [Node.js](https://nodejs.org/) (v18 or higher recommended)
*   npm (pre-bundled with Node.js)

### 1. Clone the repository
```bash
git clone https://github.com/your-username/apex-stadium.git
cd apex-stadium
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Variable Configuration
Create a `.env` file in the root directory by copying `.env.example`:
```bash
cp .env.example .env
```
Fill in the credentials:
```env
# Google Gemini API Config
GEMINI_API_KEY=your_gemini_api_key

# Supabase database config
SUPABASE_URL=https://your-supabase-url.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_public_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_secret

# Google Maps Platform configuration
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

---

## 🚀 Running Locally

### Development Mode
Boot both the frontend and proxy Express server concurrently:
```bash
npm run dev
```
The application will be running at `http://localhost:3000`.

### Production Build & Preview
To bundle static assets and start the production server:
```bash
npm run build
npm run preview
```
The compiled, optimized CommonJS server will boot and serve the production static files.

---

## 🧪 Testing Instructions

The application maintains a high test coverage across all major feature areas using **Vitest** and **React Testing Library**.

### Run Test Suite
To execute all tests once and view test reports:
```bash
npm run test
```

### Run Coverage Analysis
To run coverage with the `v8` tool and print coverage stats:
```bash
npm run test:coverage
```

### Covered Test Modules
1.  **Authentication**: Tests secure quick-access login, custom submissions, and protected route handlers.
2.  **Dashboard**: Tests live stadium operational status metrics, active gauges, and chart rendering.
3.  **AI Assistant**: Tests copilot prompt messaging, state progression, and network-offline contingency responses.
4.  **Simulator**: Tests parameter modifiers, sliders, and executing cascading drills in the log.
5.  **Logistics Map**: Tests Google Maps integration, transport grid visualizers, route computing warnings, and direction trajectories.
6.  **Accessibility**: Tests dynamic scale toggling, screen-reader caption summaries, and contrast styling.
7.  **Notifications**: Tests real-time warning logs, category filters, and clear alerts.

---

## 🔒 Security Hardening Highlights

*   **Secure API Proxying**: The client browser never interacts with Google Gemini or Google Maps API endpoints directly, preventing secret leakage.
*   **Request Rate Limiting**: Implements `express-rate-limit` on all `/api/` endpoints, allowing 100 requests per 15-minute window per IP to defend against DoS attempts.
*   **Secure HTTP Headers**: Loaded with `helmet` middleware to block MIME sniffing, prevent clickjacking, and enforce strict Content Security Policies.
*   **Zod Request Validation**: Server-side request bodies are fully audited against strict Zod schemas inside `/server/validators/schemas.ts` before database or model query processing.
*   **Sanitization Filters**: Injected HTML elements and custom queries are filtered to block script injection (XSS).

---

## ♿ Accessibility Suite

Built in compliance with WCAG 2.1 AA guidelines, featuring:
*   **Semantic Markup**: Full screen-reader support utilizing HTML5 elements (`main`, `nav`, `aside`, `section`).
*   **Focus Management**: Explicit keyboard tab paths and visible rings (`focus-visible:ring-2`) across all actionable elements.
*   **Descriptive Transcripts**: Visual charts and spatial maps contain matching live screen-reader summaries.
*   **Accessibility Shortcuts**:
    *   `Alt + D`: Instant dashboard jump.
    *   `Alt + L`: Instant logistics map focus.
    *   `Alt + A`: Instant copilot chat console selection.
    *   `Alt + S`: Instant simulator page transition.
    *   `Alt + C`: Toggle contrast mode instantly.

---

## 🚀 Future Roadmap

1.  **AI Predictive Congestion**: Integrate Gemini Flash to analyze historical queue logs and predict crowd choke points 30 minutes in advance.
2.  **Offline-First Cache**: PWA configuration using Service Workers to store core maps and metrics during stadium network collapses.
3.  **Multi-User Operations Room**: Establish multi-agency WebSockets for real-time collaboration between police, fire, and logistics officers.

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
