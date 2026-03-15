# Saarthi AI — Project Plan (Human Components)

> **Hackathon Duration:** 24 hours | **Team Size:** 3 | **Target:** MVP Demo

---

## 1. Project Overview

Saarthi AI is an AI-powered Government Process Copilot purpose-built for Nepal. It guides citizens through complex bureaucratic procedures by combining conversational AI, document analysis (OCR), and automated form prefilling into a single bilingual (Nepali/English) web application. The MVP focuses on **three deep processes**: (1) **Company Registration** via the Office of the Company Registrar's online system (OCR CAMIS), (2) **PAN (Permanent Account Number) Registration** via the Inland Revenue Department (IRD) portal, and (3) **Passport Application** via the Department of Passports e-portal. For each process, the system can answer procedural questions using a RAG pipeline grounded in official government data, analyze uploaded identity documents via OCR to assess "readiness" for submission, and prefill official PDF forms with extracted fields. The goal is a working demo that proves the concept end-to-end for these three processes within 24 hours.

---

## 2. Architecture Overview

### System Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                           DOCKER COMPOSE                            │
│                                                                     │
│  ┌──────────────┐     ┌──────────────────────┐     ┌─────────────┐ │
│  │   Frontend    │     │      Backend          │     │    MySQL    │ │
│  │  (React/Vite) │◄───►│   (Express.js)        │◄───►│  (Docker)  │ │
│  │  Port: 5173   │ API │   Port: 3000          │ORM  │  Port:3306 │ │
│  │               │     │                      │     │            │ │
│  │  - Tailwind   │     │  - Prisma ORM        │     │  - Users   │ │
│  │  - shadcn/ui  │     │  - LangChain Agent   │     │  - Chats   │ │
│  │  - i18next    │     │  - JWT Auth          │     │  - Docs    │ │
│  │  - pdf-lib    │     │  - SSE Streaming     │     │            │ │
│  └──────────────┘     │  - Multer (uploads)  │     └─────────────┘ │
│                        └──────────┬───────────┘                     │
└───────────────────────────────────┼─────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
              ┌─────▼─────┐  ┌─────▼─────┐  ┌─────▼──────┐
              │  LLM APIs  │  │  Pinecone  │  │  Whisper   │
              │            │  │ Vector DB  │  │  (STT)     │
              │ - OpenAI   │  │            │  │            │
              │ - Anthropic│  │ Namespaces:│  └────────────┘
              │ - Gemini   │  │ - company  │
              │            │  │ - pan      │
              │ GPT-4o     │  │ - passport │
              │ Vision OCR │  │            │
              └────────────┘  └────────────┘
```

### Technology Choices

| Layer              | Technology                          | Why                                              |
|--------------------|-------------------------------------|--------------------------------------------------|
| Frontend framework | React 18 + Vite                     | Fast HMR, team familiarity                       |
| UI components      | Tailwind CSS + shadcn/ui            | Rapid, consistent UI without custom CSS          |
| Internationalization | react-i18next                     | Nepali/English toggle with JSON locale files     |
| Backend framework  | Express.js                          | Lightweight, pairs well with LangChain JS        |
| ORM                | Prisma                              | Type-safe DB access, easy migrations             |
| Database           | MySQL 8 (Docker)                    | Relational storage for users, chats, documents   |
| LLM providers      | OpenAI / Anthropic / Gemini         | Switchable via `ACTIVE_LLM_PROVIDER` env var     |
| Agent framework    | LangChain.js                        | Tool-calling, chain composition, memory          |
| Vector DB          | Pinecone                            | Managed service, no infra to maintain            |
| OCR                | GPT-4o Vision API                   | Handles Devanagari + English mixed documents     |
| Speech-to-text     | OpenAI Whisper API                  | Nepali language support                          |
| PDF prefill        | pdf-lib (JavaScript)                | Client/server-side PDF manipulation              |
| Auth               | Custom JWT (email + password)       | Simple, no external auth service needed          |
| Streaming          | Server-Sent Events (SSE)            | Real-time token-by-token chat responses          |
| File storage       | Local filesystem (`/uploads`)       | Simple, no cloud storage dependency              |
| Containerization   | Docker + docker-compose             | Reproducible dev environment for all 3 members   |

---

## 3. Team Roles & Responsibilities

| Role | Person | Owns | Key Deliverables | Hours Focus |
|------|--------|------|------------------|-------------|
| **Frontend Dev** | Member 1 | All UI/UX, chat interface, document upload, dashboard, bilingual toggle, PDF download | - Login/register pages with JWT flow<br>- Chat interface with SSE streaming + message bubbles<br>- Document upload modal with consent capture<br>- Readiness score display (progress bar + checklist)<br>- PDF prefill preview + download button<br>- Language toggle (EN/NE) with i18next<br>- Responsive layout for demo (desktop-first)<br>- Voice input button (Whisper integration) | 0-6: Scaffold + auth UI + chat shell<br>6-12: Chat streaming + upload UI<br>12-18: Dashboard + prefill preview<br>18-24: Polish + bilingual + demo |
| **Backend Dev** | Member 2 | Express API, Prisma models, LangChain agent, RAG pipeline, OCR integration, SSE streaming, auth endpoints | - Prisma schema (User, Chat, Message, Document)<br>- Auth endpoints (register, login, me)<br>- Chat endpoint with SSE streaming<br>- LangChain agent with tool-calling (4 tools)<br>- Pinecone query integration<br>- GPT-4o Vision OCR endpoint<br>- pdf-lib prefill endpoint<br>- Whisper transcription endpoint<br>- Multi-provider LLM switching | 0-4: Scaffold + DB + auth<br>4-10: Agent + RAG + streaming<br>10-16: OCR + prefill + tools<br>16-24: Integration + fixes |
| **Flex / Data Person** | Member 3 | Data collection, Pinecone setup, embedding pipeline, demo prep, testing, presentation | - Scrape/collect all gov process data (3 processes)<br>- Clean + chunk data into embeddings-ready format<br>- Set up Pinecone index + namespaces<br>- Write + run bulk upsert script<br>- Validate RAG retrieval quality<br>- Prepare demo assets (mock IDs, forms)<br>- Create presentation slides<br>- End-to-end testing of all flows<br>- Help with frontend/backend as needed | 0-6: Data scraping + chunking<br>6-10: Pinecone setup + upsert<br>10-16: Testing + demo assets<br>16-24: Presentation + QA |

### Communication Protocol

- **Stand-ups:** Quick sync every 4 hours (hours 4, 8, 12, 16, 20)
- **Blockers:** Shout immediately in team chat, don't wait
- **Git:** Each person works on their own branch, merge to `dev` when a feature is stable
- **Shared constants:** Process names, API routes, and data schemas agreed upon in first 30 minutes
## 4. Data Collection & Curation

> **Owner:** Flex/Data Person | **Deadline:** Hour 6

### 4.1 Target Government Sources

| Process | Source | Portal/URL | What to Collect |
|---------|--------|------------|-----------------|
| **Company Registration** | Office of the Company Registrar (OCR) | CAMIS portal: `https://camis.ocr.gov.np/` | - Registration form (PDF/online)<br>- Required documents checklist<br>- Fee schedule<br>- MoA/AoA templates<br>- Step-by-step registration guide<br>- FAQ page<br>- Company types & capital requirements |
| **PAN Registration** | Inland Revenue Department (IRD) | `https://ird.gov.np/` and e-filing portal | - PAN application form<br>- Required documents list<br>- Fee structure (if any)<br>- Eligibility criteria<br>- Step-by-step application process<br>- FAQ/help section<br>- Business vs individual PAN differences |
| **Passport Application** | Department of Passports | e-Passport portal: `https://epassport.immigration.gov.np/` or `https://nepalpassport.gov.np/` | - MRP/e-Passport application form<br>- Required documents (NID, photos, etc.)<br>- Fee schedule (regular, express)<br>- Appointment booking steps<br>- Photo specifications<br>- Processing times<br>- Renewal vs new application<br>- Minor passport requirements |

