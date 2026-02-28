This Product Requirements Document (PRD) outlines **LifeOS**, a high-performance, integrated ecosystem designed for a technical professional to manage career, finances, and personal knowledge with zero friction.

---

## Product Requirements Document: LifeOS (v1.4)

### 1. Executive Summary

**LifeOS** is a "Speed-First" personal operating system. It prioritizes instantaneous data capture and retrieval to match the speed of thought. By combining a robust technical backend with a whimsical, Ghibli-inspired aesthetic, the app serves as both a high-utility tool and a digital sanctuary.

---

### 2. Core Technical Stack

The stack is selected for **Extreme Velocity** in both development and runtime performance.

| Layer | Technology | Specification |
| --- | --- | --- |
| **Framework** | **Next.js 16 + React 19** | Utilizing latest Concurrent Rendering and Server Actions. |
| **Language** | **TypeScript** | Strict typing for end-to-end reliability. |
| **UI Layer** | **shadcn/ui + Tailwind CSS** | Component-driven "Compose Fast" architecture. |
| **Backend** | **Next.js API Routes (Hot)** | Persistent Node.js runtime to eliminate cold starts. |
| **Database/ORM** | **Prisma + PostgreSQL** | Schema-first management with persistent connection pooling. |
| **Auth** | **Auth.js v5 + bcryptjs** | Modern, session-based secure authentication. |
| **Validation** | **Zod** | Type-safe request/response validation. |
| **Data Fetching** | **SWR** | Real-time caching with **Optimistic UI** updates. |
| **Deployment** | **Railway** | VPS-style persistent hosting (Global/Edge proximity). |
| **Testing** | **Vitest + Playwright** | Unit, Integration, and E2E quality gates. |

---

### 3. Functional Requirements

#### **A. The Inkwell (The Brain Dump)**

* **Widget-First Access:** A dedicated mobile widget for iOS/Android that launches a "Lite" capture interface instantly.
* **Two-Tap Entry:** The workflow must allow a user to tap the widget, type, and submit in under 5 seconds.
* **Zero-Delay Persistence:** Upon submission, the UI must reflect the new entry immediately (Optimistic Update) while the server processes the write in the background.
* **Contextual Auto-Tagging:** Silent attachment of metadata (timestamp, location: Pune, active project context) without user input.

#### **B. The Project Nexus**

* **Work-Stream Integration:** Unified dashboard for technical side projects like **JobScout** and **HippoAi**.
* **Kanban/Sprint Views:** Rapid toggling between high-level roadmaps and granular backend tasks (e.g., concurrency optimization, RAG implementation).
* **Scraper Integration:** Direct feed for job listings or technical documentation gathered via automated tools.

#### **C. The Wealth Vault**

* **Net Worth Tracker:** Real-time aggregation of portfolios (Stocks, Mutual Funds, Savings).
* **Velocity Metrics:** Visual tracking of aggressive monthly savings targets (e.g., 4 Lakh+ milestones) and burn-rate analytics.
* **Financial Discipline:** Automated nudges for investment windows and dividend logging.

#### **D. The Athenaeum (Personal Knowledge)**

* **RAG-Ready Storage:** Structural support for vector-based querying of personal notes and technical resolutions.
* **Bi-Directional Linking:** Automatically surface "Brain Dumps" relevant to the technical topic currently being viewed.

---

### 4. Performance & Reliability Requirements

* **The "No-Delay" Mandate:** No operation shall have a noticeable UI delay. If a network request takes >50ms, the UI must proceed with an optimistic state.
* **Always-Hot Backend:** The system must avoid serverless sleep cycles. Connections to PostgreSQL must remain active to bypass handshake overhead.
* **Mobile Responsiveness:** The `/capture` route must be a "Leaf Page" with minimal bundle size for near-instant loading on mobile data.

---

### 5. UI/UX Philosophy

* **Theme:** "Whimsical Minimalism." Leveraging **shadcn/ui** for structure but styled with a **Studio Ghibli** palette—warm creams, sage greens, and wood-grain textures.
* **Mascot Integration:** Subtle presence of characters (Hippo, Cero, Axo) providing status updates or "Yin-Yang" balance reminders for work-life harmony.
* **Focus State:** A "Deep Work" mode that strips the UI of all elements except the active project's technical documentation.

---

### 6. Quality & Deployment Gates

* **Performance Testing:** Automated Playwright scripts to measure "Time to Interactive" for the Brain Dump widget.
* **Type Safety:** 100% TypeScript coverage required for all API routes and Prisma models.
* **CI/CD:** Automatic staging deployments on Railway for every feature branch to allow for instant visual verification.

---

Would you like me to focus next on the **Prisma Schema definition** for these integrated modules, or perhaps the **Zod validation structures** for the fast-capture API?