### 4.2 What to Download for Each Process

For **every** process, collect the following:

1. **Official forms** — Download the actual PDF forms. If only available as online forms, screenshot each page and note every field name, label, and validation rule.
2. **Requirements list** — Every document the applicant needs (NID/citizenship certificate, photos, proof of address, etc.). Note exact specifications (photo size, number of copies, etc.).
3. **Fee schedule** — Exact amounts in NPR, payment methods accepted, and where to pay.
4. **Step-by-step guide** — The full process from "I want to register" to "I have my certificate." Include both online and in-person steps.
5. **FAQ pages** — Copy all Q&A content verbatim.
6. **Sample filled forms** — If available on the portal or via third-party guides. These are critical for the prefill feature.
7. **Contact info & office locations** — District office addresses, phone numbers, operating hours.
8. **Status check** — How to check application status after submission (URLs, reference number format).

### 4.3 Data Format & Storage

**Save each piece of content as a Markdown file** with the following YAML frontmatter:

```markdown
---
source_url: "https://camis.ocr.gov.np/registration-guide"
date_accessed: "2026-03-15"
authority: "Office of the Company Registrar"
process_type: "company-registration"
language: "en"  # or "ne" for Nepali
content_type: "guide"  # one of: guide, form, faq, fee-schedule, requirements, contact
---

# Company Registration Step-by-Step Guide

1. Visit the CAMIS portal...
2. Create an account...
...
```

**For Devanagari content:**
- Save the **original Nepali text** in a file suffixed `_ne.md`
- Save the **English translation** (use Google Translate or manual) in a file suffixed `_en.md`
- Both files should have identical structure so chunks align

### 4.4 Folder Structure

```
/data/
├── raw/
│   ├── company-registration/
│   │   ├── registration-guide_en.md
│   │   ├── registration-guide_ne.md
│   │   ├── requirements_en.md
│   │   ├── requirements_ne.md
│   │   ├── fee-schedule_en.md
│   │   ├── moa-template.pdf
│   │   └── faq_en.md
│   ├── pan-registration/
│   │   ├── pan-guide_en.md
│   │   ├── pan-guide_ne.md
│   │   ├── pan-form.pdf
│   │   ├── requirements_en.md
│   │   └── faq_en.md
│   └── passport/
│       ├── passport-guide_en.md
│       ├── passport-guide_ne.md
│       ├── requirements_en.md
│       ├── fee-schedule_en.md
│       ├── photo-specs_en.md
│       └── faq_en.md
├── processed/
│   ├── company-registration/
│   │   └── chunks.json        # Array of chunked text with metadata
│   ├── pan-registration/
│   │   └── chunks.json
│   └── passport/
│       └── chunks.json
└── embeddings/
    └── upload_log.json         # Record of what was upserted to Pinecone
```

### 4.5 Chunking Strategy

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| Chunk size | 100–400 tokens | Small enough for precise retrieval, large enough for context |
| Overlap | 50 tokens | Prevents information loss at chunk boundaries |
| Splitting method | By section/heading first, then by paragraph, then by sentence | Preserves semantic coherence |
| Minimum chunk size | 50 tokens | Discard fragments shorter than this |

**Chunking rules:**
1. **Never split a numbered list item across chunks.** If a requirement list has 10 items, keep all 10 in one chunk (even if it exceeds 400 tokens slightly).
2. **Keep fee tables intact.** A fee schedule should be one chunk.
3. **FAQ pairs stay together.** Each Q+A is one chunk.
4. **Headings travel with their content.** Every chunk should start with or include its section heading for context.

**Output format for `chunks.json`:**

```json
[
  {
    "id": "company-registration-guide-001",
    "text": "## Step 1: Create Account on CAMIS Portal\n\nVisit https://camis.ocr.gov.np and click 'Register'...",
    "metadata": {
      "source_url": "https://camis.ocr.gov.np/registration-guide",
      "process_type": "company-registration",
      "content_type": "guide",
      "language": "en",
      "chunk_index": 1,
      "total_chunks": 12,
      "last_modified": "2026-03-15",
      "authority": "Office of the Company Registrar"
    }
  }
]
```

### 4.6 Devanagari Content Handling

- **Priority:** English content first (for MVP demo). Nepali content is a stretch goal.
- If a government page is only in Nepali, translate key sections using:
  1. Google Translate (quick pass)
  2. Manual review for government-specific terms (e.g., "नागरिकता प्रमाणपत्र" = "Citizenship Certificate", not "nationality certificate")
- **Critical Nepali terms to keep untranslated** (include both scripts in chunks):
  - नागरिकता प्रमाणपत्र (Nagarikta Pramanpatra) — Citizenship Certificate
  - स्थायी लेखा नम्बर (Sthayi Lekha Nambar) — PAN
  - राहदानी (Rahadani) — Passport
  - कम्पनी दर्ता (Company Darta) — Company Registration
  - बाणिज्य विभाग — Department of Commerce
- Store a glossary file at `/data/glossary.json` mapping Nepali terms to English equivalents

### 4.7 robots.txt Compliance

Before scraping any site:

1. Check `https://{domain}/robots.txt`
2. Document what is allowed/disallowed
3. **If scraping is disallowed:** Do NOT automate. Instead, manually copy content through the browser (this is reading, not scraping).
4. **Rate limiting:** If you do scrape allowed paths, add a 2-second delay between requests.
5. **Attribution:** Always record the source URL in metadata. The app will display source attribution to users.

> **Note for the demo:** Since this is a hackathon prototype, we are manually collecting publicly available information that any citizen can access. We are not bypassing any authentication or CAPTCHA. All data is cached locally to avoid repeated requests.

---

## 5. Vector Database Setup (Pinecone)

> **Owner:** Flex/Data Person (setup) + Backend Dev (integration) | **Deadline:** Hour 8

### 5.1 Account & API Key

1. Go to [https://www.pinecone.io/](https://www.pinecone.io/)
2. Sign up for a **free tier** account (Starter plan — sufficient for hackathon)
3. After login, go to **API Keys** in the dashboard
4. Copy your API key — this goes into `.env` as `PINECONE_API_KEY`
5. Note your **environment** (e.g., `us-east-1-aws`) — this goes into `PINECONE_ENVIRONMENT`

### 5.2 Create the Index

| Setting | Value | Notes |
|---------|-------|-------|
| Index name | `saarthi-gov-docs` | Goes into `.env` as `PINECONE_INDEX` |
| Dimensions | `1536` | Matches OpenAI `text-embedding-3-small` output |
| Metric | `cosine` | Best for semantic similarity |
| Cloud | AWS | Free tier default |
| Region | `us-east-1` | Free tier default |
| Pod type | Starter (serverless) | Free, sufficient for our data volume |

**Via Pinecone dashboard:**
1. Click "Create Index"
2. Enter name: `saarthi-gov-docs`
3. Set dimensions: `1536`
4. Set metric: `cosine`
5. Select Serverless, AWS, us-east-1
6. Click "Create Index"

**Alternative — via API (the backend dev can script this):**
```javascript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });

await pc.createIndex({
  name: 'saarthi-gov-docs',
  dimension: 1536,
  metric: 'cosine',
  spec: { serverless: { cloud: 'aws', region: 'us-east-1' } }
});
```

### 5.3 Namespace Strategy

Each government process gets its own **namespace** within the single index:

| Namespace | Process | Expected Chunks |
|-----------|---------|-----------------|
| `company-registration` | Company Registration (OCR CAMIS) | ~30-60 chunks |
| `pan-registration` | PAN Registration (IRD) | ~20-40 chunks |
| `passport` | Passport Application (DoP) | ~30-50 chunks |

**Why namespaces?**
- The LangChain agent first detects the user's intent (which process they're asking about)
- Then queries **only** the relevant namespace
- This improves retrieval accuracy and reduces noise
- If the intent is "general," we query all namespaces

### 5.4 Embedding Model

| Setting | Value |
|---------|-------|
| Model | `text-embedding-3-small` (OpenAI) |
| Dimensions | 1536 |
| Cost | ~$0.02 per 1M tokens |
| Why | Best balance of quality, cost, and speed. Our total corpus is small (~100-150 chunks, well under 1M tokens) |

> **If OpenAI is down:** Fall back to `@xenova/transformers` with `all-MiniLM-L6-v2` (dimension: 384). This would require recreating the Pinecone index with dimension 384. Only do this if OpenAI API is completely unavailable.

### 5.5 Upsert Workflow

The end-to-end flow from raw data to searchable vectors:

```
Raw markdown files
       │
       ▼
   Chunking (split by section → paragraph → sentence)
       │
       ▼
   chunks.json (array of {id, text, metadata})
       │
       ▼
   Embedding (OpenAI text-embedding-3-small)
       │
       ▼
   Upsert to Pinecone (with metadata)
       │
       ▼
   Verify with test queries
```

**Bulk Upsert Script (for the backend dev to implement):**

The script should:
1. Read all `chunks.json` files from `/data/processed/{process}/`
2. For each chunk:
   - Call OpenAI embedding API: `POST /v1/embeddings` with model `text-embedding-3-small`
   - Receive 1536-dimensional vector
3. Batch upsert to Pinecone (max 100 vectors per batch):
   ```javascript
   const index = pc.index('saarthi-gov-docs');
   
   // For each process namespace
   await index.namespace('company-registration').upsert([
     {
       id: 'company-registration-guide-001',
       values: [0.0023, -0.0192, ...],  // 1536-dim vector
       metadata: {
         text: 'Step 1: Create Account on CAMIS Portal...',  // Store text in metadata for retrieval
         source_url: 'https://camis.ocr.gov.np/registration-guide',
         process_type: 'company-registration',
         content_type: 'guide',
         language: 'en',
         last_modified: '2026-03-15'
       }
     }
   ]);
   ```
4. Log results to `/data/embeddings/upload_log.json`

**Important:** Store the **original text** in Pinecone metadata (the `text` field). This way, when we query, we get the text back directly without needing a separate lookup.

### 5.6 Testing Retrieval Quality

After upserting, run these test queries against each namespace:

| Namespace | Test Query | Expected Top Result Should Mention |
|-----------|------------|-----------------------------------|
| `company-registration` | "What documents do I need to register a company in Nepal?" | Required documents list (citizenship, MoA, AoA, etc.) |
| `company-registration` | "How much does it cost to register a private limited company?" | Fee schedule with NPR amounts |
| `company-registration` | "What is the minimum capital requirement?" | Capital requirements by company type |
| `pan-registration` | "How do I apply for a PAN number?" | Step-by-step PAN application process |
| `pan-registration` | "What documents are needed for PAN registration?" | Document requirements (citizenship, photos, etc.) |
| `passport` | "How do I apply for a new passport?" | Passport application process |
| `passport` | "What is the passport fee in Nepal?" | Fee schedule (regular, express, etc.) |
| `passport` | "What are the passport photo requirements?" | Photo specifications (size, background, etc.) |

**Acceptance criteria:** The correct chunk appears in the **top 3 results** for each test query. If not, check:
- Chunk boundaries (important info may be split across chunks)
- Missing content (did we collect this data?)
- Metadata filtering (is namespace correct?)

Run a quick script or use the Pinecone dashboard "Query" feature to test.
## 6. Environment Setup

> **Everyone does this in the first 30 minutes (Hour 0)**

### 6.1 Prerequisites

Every team member must have the following installed **before** the hackathon starts:

| Tool | Version | Install Command / Link |
|------|---------|----------------------|
| Docker Desktop | Latest (4.x+) | [https://www.docker.com/products/docker-desktop/](https://www.docker.com/products/docker-desktop/) |
| Node.js | 20 LTS or higher | `brew install node` or [https://nodejs.org/](https://nodejs.org/) |
| Git | Latest | `brew install git` or pre-installed on most systems |
| VS Code (recommended) | Latest | [https://code.visualstudio.com/](https://code.visualstudio.com/) |
| Postman or Insomnia (optional) | Latest | For manual API testing |

**Verify installations:**
```bash
docker --version          # Docker version 27.x+
docker compose version    # Docker Compose version v2.x+
node --version            # v20.x+
npm --version             # 10.x+
git --version             # 2.x+
```

### 6.2 Repository Setup & Branch Strategy

```bash
# Clone the repo
git clone <repo-url> saarthi-ai
cd saarthi-ai

# Main branches
# main       — production-ready, only merge from dev when stable
# dev        — integration branch, all features merge here
# feature/*  — individual feature branches

# Each person creates their feature branch from dev:
git checkout dev
git pull origin dev
git checkout -b feature/<your-feature-name>

# Example branches:
# feature/chat-ui          (Frontend Dev)
# feature/agent-pipeline   (Backend Dev)
# feature/data-pipeline    (Flex Person)
```

**Branch rules:**
- Never push directly to `main`
- Merge to `dev` via pull request or direct merge (hackathon speed — skip PR reviews if needed)
- Pull from `dev` every 2-3 hours to stay in sync
- If merge conflicts arise, resolve together immediately

### 6.3 Project Structure

```
saarthi-ai/
├── frontend/                  # React + Vite app
│   ├── src/
│   │   ├── components/        # UI components (Chat, Upload, Dashboard, etc.)
│   │   ├── pages/             # Route pages (Login, Register, Chat, Dashboard)
│   │   ├── hooks/             # Custom React hooks
│   │   ├── services/          # API client functions
│   │   ├── i18n/              # Internationalization
│   │   │   ├── en.json        # English translations
│   │   │   └── ne.json        # Nepali translations
│   │   ├── lib/               # Utility functions
│   │   └── App.tsx
│   ├── Dockerfile
│   ├── package.json
│   └── vite.config.ts
├── backend/
│   ├── src/
│   │   ├── routes/            # Express route handlers
│   │   ├── controllers/       # Business logic
│   │   ├── services/          # LLM, Pinecone, OCR services
│   │   ├── agents/            # LangChain agent definitions
│   │   ├── tools/             # LangChain tool definitions
│   │   ├── middleware/        # Auth, error handling, upload
│   │   ├── prisma/            # Prisma schema & migrations
│   │   └── index.ts
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
├── data/                      # Government data (see Section 4)
│   ├── raw/
│   ├── processed/
│   └── embeddings/
├── uploads/                   # User-uploaded documents (gitignored)
├── docker-compose.yml
├── .env                       # Environment variables (gitignored)
├── .env.example               # Template for .env
└── README.md
```

### 6.4 Environment Variables (.env)

Create a `.env` file in the project root. **Never commit this file.**

```bash
# ============================================
# DATABASE
# ============================================
DATABASE_URL="mysql://saarthi:saarthi_pass@mysql:3306/saarthi_db"
MYSQL_ROOT_PASSWORD="rootpassword"
MYSQL_DATABASE="saarthi_db"
MYSQL_USER="saarthi"
MYSQL_PASSWORD="saarthi_pass"

# ============================================
# AUTHENTICATION
# ============================================
JWT_SECRET="your-random-secret-string-min-32-chars"

# ============================================
# LLM PROVIDERS (get keys before hackathon)
# ============================================
ACTIVE_LLM_PROVIDER="openai"        # Options: openai | anthropic | gemini

OPENAI_API_KEY="sk-..."
ANTHROPIC_API_KEY="sk-ant-..."
GEMINI_API_KEY="AIza..."

# ============================================
# VECTOR DATABASE (Pinecone)
# ============================================
PINECONE_API_KEY="pcsk_..."
PINECONE_INDEX="saarthi-gov-docs"
PINECONE_ENVIRONMENT="us-east-1-aws"

# ============================================
# SPEECH-TO-TEXT
# ============================================
WHISPER_API_KEY="sk-..."             # Same as OPENAI_API_KEY if using OpenAI Whisper

# ============================================
# FILE STORAGE
# ============================================
UPLOAD_DIR="./uploads"

# ============================================
# SERVER CONFIGURATION
# ============================================
PORT=3000
FRONTEND_URL="http://localhost:5173"
BACKEND_URL="http://localhost:3000"
NODE_ENV="development"
```

**Pre-hackathon checklist — obtain these API keys:**

| Key | Where to Get | Free Tier? | Expected Cost |
|-----|-------------|------------|---------------|
| `OPENAI_API_KEY` | [platform.openai.com](https://platform.openai.com) | $5 credit for new accounts | ~$2-5 for hackathon |
| `ANTHROPIC_API_KEY` | [console.anthropic.com](https://console.anthropic.com) | $5 credit for new accounts | Backup only |
| `GEMINI_API_KEY` | [aistudio.google.com](https://aistudio.google.com) | Generous free tier | Backup only |
| `PINECONE_API_KEY` | [pinecone.io](https://www.pinecone.io) | Free Starter plan | $0 |

### 6.5 Docker Compose Overview

The `docker-compose.yml` defines 3 services:

```yaml
# docker-compose.yml (overview — actual file may differ slightly)
services:
  frontend:
    build: ./frontend
    ports:
      - "5173:5173"
    volumes:
      - ./frontend/src:/app/src    # Hot reload
    environment:
      - VITE_BACKEND_URL=http://localhost:3000
    depends_on:
      - backend

  backend:
    build: ./backend
    ports:
      - "3000:3000"
    volumes:
      - ./backend/src:/app/src     # Hot reload
      - ./uploads:/app/uploads     # Persistent file storage
      - ./data:/app/data           # Access to gov data
    env_file:
      - .env
    depends_on:
      mysql:
        condition: service_healthy

  mysql:
    image: mysql:8
    ports:
      - "3306:3306"
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
      MYSQL_DATABASE: ${MYSQL_DATABASE}
      MYSQL_USER: ${MYSQL_USER}
      MYSQL_PASSWORD: ${MYSQL_PASSWORD}
    volumes:
      - mysql_data:/var/lib/mysql
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  mysql_data:
```

### 6.6 How to Start Everything

```bash
# 1. Clone and enter the project
git clone <repo-url> && cd saarthi-ai

# 2. Copy environment template and fill in your keys
cp .env.example .env
# Edit .env with your API keys

# 3. Start all services
docker compose up --build

# This will:
# - Build the frontend container (React + Vite)
# - Build the backend container (Express + Prisma)
# - Pull and start MySQL 8
# - Run Prisma migrations automatically
# - Start frontend on http://localhost:5173
# - Start backend on http://localhost:3000

# 4. Verify everything is running
docker compose ps
# Should show 3 containers: frontend, backend, mysql — all "Up"

# 5. Check backend health
curl http://localhost:3000/health
# Should return: {"status": "ok"}

# 6. Open the app
open http://localhost:5173
```

**Common troubleshooting:**

| Problem | Fix |
|---------|-----|
| MySQL won't start | Check if port 3306 is already in use: `lsof -i :3306` |
| Backend can't connect to MySQL | Wait 15-20 seconds — MySQL needs time to initialize. Check `docker compose logs mysql` |
| Frontend can't reach backend | Verify `VITE_BACKEND_URL` is set correctly and backend container is running |
| Prisma migration fails | Run manually: `docker compose exec backend npx prisma migrate dev` |
| Hot reload not working | Ensure volume mounts are correct in docker-compose.yml |
| Out of disk space | `docker system prune -a` to clean up old images |

---

## 7. Orchestration & Agent Design

> **Owner:** Backend Dev | **This section explains the system so all team members understand the flow**

### 7.1 High-Level Agent Loop

```
┌─────────┐     ┌──────────────┐     ┌───────────────┐     ┌────────────┐
│  User    │────►│   Intent     │────►│  Tool         │────►│  Response  │
│  Message │     │  Detection   │     │  Selection    │     │  Generation│
└─────────┘     └──────┬───────┘     └───────┬───────┘     └─────┬──────┘
                       │                      │                    │
                       │ LLM classifies       │ Agent picks       │ LLM generates
                       │ into process         │ 0-N tools         │ final answer
                       │ or "general"         │                    │ with citations
                       │                      │                    │
                       ▼                      ▼                    ▼
                ┌──────────────┐     ┌──────────────────┐  ┌──────────────┐
                │ Processes:   │     │ Available Tools:  │  │ Streamed via │
                │ - company-reg│     │ - retrieve_reqs   │  │ SSE to       │
                │ - pan-reg    │     │ - analyze_doc     │  │ frontend     │
                │ - passport   │     │ - generate_prefill│  │              │
                │ - general    │     │ - get_portal_link │  │              │
                └──────────────┘     └──────────────────┘  └──────────────┘
```

### 7.2 Intent Detection

When a user sends a message, the LLM first classifies it into one of the following intents:

| Intent | Trigger Examples | Action |
|--------|-----------------|--------|
| `company-registration` | "How do I register a company?", "What's needed for CAMIS?" | Query `company-registration` namespace |
| `pan-registration` | "I need a PAN number", "How to get PAN in Nepal?" | Query `pan-registration` namespace |
| `passport` | "How do I apply for a passport?", "Passport renewal process" | Query `passport` namespace |
| `general` | "What government services can you help with?", "Hello" | No RAG, use general system prompt |

**System prompt for intent detection:**
```
You are an intent classifier for a Nepal government services assistant.
Classify the user's message into one of: company-registration, pan-registration, passport, general.
Respond with ONLY the intent label, nothing else.
```

This is a lightweight, fast call (low max_tokens) that runs before the main agent.

### 7.3 RAG Retrieval Pipeline

Once intent is detected:

```
User query: "What documents do I need to register a company?"
       │
       ▼
[1] Embed the query using text-embedding-3-small
       │
       ▼
[2] Query Pinecone namespace "company-registration"
    - top_k: 3
    - include_metadata: true
       │
       ▼
[3] Receive top 3 matching chunks with scores
    - Chunk 1 (score: 0.92): "Required documents: 1. Citizenship certificate..."
    - Chunk 2 (score: 0.87): "Application form must include MoA and AoA..."
    - Chunk 3 (score: 0.81): "Fee schedule: Private Ltd - NPR 1,000..."
       │
       ▼
[4] Inject chunks into LLM prompt as context
       │
       ▼
[5] LLM generates grounded response with source attribution
```

**Retrieval parameters:**
- `top_k`: 3 (keep it small for speed and focus)
- `score_threshold`: 0.7 (discard low-relevance results)
- If no results above threshold, the LLM responds with "I don't have specific information about that, but here's what I can suggest..."

### 7.4 Response Generation

The main LLM call uses this system prompt structure:

```
You are Saarthi AI, a helpful assistant for Nepal government processes.
You help citizens navigate Company Registration, PAN Registration, and Passport Applications.

RULES:
1. Only answer based on the provided context. Do not make up information.
2. If the context doesn't contain the answer, say so honestly.
3. Always mention the source of your information.
4. Provide step-by-step guidance when possible.
5. Include relevant fees, timelines, and requirements.
6. If the user needs to visit a portal, provide the exact URL.
7. Respond in the same language the user writes in (English or Nepali).

CONTEXT:
{retrieved_chunks}

USER QUESTION:
{user_message}
```

Responses are **streamed** via SSE (Server-Sent Events) so the user sees tokens appearing in real-time, like ChatGPT.

### 7.5 Document Analysis Flow (OCR)

When a user uploads a document (e.g., citizenship certificate, NID):

```
┌──────────────┐     ┌──────────────────┐     ┌────────────────┐     ┌───────────────┐
│ User uploads │────►│ Backend saves    │────►│ GPT-4o Vision  │────►│ Field         │
│ document     │     │ to /uploads/     │     │ OCR analysis   │     │ Extraction    │
│ (image/PDF)  │     │ (with consent)   │     │                │     │               │
└──────────────┘     └──────────────────┘     └────────┬───────┘     └───────┬───────┘
                                                       │                     │
                                                       ▼                     ▼
                                              ┌────────────────┐     ┌───────────────┐
                                              │ Structured     │     │ Validation    │
                                              │ JSON output:   │     │ + Readiness   │
                                              │ {              │     │ Score         │
                                              │   name: "...", │     │ (0-100%)      │
                                              │   dob: "...",  │     │               │
                                              │   id_no: "..." │     │               │
                                              │ }              │     │               │
                                              └────────────────┘     └───────────────┘
```

**GPT-4o Vision prompt:**
```
Analyze this Nepal government document image. Extract all text fields you can identify.
The document may contain text in both Devanagari (Nepali) and English.

Return a JSON object with these fields (use null for any field you cannot find):
{
  "document_type": "citizenship_certificate | passport | pan_card | driving_license | other",
  "full_name_en": "",
  "full_name_ne": "",
  "date_of_birth": "",
  "gender": "",
  "id_number": "",
  "issue_date": "",
  "issue_district": "",
  "father_name": "",
  "mother_name": "",
  "permanent_address": "",
  "photo_present": true/false,
  "confidence_score": 0.0-1.0
}
```

**Readiness score calculation:**
- Each target process has a list of required fields
- Score = (fields_present / fields_required) * 100
- Example: Passport needs name, DOB, citizenship number, photo → if 3/4 present = 75%

### 7.6 PDF Prefill Flow

After OCR extracts fields:

```
Extracted fields (JSON)
       │
       ▼
Map fields to form template
(e.g., "full_name_en" → PDF field "applicant_name")
       │
       ▼
Load blank PDF form template from /data/raw/{process}/
       │
       ▼
Use pdf-lib to fill in matching fields
       │
       ▼
Save prefilled PDF to /uploads/prefilled/
       │
       ▼
Return download URL to frontend
```

**Field mapping example (passport form):**

| Extracted Field | PDF Form Field | Notes |
|----------------|---------------|-------|
| `full_name_en` | `applicant_name` | Uppercase |
| `date_of_birth` | `dob` | Format: YYYY-MM-DD |
| `id_number` | `citizenship_no` | |
| `issue_district` | `issued_district` | |
| `permanent_address` | `permanent_address` | |
| `father_name` | `father_name` | |

### 7.7 Tool-Calling Architecture

The LangChain agent has 4 tools available:

| Tool Name | Input | Output | When Called |
|-----------|-------|--------|-------------|
| `retrieve_requirements` | `{ process: string, query: string }` | Array of relevant text chunks from Pinecone | User asks about requirements, steps, fees, or any process-specific question |
| `analyze_document` | `{ document_path: string, target_process: string }` | `{ fields: {}, readiness_score: number, missing: [] }` | User uploads a document for analysis |
| `generate_prefill` | `{ fields: {}, process: string }` | `{ pdf_url: string, fields_filled: number }` | User requests a prefilled form after document analysis |
| `get_portal_link` | `{ process: string }` | `{ url: string, portal_name: string, instructions: string }` | User is ready to submit and needs the official portal link |

The LLM decides which tools to call (and in what order) based on the user's message. It can call multiple tools in sequence (e.g., analyze_document → generate_prefill).

### 7.8 Conversation Memory

- **Per-session memory:** The last 10 messages (5 user + 5 assistant) are included in the LLM context
- **Stored in MySQL:** All messages are persisted via Prisma (`Message` model with `chatId`, `role`, `content`, `timestamp`)
- **Context window management:** If conversation exceeds token limit, oldest messages are dropped from context (but remain in DB)
- **No cross-session memory:** Each chat session is independent (simplifies the MVP)
## 8. Demo Preparation

### Scripted Demo Scenarios

**Scenario 1: Company Registration (OCR CAMIS)**

| Step | User Action | Expected System Response |
|------|------------|-------------------------|
| 1 | Login to Saarthi AI | Dashboard loads, empty chat |
| 2 | Type: "I want to register a private limited company in Kathmandu" | Agent detects intent → `company_registration`. RAG retrieves OCR CAMIS requirements. Returns: checklist (name approval, MoA, AoA, directors' citizenship copies, passport photos, registered office proof, fee NPR 1,000–15,000 depending on authorized capital), estimated time 7–15 days, link to OCR CAMIS portal |
| 3 | Type: "What documents do I need?" | Returns bullet list: (1) Name approval letter, (2) Memorandum of Association, (3) Articles of Association, (4) Citizenship copies of all directors, (5) Passport-size photos, (6) Proof of registered office address, (7) Company registration fee receipt. Readiness: 0% (nothing uploaded) |
| 4 | Upload a citizenship scan (mock NID image) | Consent modal appears → user accepts. File uploads. System triggers OCR via GPT-4o Vision. Returns: extracted fields (name_en, name_ne, DOB, citizenship_number, district, issue_date), validation result (all fields present, photo clear), readiness score jumps to 20% |
| 5 | Upload a passport-size photo | System checks: face detected, resolution OK, background acceptable. Readiness jumps to 35% |
| 6 | Type: "Generate a prefilled company registration form" | Agent calls prefill tool with extracted fields. Returns downloadable PDF with director details filled in. Shows remaining missing items (MoA, AoA, name approval, office proof) |
| 7 | Type: "Give me the link to apply" | Returns: "Go to OCR CAMIS Registration Portal" button with direct URL. Warns: "You will need to complete name approval first before full registration" |

**Scenario 2: PAN Registration (IRD)**

| Step | User Action | Expected System Response |
|------|------------|-------------------------|
| 1 | Type: "I need to register for PAN for my new company" | Agent detects intent → `pan_registration`. Returns: PAN is mandatory for tax purposes, required docs (company registration certificate, citizenship of proprietor/directors, registered office proof, contact details), fees (free), process time (same day if online), link to IRD portal |
| 2 | Upload company registration certificate PDF | OCR extracts: company name, registration number, date of incorporation, directors. Readiness: 40% |
| 3 | Upload director citizenship | OCR extracts personal details. Cross-validates director name with company certificate. Readiness: 70% |
| 4 | Type: "Prefill my PAN form" | Generates prefilled PAN application with company details + director info. Shows missing: contact number, email, business type classification |
| 5 | User provides missing info via chat | Agent updates prefill. Readiness: 95%. "Download PAN Application Form" button appears. Link to IRD e-portal |

**Scenario 3: Passport Application**

| Step | User Action | Expected System Response |
|------|------------|-------------------------|
| 1 | Type (via voice): "म पासपोर्टको लागि आवेदन दिन चाहन्छु" (I want to apply for a passport) | Whisper transcribes Nepali. Agent detects intent → `passport_application`. Responds in Nepali (per user preference). Returns requirements in Nepali + English |
| 2 | Type: "What documents do I need?" | Returns: (1) Citizenship certificate original + copy, (2) Passport-size photos (3.5x4.5cm, white background), (3) Old passport if renewal, (4) Application fee NPR 5,000 (regular) / NPR 10,000 (express). Process: 7–30 days depending on type. Warns: "Biometric enrollment at District Administration Office required — cannot be done online" |
| 3 | Upload citizenship scan | OCR extracts all fields. Validates. Readiness: 45% |
| 4 | Upload passport photo | Quality check: resolution, face position, background. Readiness: 65% |
| 5 | Type: "Prefill my passport form" | Prefilled form generated. Missing: old passport number (if renewal), emergency contact. Readiness: 80% |
| 6 | Type: "Where do I submit?" | Returns link to Department of Passports e-portal for pre-enrollment + warns about mandatory biometric visit |

### Demo Preparation Checklist

- [ ] **Mock Documents** (create using placeholder/synthetic data — never real PII):
  - Mock Nepali citizenship card image (front + back) with Devanagari + English text
  - Mock passport-size photo (use a stock photo or team member's photo with consent)
  - Mock company registration certificate PDF
  - Mock MoA template PDF
- [ ] **Pre-seeded RAG Data**: ensure Pinecone has indexed pages for all 3 processes
- [ ] **Test the full flow** end-to-end for each scenario at least twice before demo
- [ ] **Prepare backup screenshots** in case live demo fails
- [ ] **Internet connection**: ensure stable connection for LLM API calls

### Presentation Talking Points

| Slide | Points |
|-------|--------|
| Problem | Nepal's government processes are fragmented across dozens of portals. Citizens waste hours figuring out requirements, often get rejected for missing documents. No unified guide exists. |
| Solution | Saarthi AI is an agentic copilot that understands what you need, checks your documents, pre-fills forms, and gives you the exact link to apply. It speaks Nepali and English. |
| How It Works | RAG-powered retrieval from official government sources → GPT-4o Vision for document OCR → intelligent form prefilling → readiness scoring → direct portal links |
| Demo | Live walkthrough of company registration scenario |
| Tech Stack | React + Express + Prisma + MySQL + Pinecone + LangChain + GPT-4o + Whisper |
| Impact | Reduces process research time from hours to minutes. Prevents rejections by catching missing/invalid documents upfront. Bilingual access for broader reach. |
| Future | Auto-submission where portals allow, rejection prediction, status tracking, municipal process expansion |

---

## 9. Legal, Privacy & Safety

### Consent Capture

Before any document upload, display a modal with:

```
DOCUMENT UPLOAD CONSENT

By uploading documents to Saarthi AI, you acknowledge and agree that:

1. Your documents will be analyzed by AI (OpenAI GPT-4o) to extract 
   relevant information for form filling purposes.
2. Extracted data is used solely to assist you with government 
   process applications.
3. Your documents are stored locally on the server and are NOT 
   shared with any third party beyond the AI processing API.
4. You can request deletion of your documents at any time.
5. This is a prototype tool — always verify information against 
   official government sources before submission.

☐ I consent to AI-powered document analysis
☐ I understand this is a prototype and will verify information independently

[Accept]  [Decline]
```

Log consent to the `Consent` database table with: user_id, consent_type, timestamp, IP address.

### Data Handling Rules

| Rule | Implementation |
|------|---------------|
| Document storage | Local filesystem only (`/uploads/{user_id}/`) |
| Encryption at rest | Encrypt upload directory (or note as future improvement) |
| API transmission | Documents sent to OpenAI API for OCR only; not stored by OpenAI (use API, not ChatGPT) |
| Data retention | Documents auto-deleted after 30 days (or on user request) |
| No credential storage | Never store government portal passwords/credentials |
| Audit log | Log all document access and analysis events |

### Scraping Compliance

- Check `robots.txt` for every government site before scraping
- Only scrape publicly available pages (no login-required content)
- Cache scraped content; don't hit servers repeatedly
- Attribute sources with URLs in all RAG-generated responses
- If a site explicitly forbids scraping, manually copy-paste content instead

### CAPTCHA & Biometric Warnings

Display these warnings when relevant:

- **CAPTCHA**: "The [portal name] uses CAPTCHA verification. You will need to complete this manually. We cannot bypass CAPTCHA."
- **Biometrics**: "Passport/Driving License applications require in-person biometric enrollment (fingerprint and photo) at the designated office. This step cannot be done online."
- **Digital Signature**: "Some submissions require a digital signature. Ensure you have your digital certificate ready."

### Privacy Policy Template (Short)

```
SAARTHI AI — PRIVACY POLICY (Hackathon Prototype)

Data We Collect: Name, email (for account), uploaded documents 
(for analysis), chat history (for continuity).

How We Use It: To analyze documents, pre-fill forms, and provide 
government process guidance via AI.

Third-Party Services: OpenAI (document analysis and chat), 
Pinecone (document search). No data is sold or shared for 
marketing.

Data Storage: All data is stored locally. Documents can be 
deleted on request.

Security: JWT authentication, bcrypt password hashing.

Contact: [team email]

Note: This is a hackathon prototype. Do not upload highly 
sensitive documents in production without additional security 
measures.
```

### "What AI Can vs Can't Do" Disclaimer

Display in the app footer or as an info tooltip:

```
WHAT SAARTHI AI CAN DO:
✓ Identify required documents for government processes
✓ Extract information from your documents using OCR
✓ Check document completeness and quality
✓ Pre-fill application forms with extracted data
✓ Provide direct links to official government portals
✓ Answer questions about process steps, fees, and timelines

WHAT SAARTHI AI CANNOT DO:
✗ Submit applications on your behalf (most portals don't allow it)
✗ Bypass CAPTCHAs or two-factor authentication
✗ Replace in-person biometric verification
✗ Guarantee approval of your application
✗ Provide legal advice
✗ Access your government portal accounts
```

---

## 10. 24-Hour Timeline

### Hour-by-Hour Schedule

| Hours | Phase | Frontend Dev | Backend Dev | Flex Person |
|-------|-------|-------------|-------------|-------------|
| 0–1 | **Setup** | Clone repo, install Node, Docker Desktop, scaffold Vite+React project, install Tailwind+shadcn | Clone repo, scaffold Express+TS project, write Prisma schema, set up docker-compose.yml | Create Pinecone account, get all API keys (OpenAI, Anthropic, Gemini), set up .env file |
| 1–2 | **Setup** | Set up routing (React Router), create Layout, Header, Sidebar shells | Run `docker-compose up`, verify MySQL, run `prisma migrate`, create seed data | Start data collection: scrape OCR CAMIS pages, download forms |
| 2–4 | **Core Build** | Build LoginForm + RegisterForm + AuthContext, connect to backend auth API | Implement auth routes (register/login/me), JWT middleware, password hashing | Scrape IRD portal pages, Department of Passports pages. Save as markdown + metadata |
| 4–6 | **Core Build** | Build ChatWindow, ChatInput, MessageBubble components (static first, no streaming yet) | Build chat routes (create/list/get/delete chat), message model, basic LLM integration (single provider first) | Process scraped data: chunk into 100-400 token segments, prepare for embedding |
| 6–8 | **Integration** | Integrate SSE streaming into ChatWindow, build StreamingMessage component | Build SSE streaming endpoint, integrate LangChain agent with intent detection + RAG retrieval | Run embedding script: embed all chunks → upsert to Pinecone. Test retrieval quality with sample queries |
| 8–10 | **Integration** | Build UploadZone, ConsentModal, FilePreview. Connect file upload to backend | Build document upload route (multer), OCR service (GPT-4o Vision), document analysis pipeline | Write system prompts for each process. Test agent responses. Fix RAG retrieval issues |
| 10–12 | **Features** | Build AnalysisResult component, show OCR results inline in chat | Build prefill service (pdf-lib), implement all 5 LangChain tools, connect end-to-end | Prepare PDF form templates for each process. Create field mapping files |
| 12–14 | **Features** | Build DashboardPage: ReadinessScore, RequirementsList, ActionButton components | Build process routes (requirements, checklist, prefill endpoints) | Test full flows: company reg, PAN, passport. Note bugs and edge cases |
| 14–16 | **Features** | Build DocumentsPage, DocumentCard grid. Speech-to-text mic button (useSpeech hook) | Build Whisper endpoint, multi-provider LLM switching, additional error handling | Prepare mock documents for demo. Test OCR with Devanagari text |
| 16–18 | **Polish** | Implement i18n (react-i18next), create EN + NE translation files, LanguageToggle | Add remaining validation, consent logging, health check endpoint | Write demo script. Practice demo flow. Identify any data gaps in RAG |
| 18–20 | **Polish** | Responsive design fixes, loading states, error states, empty states | Integration testing, fix bugs found by flex person, optimize streaming | Fill RAG gaps. Add more FAQ content to Pinecone. Test edge cases |
| 20–22 | **Polish** | Final UI polish, animations, color consistency, test all flows | Final bug fixes, ensure docker-compose works clean from scratch | Run through all 3 demo scenarios end-to-end. Record backup demo video |
| 22–24 | **Demo Prep** | Freeze code. Help with presentation slides | Freeze code. Ensure all services start cleanly | Prepare presentation. Practice pitch (2–3 dry runs) |

### Milestone Checkpoints

| Hour | Must Have Completed |
|------|-------------------|
| 6 | Auth working, basic chat UI rendering, docker-compose running |
| 12 | RAG retrieval working in chat, document upload + OCR functional |
| 18 | All 3 demo flows working end-to-end, prefill generating PDFs |
| 22 | Bilingual working, speech-to-text working, demo rehearsed |
| 24 | Presentation ready, backup plans in place |

---

## 11. Risk Mitigation

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Government sites down or blocking scraping | Medium | High | Pre-scrape and cache all data in Phase 1. Keep local copies of all pages/forms |
| Pinecone issues (rate limits, downtime) | Low | High | Prepare FAISS fallback: keep embeddings locally as numpy/JSON. Switch retrieval to in-memory search |
| OpenAI API rate limits or downtime | Medium | Critical | Multi-provider support: switch to Anthropic or Gemini via env var. Keep a cached set of "standard" responses for common queries |
| OCR accuracy low on Devanagari text | Medium | Medium | Allow manual field correction in UI. Show extracted text with confidence scores. Let user edit before prefill |
| Time crunch — not enough hours | High | High | **Cut order**: (1) Drop bilingual — English only, (2) Drop speech-to-text, (3) Reduce to 2 processes, (4) Skip dashboard — keep chat only, (5) Use hardcoded responses instead of RAG for demo |
| MySQL/Docker issues on team machines | Medium | Medium | Have a SQLite fallback schema ready. Or use a cloud MySQL (PlanetScale free tier) |
| Prisma migration failures | Low | Medium | Keep a raw SQL backup of the schema. Can run manually if Prisma fails |
| CORS issues between frontend/backend | High | Low | Configure CORS middleware early. Use Vite proxy in development |
| Team member unavailable/blocked | Low | High | All three members should have basic understanding of the full stack. Document everything |
| Demo fails live | Medium | High | Record a backup demo video. Prepare screenshots of each step |

### Emergency Fallback Plan (if behind schedule at hour 16)

1. **Cut bilingual support** — English only
2. **Cut speech-to-text** — text input only
3. **Reduce to 2 processes** — Company Registration + PAN only
4. **Hardcode some RAG responses** — if Pinecone isn't working, return pre-written responses for known queries
5. **Skip auto-prefill** — show extracted data as JSON instead of filling PDF
6. **Focus on one polished demo flow** — make company registration perfect

---

## 12. Success Criteria

### Minimum Demo Requirements (Must Have)

- [ ] User can register and login
- [ ] User can start a chat and ask about a government process
- [ ] Agent correctly identifies the process and returns requirements via RAG
- [ ] User can upload a document (with consent modal)
- [ ] System extracts fields from the document using OCR
- [ ] System shows readiness score and missing items
- [ ] System provides a direct link to the official portal
- [ ] At least 2 of 3 processes work end-to-end
- [ ] Chat history is saved and loadable

### Impressive Demo Additions (Should Have)

- [ ] Prefilled PDF form downloadable
- [ ] All 3 processes working
- [ ] Bilingual UI (English + Nepali)
- [ ] Speech-to-text input working
- [ ] Dashboard view with visual readiness score
- [ ] Streaming responses (token by token)
- [ ] Tool call indicators shown in chat ("Analyzing document...", "Retrieving requirements...")

### Wow Factor (Nice to Have)

- [ ] Nepali voice input transcribed and responded to in Nepali
- [ ] Cross-document validation (e.g., director name on citizenship matches MoA)
- [ ] Side-by-side: uploaded doc preview + extracted fields overlay
- [ ] Process comparison: show what's shared between processes (e.g., citizenship needed for all 3)
- [ ] Auto-navigate user through the portal steps with annotated screenshots
