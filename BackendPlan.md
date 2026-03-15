# Saarthi AI — Backend Development Plan

> **AI Government Process Copilot for Nepal**
> Stack: Express.js + TypeScript | Prisma + MySQL | LangChain.js | Pinecone | GPT-4o Vision | pdf-lib | SSE

---

## 1. Project Structure

```
backend/
├── prisma/
│   ├── schema.prisma              # Database schema definition
│   └── seed.ts                    # Seed data (processes, sample users)
├── src/
│   ├── index.ts                   # Entry point — Express app bootstrap
│   ├── config/
│   │   ├── env.ts                 # Env var validation & typed config export
│   │   ├── database.ts            # Prisma client singleton
│   │   └── llm.ts                 # Multi-provider LLM config & factory
│   ├── middleware/
│   │   ├── auth.ts                # JWT verification middleware
│   │   ├── upload.ts              # Multer config (file size, types, dest)
│   │   ├── errorHandler.ts        # Global error handler
│   │   └── cors.ts                # CORS configuration
│   ├── routes/
│   │   ├── auth.routes.ts         # /api/auth/*
│   │   ├── chat.routes.ts         # /api/chat/*
│   │   ├── document.routes.ts     # /api/document/*
│   │   ├── process.routes.ts      # /api/process/*
│   │   └── health.routes.ts       # /api/health
│   ├── controllers/
│   │   ├── auth.controller.ts     # Register, login, me
│   │   ├── chat.controller.ts     # CRUD chats, send message, SSE stream
│   │   ├── document.controller.ts # Upload, analyze (OCR), list, delete
│   │   └── process.controller.ts  # Requirements, checklist, prefill
│   ├── services/
│   │   ├── llm/
│   │   │   ├── provider.ts        # Abstract LLMProvider interface
│   │   │   ├── openai.ts          # OpenAI implementation (GPT-4o, embeddings, vision)
│   │   │   ├── anthropic.ts       # Anthropic implementation (Claude 3.5 Sonnet)
│   │   │   ├── gemini.ts          # Google Gemini implementation (Gemini 1.5 Pro)
│   │   │   └── index.ts           # Factory: getLLMProvider()
│   │   ├── rag/
│   │   │   ├── pinecone.ts        # Pinecone client init & helpers
│   │   │   ├── embeddings.ts      # Text → OpenAI embeddings (1536-dim)
│   │   │   ├── retriever.ts       # Query Pinecone + rerank results
│   │   │   └── ingest.ts          # Bulk upsert script for knowledge base
│   │   ├── agent/
│   │   │   ├── copilot.ts         # Main LangChain agent orchestrator
│   │   │   ├── tools.ts           # LangChain tool definitions
│   │   │   ├── intents.ts         # Intent classification (LLM-based)
│   │   │   └── prompts.ts         # System prompts per process type
│   │   ├── ocr/
│   │   │   ├── vision.ts          # GPT-4o Vision API calls (base64 images)
│   │   │   ├── validator.ts       # Field validation logic per doc type
│   │   │   └── extractor.ts       # Structured field extraction from OCR
│   │   ├── prefill/
│   │   │   ├── generator.ts       # pdf-lib form filling logic
│   │   │   └── templates.ts       # Field mappings per process type
│   │   ├── speech.ts              # OpenAI Whisper API integration
│   │   └── auth.service.ts        # JWT generation/verification + bcrypt
│   ├── types/
│   │   ├── index.ts               # Shared types, augmented Express Request
│   │   ├── chat.ts                # Chat & message types
│   │   ├── document.ts            # Document & OCR result types
│   │   └── process.ts             # Process & requirements types
│   └── utils/
│       ├── logger.ts              # Structured logger (winston/pino)
│       ├── sse.ts                 # SSE helper (headers, send, heartbeat)
│       └── fileUtils.ts           # File path, extension, cleanup helpers
├── uploads/                       # User-uploaded files (gitignored)
├── templates/                     # PDF form templates (one per process)
├── data/
│   └── processed/                 # Pre-processed knowledge base JSONs
├── package.json
├── tsconfig.json
├── Dockerfile
├── .env.example
└── .dockerignore
```

### Key Conventions

| Convention | Rule |
|---|---|
| File naming | `kebab-case.ts` for files, `PascalCase` for types/classes |
| Exports | Named exports only (no default exports) |
| Error handling | All async route handlers wrapped in try/catch or express-async-errors |
| Env access | Never use `process.env` directly — always go through `config/env.ts` |
| DB access | Never import PrismaClient directly — always use `config/database.ts` singleton |
| Response format | `{ success: true, data: {...} }` or `{ error: true, message: "...", code: "..." }` |

### package.json Dependencies

```json
{
  "name": "saarthi-ai-backend",
  "version": "1.0.0",
  "scripts": {
    "dev": "ts-node-dev --respawn --transpile-only src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:seed": "ts-node prisma/seed.ts",
    "prisma:studio": "prisma studio",
    "ingest": "ts-node src/services/rag/ingest.ts"
  },
  "dependencies": {
    "@anthropic-ai/sdk": "^0.24.0",
    "@google/generative-ai": "^0.7.0",
    "@langchain/community": "^0.2.0",
    "@langchain/core": "^0.2.0",
    "@langchain/openai": "^0.1.0",
    "@pinecone-database/pinecone": "^2.2.0",
    "@prisma/client": "^5.14.0",
    "bcrypt": "^5.1.1",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.19.2",
    "express-async-errors": "^3.1.1",
    "jsonwebtoken": "^9.0.2",
    "langchain": "^0.2.0",
    "multer": "^1.4.5-lts.1",
    "openai": "^4.47.0",
    "pdf-lib": "^1.17.1",
    "uuid": "^9.0.1",
    "winston": "^3.13.0",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@types/bcrypt": "^5.0.2",
    "@types/cors": "^2.8.17",
    "@types/express": "^4.17.21",
    "@types/jsonwebtoken": "^9.0.6",
    "@types/multer": "^1.4.11",
    "@types/node": "^20.12.0",
    "@types/uuid": "^9.0.8",
    "prisma": "^5.14.0",
    "ts-node": "^10.9.2",
    "ts-node-dev": "^2.0.0",
    "typescript": "^5.4.5"
  }
}
```

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "moduleResolution": "node",
    "baseUrl": "./src",
    "paths": {
      "@config/*": ["config/*"],
      "@middleware/*": ["middleware/*"],
      "@routes/*": ["routes/*"],
      "@controllers/*": ["controllers/*"],
      "@services/*": ["services/*"],
      "@types/*": ["types/*"],
      "@utils/*": ["utils/*"]
    }
  },
  "include": ["src/**/*", "prisma/seed.ts"],
  "exclude": ["node_modules", "dist"]
}
```

### .env.example

```env
# Server
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Database
DATABASE_URL="mysql://saarthi:saarthi_pass@localhost:3306/saarthi_db"

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# LLM Providers (set ACTIVE_LLM_PROVIDER to: openai | anthropic | gemini)
ACTIVE_LLM_PROVIDER=openai
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GEMINI_API_KEY=AI...

# Pinecone
PINECONE_API_KEY=pc-...
PINECONE_INDEX=saarthi-gov-docs

# File Upload
MAX_FILE_SIZE_MB=25
UPLOAD_DIR=./uploads

# Whisper
WHISPER_MODEL=whisper-1

# Embedding
EMBEDDING_MODEL=text-embedding-3-small
EMBEDDING_DIMENSION=1536
```

---

## 2. Database Schema (Prisma)

### prisma/schema.prisma

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

// ─── Enums ────────────────────────────────────────────────

enum ProcessType {
  COMPANY_REGISTRATION
  PAN_REGISTRATION
  PASSPORT_APPLICATION
}

enum MessageRole {
  user
  assistant
  system
}

enum ConsentType {
  DATA_PROCESSING
  DOCUMENT_STORAGE
  AI_ANALYSIS
  TERMS_OF_SERVICE
}

enum DocumentType {
  CITIZENSHIP
  PASSPORT_PHOTO
  COMPANY_MOA
  PAN_CERTIFICATE
  BIRTH_CERTIFICATE
  UTILITY_BILL
  RENTAL_AGREEMENT
  OTHER
}

// ─── Models ───────────────────────────────────────────────

model User {
  id                  String     @id @default(uuid())
  email               String     @unique
  password            String     // bcrypt hashed
  name                String
  language_preference String     @default("en") // "en" | "ne"
  created_at          DateTime   @default(now())
  updated_at          DateTime   @updatedAt

  // Relations
  chats               Chat[]
  documents           Document[]
  consents            Consent[]

  @@index([email])
  @@map("users")
}

model Chat {
  id           String       @id @default(uuid())
  user_id      String
  title        String       @default("New Chat")
  process_type ProcessType?
  created_at   DateTime     @default(now())
  updated_at   DateTime     @updatedAt

  // Relations
  user         User         @relation(fields: [user_id], references: [id], onDelete: Cascade)
  messages     Message[]
  documents    Document[]

  @@index([user_id])
  @@index([process_type])
  @@index([created_at])
  @@map("chats")
}

model Message {
  id         String      @id @default(uuid())
  chat_id    String
  role       MessageRole
  content    String      @db.LongText // LongText for large assistant responses
  metadata   Json?       // Store tool calls, sources, intent, etc.
  created_at DateTime    @default(now())

  // Relations
  chat       Chat        @relation(fields: [chat_id], references: [id], onDelete: Cascade)

  @@index([chat_id])
  @@index([created_at])
  @@map("messages")
}

model Document {
  id                String       @id @default(uuid())
  user_id           String
  chat_id           String?      // Optional: linked to a chat conversation
  file_path         String       // Relative path in /uploads
  file_name         String       // Original filename
  file_type         String       // MIME type (image/png, application/pdf, etc.)
  file_size         Int          // Size in bytes
  document_type     DocumentType @default(OTHER)
  process_type      ProcessType?
  ocr_result        Json?        // Extracted fields from GPT-4o Vision
  validation_result Json?        // Validation results with readiness score
  created_at        DateTime     @default(now())

  // Relations
  user              User         @relation(fields: [user_id], references: [id], onDelete: Cascade)
  chat              Chat?        @relation(fields: [chat_id], references: [id], onDelete: SetNull)

  @@index([user_id])
  @@index([chat_id])
  @@index([process_type])
  @@index([document_type])
  @@map("documents")
}

model Consent {
  id           String      @id @default(uuid())
  user_id      String
  consent_type ConsentType
  granted_at   DateTime    @default(now())
  ip_address   String?

  // Relations
  user         User        @relation(fields: [user_id], references: [id], onDelete: Cascade)

  @@unique([user_id, consent_type]) // One consent record per type per user
  @@index([user_id])
  @@map("consents")
}
```

### Database Client Singleton — `src/config/database.ts`

```typescript
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'info', 'warn', 'error']
        : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
```

### Seed Script — `prisma/seed.ts`

```typescript
import { PrismaClient, ProcessType } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Create a demo user
  const hashedPassword = await bcrypt.hash('demo123456', 10);

  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@saarthi.ai' },
    update: {},
    create: {
      email: 'demo@saarthi.ai',
      password: hashedPassword,
      name: 'Demo User',
      language_preference: 'en',
    },
  });

  console.log('Seeded demo user:', demoUser.email);

  // Create a sample chat for each process type
  const processTypes: ProcessType[] = [
    'COMPANY_REGISTRATION',
    'PAN_REGISTRATION',
    'PASSPORT_APPLICATION',
  ];

  for (const processType of processTypes) {
    const chat = await prisma.chat.create({
      data: {
        user_id: demoUser.id,
        title: `${processType.replace(/_/g, ' ').toLowerCase()} — demo`,
        process_type: processType,
      },
    });

    // Add a welcome message from assistant
    await prisma.message.create({
      data: {
        chat_id: chat.id,
        role: 'assistant',
        content: `Namaste! I'm Saarthi AI. I can help you with ${processType
          .replace(/_/g, ' ')
          .toLowerCase()}. What would you like to know?`,
        metadata: { intent: processType.toLowerCase() },
      },
    });
  }

  // Add consents for demo user
  await prisma.consent.createMany({
    data: [
      {
        user_id: demoUser.id,
        consent_type: 'DATA_PROCESSING',
        ip_address: '127.0.0.1',
      },
      {
        user_id: demoUser.id,
        consent_type: 'AI_ANALYSIS',
        ip_address: '127.0.0.1',
      },
    ],
    skipDuplicates: true,
  });

  console.log('Seed completed successfully.');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

### Migration Commands

```bash
# Generate Prisma client (run after any schema change)
npx prisma generate

# Create and apply migration
npx prisma migrate dev --name init

# Apply migrations in production
npx prisma migrate deploy

# Seed the database
npx ts-node prisma/seed.ts

# Open Prisma Studio (visual DB browser)
npx prisma studio
```

### Schema Notes

| Decision | Rationale |
|---|---|
| UUID for IDs | Prevents enumeration attacks, safe for client exposure |
| `@db.LongText` on Message.content | LLM responses can be very long (>65KB) |
| JSON fields for OCR/validation | Schema varies by document type; JSON is flexible |
| `onDelete: Cascade` on Chat→Message | Deleting a chat removes all its messages |
| `onDelete: SetNull` on Document→Chat | Deleting a chat keeps documents (user uploaded them) |
| Unique constraint on Consent | Prevents duplicate consent records per type |
| Separate DocumentType enum | Allows validation rules per document type |
## 3. API Endpoints

All endpoints are prefixed with `/api`. Protected endpoints require `Authorization: Bearer <token>` header.

### Standard Response Envelope

```typescript
// Success
{ "success": true, "data": { ... } }

// Error
{ "error": true, "message": "Human-readable error", "code": "ERROR_CODE" }
```

---

### 3.1 Auth Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | No | Register a new user |
| POST | `/api/auth/login` | No | Login and get JWT |
| GET | `/api/auth/me` | Yes | Get current user profile |

#### POST `/api/auth/register`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "Ram Sharma"
}
```

**Validation Rules:**
- `email`: valid email format, max 255 chars
- `password`: min 8 chars, max 128 chars
- `name`: min 2 chars, max 100 chars

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "uuid-here",
      "email": "user@example.com",
      "name": "Ram Sharma",
      "language_preference": "en",
      "created_at": "2026-03-15T10:00:00.000Z"
    }
  }
}
```

**Error Responses:**
| Status | Code | When |
|--------|------|------|
| 400 | `VALIDATION_ERROR` | Missing or invalid fields |
| 409 | `EMAIL_EXISTS` | Email already registered |
| 500 | `INTERNAL_ERROR` | Server error |

---

#### POST `/api/auth/login`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "uuid-here",
      "email": "user@example.com",
      "name": "Ram Sharma",
      "language_preference": "en",
      "created_at": "2026-03-15T10:00:00.000Z"
    }
  }
}
```

**Error Responses:**
| Status | Code | When |
|--------|------|------|
| 400 | `VALIDATION_ERROR` | Missing fields |
| 401 | `INVALID_CREDENTIALS` | Wrong email or password |
| 500 | `INTERNAL_ERROR` | Server error |

---

#### GET `/api/auth/me`

**Headers:** `Authorization: Bearer <token>`

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid-here",
      "email": "user@example.com",
      "name": "Ram Sharma",
      "language_preference": "en",
      "created_at": "2026-03-15T10:00:00.000Z"
    }
  }
}
```

**Error Responses:**
| Status | Code | When |
|--------|------|------|
| 401 | `UNAUTHORIZED` | Missing or invalid token |
| 404 | `USER_NOT_FOUND` | Token valid but user deleted |

---

### 3.2 Chat Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/chat` | Yes | Create new chat |
| GET | `/api/chat` | Yes | List user's chats |
| GET | `/api/chat/:id` | Yes | Get chat with messages |
| DELETE | `/api/chat/:id` | Yes | Delete a chat |
| POST | `/api/chat/:id/message` | Yes | Send message (SSE response) |
| POST | `/api/chat/:id/speech` | Yes | Upload audio for STT |

#### POST `/api/chat`

**Request Body:**
```json
{
  "title": "Company Registration Help",
  "process_type": "COMPANY_REGISTRATION"
}
```
Both fields are optional. `title` defaults to `"New Chat"`. `process_type` is one of: `COMPANY_REGISTRATION`, `PAN_REGISTRATION`, `PASSPORT_APPLICATION`, or `null`.

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "chat": {
      "id": "chat-uuid",
      "title": "Company Registration Help",
      "process_type": "COMPANY_REGISTRATION",
      "created_at": "2026-03-15T10:00:00.000Z",
      "updated_at": "2026-03-15T10:00:00.000Z"
    }
  }
}
```

---

#### GET `/api/chat`

**Query Parameters:**
- `page` (optional, default: 1)
- `limit` (optional, default: 20, max: 50)
- `process_type` (optional, filter by process type)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "chats": [
      {
        "id": "chat-uuid",
        "title": "Company Registration Help",
        "process_type": "COMPANY_REGISTRATION",
        "created_at": "2026-03-15T10:00:00.000Z",
        "updated_at": "2026-03-15T10:05:00.000Z",
        "message_count": 12,
        "last_message_preview": "The next step is to..."
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 5,
      "total_pages": 1
    }
  }
}
```

---

#### GET `/api/chat/:id`

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "chat": {
      "id": "chat-uuid",
      "title": "Company Registration Help",
      "process_type": "COMPANY_REGISTRATION",
      "created_at": "2026-03-15T10:00:00.000Z"
    },
    "messages": [
      {
        "id": "msg-uuid-1",
        "role": "assistant",
        "content": "Namaste! How can I help you with company registration?",
        "metadata": null,
        "created_at": "2026-03-15T10:00:00.000Z"
      },
      {
        "id": "msg-uuid-2",
        "role": "user",
        "content": "What documents do I need?",
        "metadata": null,
        "created_at": "2026-03-15T10:00:30.000Z"
      }
    ]
  }
}
```

**Error Responses:**
| Status | Code | When |
|--------|------|------|
| 404 | `CHAT_NOT_FOUND` | Chat doesn't exist or belongs to another user |

---

#### DELETE `/api/chat/:id`

**Success Response (200):**
```json
{ "success": true, "data": { "message": "Chat deleted successfully" } }
```

---

#### POST `/api/chat/:id/message` — **SSE Streaming Response**

This is the main conversational endpoint. It accepts a user message, runs the AI agent pipeline, and streams the response back via Server-Sent Events.

**Request Body:**
```json
{
  "content": "What documents do I need for company registration?",
  "attachments": ["document-uuid-1"]
}
```
- `content`: the user's text message (required)
- `attachments`: optional array of Document IDs to reference in the conversation

**Response Headers:**
```
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive
X-Accel-Buffering: no
```

**SSE Event Stream:**
```
event: token
data: {"content": "For"}

event: token
data: {"content": " company"}

event: token
data: {"content": " registration"}

event: tool_call
data: {"tool": "retrieve_requirements", "input": {"process_type": "COMPANY_REGISTRATION"}, "status": "started"}

event: tool_call
data: {"tool": "retrieve_requirements", "output": "...", "status": "completed"}

event: token
data: {"content": " you will need the following documents:\n\n1. "}

event: done
data: {"message_id": "msg-uuid", "usage": {"prompt_tokens": 1200, "completion_tokens": 350}}

```

**Error Event:**
```
event: error
data: {"message": "LLM provider error", "code": "LLM_ERROR"}

```

**Important implementation notes:**
1. Save the user message to DB immediately upon receiving the request
2. Stream the assistant response token by token
3. Accumulate all tokens in memory during streaming
4. When stream completes (`done` event), save the full accumulated response to DB as a single Message record
5. If client disconnects mid-stream, still save whatever has been generated so far

---

#### POST `/api/chat/:id/speech` — Speech-to-Text

**Request:** `multipart/form-data`
- `audio`: audio file (webm, mp3, wav, m4a) — max 25MB

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "text": "मलाई कम्पनी दर्ता गर्न के के कागजात चाहिन्छ?",
    "language": "ne",
    "duration_seconds": 4.2
  }
}
```

**Error Responses:**
| Status | Code | When |
|--------|------|------|
| 400 | `INVALID_AUDIO` | Unsupported format or too large |
| 500 | `WHISPER_ERROR` | Whisper API failure |

---

### 3.3 Document Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/document/upload` | Yes | Upload a document |
| POST | `/api/document/:id/analyze` | Yes | Trigger OCR + validation |
| GET | `/api/document` | Yes | List user's documents |
| GET | `/api/document/:id` | Yes | Get document with analysis |
| DELETE | `/api/document/:id` | Yes | Delete document + file |

#### POST `/api/document/upload`

**Request:** `multipart/form-data`
- `file`: the document file (jpg, png, pdf) — max 25MB
- `process_type`: one of the ProcessType enum values (optional)
- `chat_id`: UUID of a chat to link this document to (optional)
- `document_type`: one of the DocumentType enum values (optional, default: `OTHER`)

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "document": {
      "id": "doc-uuid",
      "file_name": "citizenship-front.jpg",
      "file_type": "image/jpeg",
      "file_size": 2048576,
      "document_type": "CITIZENSHIP",
      "process_type": "COMPANY_REGISTRATION",
      "chat_id": "chat-uuid",
      "created_at": "2026-03-15T10:00:00.000Z"
    }
  }
}
```

---

#### POST `/api/document/:id/analyze`

Triggers OCR (GPT-4o Vision) and validation. This may take 5-15 seconds.

**Request Body:** (empty — document already uploaded)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "document_id": "doc-uuid",
    "ocr_result": {
      "name_en": "Ram Bahadur Sharma",
      "name_ne": "राम बहादुर शर्मा",
      "dob": "1995-05-15",
      "document_number": "12-34-56-78901",
      "issue_date": "2015-03-20",
      "district": "Kathmandu",
      "father_name": "Hari Sharma",
      "address": "Kathmandu-14, Baneshwor",
      "photo_detected": true,
      "signature_detected": true
    },
    "validation_result": {
      "is_valid": true,
      "fields_present": ["name_en", "name_ne", "dob", "document_number", "issue_date", "district"],
      "fields_missing": [],
      "warnings": ["Image slightly blurry — reupload if OCR accuracy seems low"],
      "readiness_score": 95,
      "suggestions": []
    }
  }
}
```

**Error Responses:**
| Status | Code | When |
|--------|------|------|
| 404 | `DOCUMENT_NOT_FOUND` | Document doesn't exist or belongs to another user |
| 422 | `UNSUPPORTED_FORMAT` | File type not supported for OCR |
| 500 | `OCR_ERROR` | Vision API failure |

---

#### GET `/api/document`

**Query Parameters:**
- `process_type` (optional filter)
- `document_type` (optional filter)
- `chat_id` (optional filter)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "documents": [
      {
        "id": "doc-uuid",
        "file_name": "citizenship-front.jpg",
        "file_type": "image/jpeg",
        "file_size": 2048576,
        "document_type": "CITIZENSHIP",
        "process_type": "COMPANY_REGISTRATION",
        "has_ocr_result": true,
        "readiness_score": 95,
        "created_at": "2026-03-15T10:00:00.000Z"
      }
    ]
  }
}
```

---

#### GET `/api/document/:id`

Returns full document record including OCR and validation results.

**Success Response (200):** Same as the analyze response, plus `file_name`, `file_type`, `file_size`, `created_at`.

---

#### DELETE `/api/document/:id`

Deletes the document record from DB AND the file from the `/uploads` directory.

**Success Response (200):**
```json
{ "success": true, "data": { "message": "Document deleted successfully" } }
```

---

### 3.4 Process Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/process` | No | List available processes |
| GET | `/api/process/:type/requirements` | No | Get requirements (RAG-backed) |
| GET | `/api/process/:type/checklist` | Yes | Get checklist with user's readiness |
| POST | `/api/process/:type/prefill` | Yes | Generate prefilled PDF |

#### GET `/api/process`

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "processes": [
      {
        "type": "COMPANY_REGISTRATION",
        "name": "Company Registration (OCR CAMIS)",
        "description": "Register a new company with the Office of the Company Registrar (OCR) via CAMIS portal",
        "portal_url": "https://camis.ocr.gov.np",
        "authority": "Office of the Company Registrar",
        "estimated_time": "3-7 business days",
        "government_fee": "Rs. 1,000 - 15,000 (varies by type)"
      },
      {
        "type": "PAN_REGISTRATION",
        "name": "PAN Registration (IRD)",
        "description": "Register for Permanent Account Number with Inland Revenue Department",
        "portal_url": "https://ird.gov.np",
        "authority": "Inland Revenue Department",
        "estimated_time": "1-3 business days",
        "government_fee": "Free"
      },
      {
        "type": "PASSPORT_APPLICATION",
        "name": "Passport Application",
        "description": "Apply for a new Nepali passport or renew an existing one",
        "portal_url": "https://nepalpassport.gov.np",
        "authority": "Department of Passports",
        "estimated_time": "7-15 business days (regular), 2-3 days (express)",
        "government_fee": "Rs. 5,000 (regular), Rs. 10,000 (express)"
      }
    ]
  }
}
```

---

#### GET `/api/process/:type/requirements`

`:type` is one of: `COMPANY_REGISTRATION`, `PAN_REGISTRATION`, `PASSPORT_APPLICATION`

This endpoint queries the RAG pipeline (Pinecone) to return up-to-date requirements.

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "process_type": "COMPANY_REGISTRATION",
    "requirements": {
      "documents_required": [
        {
          "name": "Citizenship Certificate",
          "description": "Nepali citizenship certificate of all directors/promoters",
          "document_type": "CITIZENSHIP",
          "copies_needed": 2,
          "certified": true
        },
        {
          "name": "Passport-size Photos",
          "description": "Recent passport-size photographs of directors",
          "document_type": "PASSPORT_PHOTO",
          "copies_needed": 3,
          "certified": false
        },
        {
          "name": "Memorandum of Association",
          "description": "MoA signed by all promoters",
          "document_type": "COMPANY_MOA",
          "copies_needed": 2,
          "certified": false
        }
      ],
      "steps": [
        "1. Check and reserve company name on CAMIS portal",
        "2. Prepare Memorandum and Articles of Association",
        "3. Collect citizenship certificates of all promoters",
        "4. Fill the company registration form online via CAMIS",
        "5. Upload required documents",
        "6. Pay registration fee online",
        "7. Collect registration certificate from OCR office"
      ],
      "eligibility": [
        "Must be a Nepali citizen (at least one director)",
        "Minimum 1 director for Pvt. Ltd., 7 for Public Ltd.",
        "Minimum authorized capital Rs. 100 for Pvt. Ltd."
      ],
      "sources": [
        { "url": "https://camis.ocr.gov.np", "title": "CAMIS Portal" },
        { "url": "https://ocr.gov.np/guidelines", "title": "OCR Guidelines" }
      ]
    }
  }
}
```

---

#### GET `/api/process/:type/checklist`

Returns the requirements checklist with the current user's completion status based on their uploaded documents.

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "process_type": "COMPANY_REGISTRATION",
    "overall_readiness": 66,
    "checklist": [
      {
        "requirement": "Citizenship Certificate",
        "document_type": "CITIZENSHIP",
        "status": "completed",
        "document_id": "doc-uuid",
        "readiness_score": 95,
        "notes": "Verified via OCR"
      },
      {
        "requirement": "Passport-size Photos",
        "document_type": "PASSPORT_PHOTO",
        "status": "completed",
        "document_id": "doc-uuid-2",
        "readiness_score": 88,
        "notes": "Face detected, slight background issue"
      },
      {
        "requirement": "Memorandum of Association",
        "document_type": "COMPANY_MOA",
        "status": "missing",
        "document_id": null,
        "readiness_score": 0,
        "notes": "Not yet uploaded"
      }
    ]
  }
}
```

---

#### POST `/api/process/:type/prefill`

**Request Body:**
```json
{
  "field_data": {
    "company_name": "Tech Nepal Pvt. Ltd.",
    "company_type": "Private Limited",
    "registered_office": "Kathmandu-14, Baneshwor",
    "directors": [
      { "name": "Ram Sharma", "citizenship_number": "12-34-56-78901" }
    ],
    "authorized_capital": "1000000",
    "paid_up_capital": "500000"
  }
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "pdf_url": "/api/document/download/prefilled-company-reg-uuid.pdf",
    "pdf_path": "uploads/prefilled/prefilled-company-reg-uuid.pdf",
    "filled_fields": ["company_name", "company_type", "registered_office", "directors", "authorized_capital", "paid_up_capital"],
    "missing_fields": ["shareholders"],
    "warnings": []
  }
}
```

---

### 3.5 Health Endpoint

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/health` | No | System health check |

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2026-03-15T10:00:00.000Z",
    "uptime_seconds": 3600,
    "checks": {
      "database": { "status": "connected", "latency_ms": 5 },
      "pinecone": { "status": "connected", "index": "saarthi-gov-docs" },
      "llm_provider": { "status": "configured", "provider": "openai" }
    },
    "version": "1.0.0"
  }
}
```

---

### Route Registration — `src/index.ts`

```typescript
import express from 'express';
import cors from 'cors';
import 'express-async-errors';

import { env } from './config/env';
import { corsOptions } from './middleware/cors';
import { errorHandler } from './middleware/errorHandler';
import { authRoutes } from './routes/auth.routes';
import { chatRoutes } from './routes/chat.routes';
import { documentRoutes } from './routes/document.routes';
import { processRoutes } from './routes/process.routes';
import { healthRoutes } from './routes/health.routes';
import { logger } from './utils/logger';

const app = express();

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically (for PDF download links)
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/document', documentRoutes);
app.use('/api/process', processRoutes);
app.use('/api/health', healthRoutes);

// Global error handler (must be last)
app.use(errorHandler);

// Start server
app.listen(env.PORT, () => {
  logger.info(`Saarthi AI backend running on port ${env.PORT}`);
  logger.info(`LLM provider: ${env.ACTIVE_LLM_PROVIDER}`);
  logger.info(`Environment: ${env.NODE_ENV}`);
});

export default app;
```

---

## 4. Authentication Implementation

### 4.1 Auth Service — `src/services/auth.service.ts`

```typescript
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import prisma from '../config/database';

const SALT_ROUNDS = 10;

interface TokenPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

export const authService = {
  /**
   * Hash a plaintext password with bcrypt
   */
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
  },

  /**
   * Compare plaintext password with bcrypt hash
   */
  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  },

  /**
   * Generate a JWT token
   * Payload: { userId, email }
   * Expiry: 7 days
   */
  generateToken(userId: string, email: string): string {
    const payload: TokenPayload = { userId, email };
    return jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN, // "7d"
    });
  },

  /**
   * Verify and decode a JWT token
   * Throws if invalid or expired
   */
  verifyToken(token: string): TokenPayload {
    return jwt.verify(token, env.JWT_SECRET) as TokenPayload;
  },

  /**
   * Register a new user
   * 1. Check if email already exists
   * 2. Hash password
   * 3. Create user record
   * 4. Generate JWT
   * 5. Return token + user (without password)
   */
  async register(email: string, password: string, name: string) {
    // Check uniqueness
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new AppError(409, 'EMAIL_EXISTS', 'An account with this email already exists');
    }

    // Hash & create
    const hashedPassword = await this.hashPassword(password);
    const user = await prisma.user.create({
      data: { email, password: hashedPassword, name },
      select: {
        id: true,
        email: true,
        name: true,
        language_preference: true,
        created_at: true,
      },
    });

    // Generate token
    const token = this.generateToken(user.id, user.email);
    return { token, user };
  },

  /**
   * Login an existing user
   * 1. Find user by email
   * 2. Compare password
   * 3. Generate JWT
   * 4. Return token + user (without password)
   */
  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
    }

    const isValid = await this.comparePassword(password, user.password);
    if (!isValid) {
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
    }

    const token = this.generateToken(user.id, user.email);
    const { password: _, ...userWithoutPassword } = user;
    return { token, user: userWithoutPassword };
  },
};
```

### 4.2 Auth Middleware — `src/middleware/auth.ts`

```typescript
import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import prisma from '../config/database';

// Augment Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        name: string;
        language_preference: string;
      };
    }
  }
}

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // 1. Extract token from Authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: true,
      message: 'Authentication required',
      code: 'UNAUTHORIZED',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    // 2. Verify token
    const payload = authService.verifyToken(token);

    // 3. Fetch user from DB (ensures user still exists)
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        name: true,
        language_preference: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        error: true,
        message: 'User no longer exists',
        code: 'USER_NOT_FOUND',
      });
    }

    // 4. Attach user to request
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      error: true,
      message: 'Invalid or expired token',
      code: 'INVALID_TOKEN',
    });
  }
};
```

### 4.3 Auth Controller — `src/controllers/auth.controller.ts`

```typescript
import { Request, Response } from 'express';
import { z } from 'zod';
import { authService } from '../services/auth.service';

const registerSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(8).max(128),
  name: z.string().min(2).max(100),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const authController = {
  async register(req: Request, res: Response) {
    const validated = registerSchema.parse(req.body);
    const result = await authService.register(
      validated.email,
      validated.password,
      validated.name
    );
    res.status(201).json({ success: true, data: result });
  },

  async login(req: Request, res: Response) {
    const validated = loginSchema.parse(req.body);
    const result = await authService.login(validated.email, validated.password);
    res.status(200).json({ success: true, data: result });
  },

  async me(req: Request, res: Response) {
    res.status(200).json({ success: true, data: { user: req.user } });
  },
};
```

### 4.4 Auth Routes — `src/routes/auth.routes.ts`

```typescript
import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth';

export const authRoutes = Router();

authRoutes.post('/register', authController.register);
authRoutes.post('/login', authController.login);
authRoutes.get('/me', authMiddleware, authController.me);
```

### 4.5 Security Notes

| Concern | Implementation |
|---|---|
| Password storage | bcrypt with 10 salt rounds — never store plaintext |
| Token expiry | 7 days — reasonable for a hackathon; production would use refresh tokens |
| Token in response body | Frontend stores in localStorage (acceptable for hackathon; production would use httpOnly cookies) |
| User enumeration | Login returns same error for wrong email AND wrong password |
| Input validation | Zod schemas validate all inputs before processing |
| SQL injection | Prisma ORM uses parameterized queries — safe by default |
| Rate limiting | Not implemented for hackathon; production would use express-rate-limit |

### 4.6 Custom Error Class

```typescript
// src/utils/errors.ts
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}
```
## 5. Multi-Provider LLM Integration

### 5.1 Provider Interface — `src/services/llm/provider.ts`

```typescript
export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  /** For vision: attach images as base64 */
  images?: Array<{
    base64: string;
    mimeType: 'image/png' | 'image/jpeg' | 'image/webp';
  }>;
}

export interface LLMChatOptions {
  temperature?: number;       // 0.0 - 1.0, default 0.3
  maxTokens?: number;         // default 2048
  topP?: number;              // default 1.0
  stop?: string[];            // stop sequences
  responseFormat?: 'text' | 'json';
}

export interface LLMStreamChunk {
  content: string;
  finishReason?: 'stop' | 'length' | 'tool_calls' | null;
}

export interface LLMUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface LLMChatResponse {
  content: string;
  usage: LLMUsage;
  finishReason: string;
}

export interface LLMEmbeddingResponse {
  embedding: number[];
  usage: { totalTokens: number };
}

/**
 * Abstract interface that all LLM providers must implement.
 * Each provider wraps a specific SDK but exposes a uniform API.
 */
export abstract class LLMProvider {
  abstract readonly name: string;

  /**
   * Send messages and get a complete response (non-streaming).
   */
  abstract chat(
    messages: LLMMessage[],
    options?: LLMChatOptions
  ): Promise<LLMChatResponse>;

  /**
   * Send messages and get a streaming response.
   * Returns an async iterable of content chunks.
   */
  abstract stream(
    messages: LLMMessage[],
    options?: LLMChatOptions
  ): AsyncIterable<LLMStreamChunk>;

  /**
   * Generate an embedding vector for a text string.
   * NOTE: All providers use OpenAI embeddings (text-embedding-3-small).
   * Override only if the provider has its own embedding model.
   */
  abstract embed(text: string): Promise<LLMEmbeddingResponse>;

  /**
   * Vision: analyze an image with a text prompt.
   * Default implementation throws "not supported" — override where available.
   */
  async vision(
    prompt: string,
    imageBase64: string,
    mimeType: string,
    options?: LLMChatOptions
  ): Promise<LLMChatResponse> {
    throw new Error(`Vision is not supported by ${this.name}`);
  }
}
```

### 5.2 OpenAI Provider — `src/services/llm/openai.ts`

```typescript
import OpenAI from 'openai';
import { env } from '../../config/env';
import {
  LLMProvider, LLMMessage, LLMChatOptions, LLMChatResponse,
  LLMStreamChunk, LLMEmbeddingResponse,
} from './provider';

export class OpenAIProvider extends LLMProvider {
  readonly name = 'openai';
  private client: OpenAI;

  constructor() {
    super();
    this.client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  }

  async chat(messages: LLMMessage[], options?: LLMChatOptions): Promise<LLMChatResponse> {
    const response = await this.client.chat.completions.create({
      model: 'gpt-4o',
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      temperature: options?.temperature ?? 0.3,
      max_tokens: options?.maxTokens ?? 2048,
      top_p: options?.topP ?? 1.0,
      stop: options?.stop,
      response_format: options?.responseFormat === 'json'
        ? { type: 'json_object' }
        : undefined,
    });

    const choice = response.choices[0];
    return {
      content: choice.message.content ?? '',
      usage: {
        promptTokens: response.usage?.prompt_tokens ?? 0,
        completionTokens: response.usage?.completion_tokens ?? 0,
        totalTokens: response.usage?.total_tokens ?? 0,
      },
      finishReason: choice.finish_reason ?? 'stop',
    };
  }

  async *stream(
    messages: LLMMessage[],
    options?: LLMChatOptions
  ): AsyncIterable<LLMStreamChunk> {
    const response = await this.client.chat.completions.create({
      model: 'gpt-4o',
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      temperature: options?.temperature ?? 0.3,
      max_tokens: options?.maxTokens ?? 2048,
      stream: true,
    });

    for await (const chunk of response) {
      const delta = chunk.choices[0]?.delta;
      if (delta?.content) {
        yield {
          content: delta.content,
          finishReason: chunk.choices[0]?.finish_reason as any,
        };
      }
    }
  }

  async embed(text: string): Promise<LLMEmbeddingResponse> {
    const response = await this.client.embeddings.create({
      model: env.EMBEDDING_MODEL,  // "text-embedding-3-small"
      input: text,
    });

    return {
      embedding: response.data[0].embedding,
      usage: { totalTokens: response.usage.total_tokens },
    };
  }

  /**
   * GPT-4o Vision: send image as base64 along with a text prompt
   */
  async vision(
    prompt: string,
    imageBase64: string,
    mimeType: string,
    options?: LLMChatOptions
  ): Promise<LLMChatResponse> {
    const response = await this.client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${imageBase64}`,
                detail: 'high',
              },
            },
          ],
        },
      ],
      temperature: options?.temperature ?? 0.1,
      max_tokens: options?.maxTokens ?? 4096,
      response_format: options?.responseFormat === 'json'
        ? { type: 'json_object' }
        : undefined,
    });

    const choice = response.choices[0];
    return {
      content: choice.message.content ?? '',
      usage: {
        promptTokens: response.usage?.prompt_tokens ?? 0,
        completionTokens: response.usage?.completion_tokens ?? 0,
        totalTokens: response.usage?.total_tokens ?? 0,
      },
      finishReason: choice.finish_reason ?? 'stop',
    };
  }
}
```

### 5.3 Anthropic Provider — `src/services/llm/anthropic.ts`

```typescript
import Anthropic from '@anthropic-ai/sdk';
import { OpenAIProvider } from './openai';
import { env } from '../../config/env';
import {
  LLMProvider, LLMMessage, LLMChatOptions, LLMChatResponse,
  LLMStreamChunk, LLMEmbeddingResponse,
} from './provider';

export class AnthropicProvider extends LLMProvider {
  readonly name = 'anthropic';
  private client: Anthropic;
  private openaiForEmbeddings: OpenAIProvider;

  constructor() {
    super();
    this.client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
    // Anthropic doesn't have embeddings — delegate to OpenAI
    this.openaiForEmbeddings = new OpenAIProvider();
  }

  async chat(messages: LLMMessage[], options?: LLMChatOptions): Promise<LLMChatResponse> {
    // Anthropic requires system message to be passed separately
    const systemMsg = messages.find((m) => m.role === 'system');
    const nonSystemMessages = messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

    const response = await this.client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: options?.maxTokens ?? 2048,
      temperature: options?.temperature ?? 0.3,
      system: systemMsg?.content ?? '',
      messages: nonSystemMessages,
    });

    const textBlock = response.content.find((b) => b.type === 'text');
    return {
      content: textBlock?.text ?? '',
      usage: {
        promptTokens: response.usage.input_tokens,
        completionTokens: response.usage.output_tokens,
        totalTokens: response.usage.input_tokens + response.usage.output_tokens,
      },
      finishReason: response.stop_reason ?? 'end_turn',
    };
  }

  async *stream(
    messages: LLMMessage[],
    options?: LLMChatOptions
  ): AsyncIterable<LLMStreamChunk> {
    const systemMsg = messages.find((m) => m.role === 'system');
    const nonSystemMessages = messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

    const stream = this.client.messages.stream({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: options?.maxTokens ?? 2048,
      temperature: options?.temperature ?? 0.3,
      system: systemMsg?.content ?? '',
      messages: nonSystemMessages,
    });

    for await (const event of stream) {
      if (
        event.type === 'content_block_delta' &&
        event.delta.type === 'text_delta'
      ) {
        yield {
          content: event.delta.text,
          finishReason: null,
        };
      }
    }
  }

  /**
   * Delegate embeddings to OpenAI (Anthropic has no embedding model)
   */
  async embed(text: string): Promise<LLMEmbeddingResponse> {
    return this.openaiForEmbeddings.embed(text);
  }

  // Vision: Anthropic Claude supports vision natively but for consistency
  // we use GPT-4o Vision for OCR across all providers
}
```

### 5.4 Gemini Provider — `src/services/llm/gemini.ts`

```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';
import { OpenAIProvider } from './openai';
import { env } from '../../config/env';
import {
  LLMProvider, LLMMessage, LLMChatOptions, LLMChatResponse,
  LLMStreamChunk, LLMEmbeddingResponse,
} from './provider';

export class GeminiProvider extends LLMProvider {
  readonly name = 'gemini';
  private genAI: GoogleGenerativeAI;
  private openaiForEmbeddings: OpenAIProvider;

  constructor() {
    super();
    this.genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
    this.openaiForEmbeddings = new OpenAIProvider();
  }

  async chat(messages: LLMMessage[], options?: LLMChatOptions): Promise<LLMChatResponse> {
    const model = this.genAI.getGenerativeModel({
      model: 'gemini-1.5-pro',
      generationConfig: {
        temperature: options?.temperature ?? 0.3,
        maxOutputTokens: options?.maxTokens ?? 2048,
        topP: options?.topP ?? 1.0,
      },
    });

    // Convert messages to Gemini format
    // Gemini uses "model" instead of "assistant" and handles system prompt differently
    const systemInstruction = messages
      .filter((m) => m.role === 'system')
      .map((m) => m.content)
      .join('\n');

    const history = messages
      .filter((m) => m.role !== 'system')
      .slice(0, -1) // All except last
      .map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

    const lastMessage = messages.filter((m) => m.role !== 'system').slice(-1)[0];

    const chat = model.startChat({
      history: history as any,
      systemInstruction: systemInstruction || undefined,
    });

    const result = await chat.sendMessage(lastMessage?.content ?? '');
    const response = result.response;

    return {
      content: response.text(),
      usage: {
        promptTokens: response.usageMetadata?.promptTokenCount ?? 0,
        completionTokens: response.usageMetadata?.candidatesTokenCount ?? 0,
        totalTokens: response.usageMetadata?.totalTokenCount ?? 0,
      },
      finishReason: response.candidates?.[0]?.finishReason ?? 'STOP',
    };
  }

  async *stream(
    messages: LLMMessage[],
    options?: LLMChatOptions
  ): AsyncIterable<LLMStreamChunk> {
    const model = this.genAI.getGenerativeModel({
      model: 'gemini-1.5-pro',
      generationConfig: {
        temperature: options?.temperature ?? 0.3,
        maxOutputTokens: options?.maxTokens ?? 2048,
      },
    });

    const systemInstruction = messages
      .filter((m) => m.role === 'system')
      .map((m) => m.content)
      .join('\n');

    const history = messages
      .filter((m) => m.role !== 'system')
      .slice(0, -1)
      .map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

    const lastMessage = messages.filter((m) => m.role !== 'system').slice(-1)[0];

    const chat = model.startChat({
      history: history as any,
      systemInstruction: systemInstruction || undefined,
    });

    const result = await chat.sendMessageStream(lastMessage?.content ?? '');

    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) {
        yield { content: text, finishReason: null };
      }
    }
  }

  /**
   * Delegate embeddings to OpenAI (use text-embedding-3-small for consistency)
   */
  async embed(text: string): Promise<LLMEmbeddingResponse> {
    return this.openaiForEmbeddings.embed(text);
  }
}
```

### 5.5 Provider Factory — `src/services/llm/index.ts`

```typescript
import { env } from '../../config/env';
import { LLMProvider } from './provider';
import { OpenAIProvider } from './openai';
import { AnthropicProvider } from './anthropic';
import { GeminiProvider } from './gemini';
import { logger } from '../../utils/logger';

type ProviderName = 'openai' | 'anthropic' | 'gemini';

const providers: Record<ProviderName, () => LLMProvider> = {
  openai: () => new OpenAIProvider(),
  anthropic: () => new AnthropicProvider(),
  gemini: () => new GeminiProvider(),
};

let cachedProvider: LLMProvider | null = null;

/**
 * Get the active LLM provider based on ACTIVE_LLM_PROVIDER env var.
 * Caches the instance for reuse.
 * 
 * IMPORTANT: Does NOT fallback to another provider on error.
 * If the configured provider fails, the error propagates up.
 */
export function getLLMProvider(): LLMProvider {
  if (cachedProvider) return cachedProvider;

  const providerName = env.ACTIVE_LLM_PROVIDER as ProviderName;

  if (!providers[providerName]) {
    throw new Error(
      `Unknown LLM provider: "${providerName}". ` +
      `Valid options: ${Object.keys(providers).join(', ')}`
    );
  }

  logger.info(`Initializing LLM provider: ${providerName}`);
  cachedProvider = providers[providerName]();
  return cachedProvider;
}

/**
 * Always use OpenAI for embeddings, regardless of active chat provider.
 * This ensures consistent vector dimensions (1536) across the system.
 */
export function getEmbeddingProvider(): OpenAIProvider {
  return new OpenAIProvider();
}

/**
 * Always use OpenAI for vision (GPT-4o), regardless of active chat provider.
 * This ensures consistent OCR quality.
 */
export function getVisionProvider(): OpenAIProvider {
  return new OpenAIProvider();
}
```

### 5.6 Environment Config — `src/config/llm.ts`

```typescript
import { z } from 'zod';

export const llmConfigSchema = z.object({
  ACTIVE_LLM_PROVIDER: z.enum(['openai', 'anthropic', 'gemini']).default('openai'),
  OPENAI_API_KEY: z.string().min(1, 'OPENAI_API_KEY is required (used for embeddings & vision)'),
  ANTHROPIC_API_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  EMBEDDING_MODEL: z.string().default('text-embedding-3-small'),
  EMBEDDING_DIMENSION: z.coerce.number().default(1536),
});

// Validation: if anthropic is active, ANTHROPIC_API_KEY is required, etc.
export function validateLLMConfig(config: z.infer<typeof llmConfigSchema>) {
  if (config.ACTIVE_LLM_PROVIDER === 'anthropic' && !config.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY is required when ACTIVE_LLM_PROVIDER=anthropic');
  }
  if (config.ACTIVE_LLM_PROVIDER === 'gemini' && !config.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is required when ACTIVE_LLM_PROVIDER=gemini');
  }
}
```

### 5.7 Error Handling Strategy

```typescript
// In any service that calls the LLM provider:
import { getLLMProvider } from '../services/llm';
import { logger } from '../utils/logger';
import { AppError } from '../utils/errors';

async function askLLM(messages: LLMMessage[]) {
  try {
    const provider = getLLMProvider();
    const response = await provider.chat(messages, { temperature: 0.3 });
    return response;
  } catch (error: any) {
    logger.error('LLM provider error', {
      provider: env.ACTIVE_LLM_PROVIDER,
      error: error.message,
      // Do NOT log full error object — may contain API keys in headers
    });

    // Do NOT silently fallback to another provider
    // The user/admin should fix the configuration
    throw new AppError(
      503,
      'LLM_ERROR',
      `AI service is temporarily unavailable. Please try again later.`
    );
  }
}
```

### 5.8 Token Counting & Rate Limiting Notes

| Concern | Approach |
|---|---|
| Token counting | Track usage from LLM responses; log per-request and per-user |
| Context window | GPT-4o: 128K, Claude 3.5: 200K, Gemini 1.5 Pro: 1M — limit chat history to last 20 messages regardless |
| Rate limiting | For hackathon: no rate limiting. Production: track tokens/minute per user, enforce limits |
| Cost estimation | Log all `usage` objects; calculate costs offline with provider pricing |
| Timeout | Set a 60-second timeout on all LLM API calls; return error if exceeded |

---

## 6. RAG Pipeline (Pinecone)

### 6.1 Pinecone Client Setup — `src/services/rag/pinecone.ts`

```typescript
import { Pinecone } from '@pinecone-database/pinecone';
import { env } from '../../config/env';
import { logger } from '../../utils/logger';

let pineconeClient: Pinecone | null = null;

/**
 * Initialize and return Pinecone client singleton
 */
export function getPineconeClient(): Pinecone {
  if (pineconeClient) return pineconeClient;

  pineconeClient = new Pinecone({
    apiKey: env.PINECONE_API_KEY,
  });

  logger.info('Pinecone client initialized');
  return pineconeClient;
}

/**
 * Get the main index for government docs
 * Index config: dimension=1536, metric=cosine
 */
export function getIndex() {
  const client = getPineconeClient();
  return client.index(env.PINECONE_INDEX); // "saarthi-gov-docs"
}

/**
 * Get a namespaced index for a specific process type
 * Namespaces: "company-registration", "pan-registration", "passport-application"
 */
export function getNamespacedIndex(processType: string) {
  const namespace = processType.toLowerCase().replace(/_/g, '-');
  return getIndex().namespace(namespace);
}

/**
 * Health check: verify connection to Pinecone
 */
export async function checkPineconeHealth(): Promise<{
  status: string;
  index: string;
}> {
  try {
    const client = getPineconeClient();
    const indexList = await client.listIndexes();
    const indexExists = indexList.indexes?.some(
      (i) => i.name === env.PINECONE_INDEX
    );
    return {
      status: indexExists ? 'connected' : 'index_not_found',
      index: env.PINECONE_INDEX,
    };
  } catch (error: any) {
    return { status: `error: ${error.message}`, index: env.PINECONE_INDEX };
  }
}
```

### 6.2 Embedding Service — `src/services/rag/embeddings.ts`

```typescript
import { getEmbeddingProvider } from '../llm';
import { logger } from '../../utils/logger';

/**
 * Convert a text string to a 1536-dimensional embedding vector
 * Always uses OpenAI text-embedding-3-small regardless of active chat provider
 */
export async function embedText(text: string): Promise<number[]> {
  const provider = getEmbeddingProvider();
  const result = await provider.embed(text);
  return result.embedding;
}

/**
 * Batch embed multiple texts (for ingestion)
 * Processes in parallel batches of 20 to respect rate limits
 */
export async function embedTexts(
  texts: string[]
): Promise<Array<{ text: string; embedding: number[] }>> {
  const BATCH_SIZE = 20;
  const results: Array<{ text: string; embedding: number[] }> = [];

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    const embeddings = await Promise.all(
      batch.map(async (text) => {
        const embedding = await embedText(text);
        return { text, embedding };
      })
    );
    results.push(...embeddings);

    logger.info(`Embedded batch ${i / BATCH_SIZE + 1}/${Math.ceil(texts.length / BATCH_SIZE)}`);

    // Small delay between batches to avoid rate limits
    if (i + BATCH_SIZE < texts.length) {
      await new Promise((r) => setTimeout(r, 200));
    }
  }

  return results;
}
```

### 6.3 Retriever — `src/services/rag/retriever.ts`

```typescript
import { getNamespacedIndex } from './pinecone';
import { embedText } from './embeddings';
import { logger } from '../../utils/logger';

export interface RetrievalResult {
  id: string;
  score: number;
  chunkText: string;
  metadata: {
    source_url: string;
    process_type: string;
    language: string;
    last_modified: string;
    authority: string;
  };
}

/**
 * Query Pinecone for relevant document chunks
 * 
 * Flow:
 * 1. Embed the user's question
 * 2. Query top-5 from the correct namespace
 * 3. Rerank by score
 * 4. Return top-3
 */
export async function retrieveRelevantChunks(
  query: string,
  processType: string,
  topK: number = 3
): Promise<RetrievalResult[]> {
  // 1. Embed the query
  const queryEmbedding = await embedText(query);

  // 2. Query Pinecone (fetch top-5, we'll rerank and return top-3)
  const namespace = getNamespacedIndex(processType);
  const queryResponse = await namespace.query({
    vector: queryEmbedding,
    topK: topK + 2, // Fetch extra for reranking margin
    includeMetadata: true,
  });

  // 3. Map and filter results
  const results: RetrievalResult[] = (queryResponse.matches ?? [])
    .filter((match) => match.score && match.score > 0.7) // Minimum relevance threshold
    .map((match) => ({
      id: match.id,
      score: match.score ?? 0,
      chunkText: (match.metadata?.chunk_text as string) ?? '',
      metadata: {
        source_url: (match.metadata?.source_url as string) ?? '',
        process_type: (match.metadata?.process_type as string) ?? '',
        language: (match.metadata?.language as string) ?? 'en',
        last_modified: (match.metadata?.last_modified as string) ?? '',
        authority: (match.metadata?.authority as string) ?? '',
      },
    }));

  // 4. Sort by score descending and take top-K
  results.sort((a, b) => b.score - a.score);
  const topResults = results.slice(0, topK);

  logger.info(`RAG retrieval: query="${query.substring(0, 50)}...", ` +
    `namespace="${processType}", results=${topResults.length}`);

  return topResults;
}

/**
 * Format retrieved chunks into a context string for the system prompt
 */
export function formatRetrievalContext(results: RetrievalResult[]): string {
  if (results.length === 0) {
    return 'No relevant government documents found for this query.';
  }

  return results
    .map(
      (r, i) =>
        `[Source ${i + 1}] (relevance: ${(r.score * 100).toFixed(0)}%, ` +
        `authority: ${r.metadata.authority})\n${r.chunkText}`
    )
    .join('\n\n---\n\n');
}
```

### 6.4 Ingestion Script — `src/services/rag/ingest.ts`

This is a standalone script run via `npm run ingest`. It reads preprocessed JSON files from `/data/processed/` and upserts them into Pinecone.

```typescript
import fs from 'fs';
import path from 'path';
import { getNamespacedIndex } from './pinecone';
import { embedTexts } from './embeddings';
import { logger } from '../../utils/logger';
import { v4 as uuidv4 } from 'uuid';

/**
 * Expected JSON format in /data/processed/:
 * {
 *   "process_type": "COMPANY_REGISTRATION",
 *   "authority": "Office of the Company Registrar",
 *   "source_url": "https://camis.ocr.gov.np/guidelines",
 *   "language": "en",
 *   "last_modified": "2025-12-01",
 *   "content": "Full text content of the document..."
 * }
 */

interface ProcessedDocument {
  process_type: string;
  authority: string;
  source_url: string;
  language: string;
  last_modified: string;
  content: string;
}

/**
 * Chunk text into smaller pieces for embedding
 * Strategy:
 * 1. Split by paragraph (double newline)
 * 2. If a paragraph > 400 tokens (~1600 chars), split by sentence
 * 3. Overlap: prepend last 50 tokens (~200 chars) of previous chunk
 */
function chunkText(text: string, maxChars: number = 1600, overlapChars: number = 200): string[] {
  const paragraphs = text.split(/\n\s*\n/);
  const chunks: string[] = [];
  let currentChunk = '';

  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) continue;

    // If adding this paragraph exceeds maxChars, finalize current chunk
    if (currentChunk.length + trimmed.length > maxChars && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      // Overlap: carry over end of previous chunk
      const overlap = currentChunk.slice(-overlapChars);
      currentChunk = overlap + '\n\n' + trimmed;
    } else {
      currentChunk += (currentChunk ? '\n\n' : '') + trimmed;
    }
  }

  // Don't forget the last chunk
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  // Handle any chunks that are still too long (split by sentence)
  const finalChunks: string[] = [];
  for (const chunk of chunks) {
    if (chunk.length > maxChars * 1.5) {
      const sentences = chunk.match(/[^.!?]+[.!?]+/g) || [chunk];
      let sentenceChunk = '';
      for (const sentence of sentences) {
        if (sentenceChunk.length + sentence.length > maxChars) {
          finalChunks.push(sentenceChunk.trim());
          const overlap = sentenceChunk.slice(-overlapChars);
          sentenceChunk = overlap + ' ' + sentence;
        } else {
          sentenceChunk += sentence;
        }
      }
      if (sentenceChunk.trim()) {
        finalChunks.push(sentenceChunk.trim());
      }
    } else {
      finalChunks.push(chunk);
    }
  }

  return finalChunks;
}

/**
 * Main ingestion function
 * Usage: npx ts-node src/services/rag/ingest.ts
 */
async function ingest() {
  const dataDir = path.resolve(__dirname, '../../../data/processed');

  if (!fs.existsSync(dataDir)) {
    logger.error(`Data directory not found: ${dataDir}`);
    logger.info('Create /data/processed/ and add JSON files with government process docs.');
    process.exit(1);
  }

  const files = fs.readdirSync(dataDir).filter((f) => f.endsWith('.json'));
  logger.info(`Found ${files.length} JSON files to ingest`);

  for (const file of files) {
    const filePath = path.join(dataDir, file);
    const doc: ProcessedDocument = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    logger.info(`Processing: ${file} (${doc.process_type})`);

    // 1. Chunk the document
    const chunks = chunkText(doc.content);
    logger.info(`  Created ${chunks.length} chunks`);

    // 2. Generate embeddings for all chunks
    const embedded = await embedTexts(chunks);
    logger.info(`  Generated ${embedded.length} embeddings`);

    // 3. Prepare vectors for upsert
    const vectors = embedded.map((item) => ({
      id: uuidv4(),
      values: item.embedding,
      metadata: {
        chunk_text: item.text,
        source_url: doc.source_url,
        process_type: doc.process_type,
        language: doc.language,
        last_modified: doc.last_modified,
        authority: doc.authority,
      },
    }));

    // 4. Upsert in batches of 100
    const UPSERT_BATCH_SIZE = 100;
    const namespace = getNamespacedIndex(doc.process_type);

    for (let i = 0; i < vectors.length; i += UPSERT_BATCH_SIZE) {
      const batch = vectors.slice(i, i + UPSERT_BATCH_SIZE);
      await namespace.upsert(batch);
      logger.info(`  Upserted batch ${Math.floor(i / UPSERT_BATCH_SIZE) + 1}/${Math.ceil(vectors.length / UPSERT_BATCH_SIZE)}`);
    }

    logger.info(`  Completed: ${file}`);
  }

  logger.info('Ingestion complete!');
}

// Run if executed directly
ingest().catch((err) => {
  logger.error('Ingestion failed:', err);
  process.exit(1);
});
```

### 6.5 Pinecone Index Setup

Before running the ingest script, create the index via Pinecone dashboard or API:

```typescript
// One-time setup script (run manually or in a setup script)
import { getPineconeClient } from './pinecone';

async function createIndex() {
  const client = getPineconeClient();
  
  await client.createIndex({
    name: 'saarthi-gov-docs',
    dimension: 1536,
    metric: 'cosine',
    spec: {
      serverless: {
        cloud: 'aws',
        region: 'us-east-1',  // Choose based on your Pinecone plan
      },
    },
  });

  console.log('Index "saarthi-gov-docs" created successfully');
}
```

### 6.6 RAG Architecture Summary

```
User Question
    │
    ▼
┌─────────────────┐
│ Embed Question   │ ── OpenAI text-embedding-3-small ── ▶ [1536-dim vector]
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Query Pinecone   │ ── namespace: process-type ── top_k: 5
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Rerank & Filter  │ ── score > 0.7 ── return top 3
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Format Context   │ ── inject into system prompt
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ LLM Chat Call    │ ── system: context + instructions
│                  │ ── user: original question
└─────────────────┘
```

### 6.7 Metadata Schema Per Vector

| Field | Type | Example | Purpose |
|---|---|---|---|
| `chunk_text` | string | "Company registration requires..." | The original text chunk (for display) |
| `source_url` | string | "https://camis.ocr.gov.np/guidelines" | Attribution link |
| `process_type` | string | "COMPANY_REGISTRATION" | Filter/routing |
| `language` | string | "en" or "ne" | Language of the chunk |
| `last_modified` | string | "2025-12-01" | Freshness indicator |
| `authority` | string | "Office of the Company Registrar" | Government body |
## 7. Agent & Tool System (LangChain)

### Agent Orchestrator (`src/services/agent/copilot.ts`)

The copilot is the main orchestration layer. It receives a user message + chat history, classifies intent, selects tools, and runs the agent loop.

**Flow:**
```
User Message
    ↓
Load chat history (last 20 messages from DB)
    ↓
Intent Classification (LLM call with few-shot examples)
    ↓
Select namespace for RAG (based on intent)
    ↓
LangChain Agent Loop:
  ├── Agent decides which tool(s) to call
  ├── Tool executes (RAG retrieve / OCR analyze / prefill / etc.)
  ├── Agent receives tool result
  ├── Agent decides if more tools needed or ready to respond
  └── Stream final response via SSE
    ↓
Save assistant message to DB
```

### Intent Classification (`src/services/agent/intents.ts`)

Use an LLM call with few-shot examples to classify user intent.

```typescript
// Intent types
type ProcessIntent = 
  | 'company_registration'
  | 'pan_registration' 
  | 'passport_application'
  | 'general_query';

// Few-shot classification prompt
const INTENT_CLASSIFICATION_PROMPT = `
Classify the user's message into one of these categories:
- company_registration: Anything about registering a company, firm, business entity, OCR CAMIS, MoA, AoA, company name approval
- pan_registration: Anything about PAN (Permanent Account Number), tax registration, VAT, IRD, Inland Revenue
- passport_application: Anything about passport, travel document, Department of Passports, passport renewal
- general_query: Anything else, greetings, general questions about Nepal government processes

Examples:
User: "I want to register a private limited company" → company_registration
User: "How do I get a PAN number for my business?" → pan_registration  
User: "I need to renew my passport" → passport_application
User: "What government services can you help with?" → general_query
User: "कम्पनी दर्ता गर्न के के चाहिन्छ?" → company_registration
User: "पासपोर्टको लागि कुन कागजात चाहिन्छ?" → passport_application
User: "PAN नम्बरको लागि आवेदन" → pan_registration

User: "{user_message}"
Category:`;
```

**Implementation pattern:**
```typescript
async function classifyIntent(message: string): Promise<ProcessIntent> {
  const response = await llmProvider.chat([
    { role: 'system', content: INTENT_CLASSIFICATION_PROMPT.replace('{user_message}', message) }
  ], { temperature: 0, max_tokens: 20 });
  
  const intent = response.trim().toLowerCase();
  if (['company_registration', 'pan_registration', 'passport_application'].includes(intent)) {
    return intent as ProcessIntent;
  }
  return 'general_query';
}
```

### LangChain Tools (`src/services/agent/tools.ts`)

Define 5 tools that the LangChain agent can call:

**Tool 1: `retrieve_requirements`**
```typescript
{
  name: "retrieve_requirements",
  description: "Retrieve official requirements, documents, fees, and steps for a Nepal government process. Use this when the user asks what they need for a process.",
  parameters: {
    type: "object",
    properties: {
      process_type: {
        type: "string",
        enum: ["company_registration", "pan_registration", "passport_application"],
        description: "The government process type"
      },
      specific_query: {
        type: "string",
        description: "Specific aspect the user is asking about (e.g., 'fees', 'timeline', 'documents')"
      }
    },
    required: ["process_type"]
  },
  // Implementation: calls RAG pipeline → query Pinecone namespace → return top-3 passages
  execute: async ({ process_type, specific_query }) => {
    const query = specific_query || `requirements for ${process_type}`;
    const passages = await ragRetriever.query(query, process_type, 3);
    return {
      process_type,
      passages: passages.map(p => ({
        text: p.metadata.chunk_text,
        source_url: p.metadata.source_url,
        last_modified: p.metadata.last_modified
      })),
      retrieved_at: new Date().toISOString()
    };
  }
}
```

**Tool 2: `analyze_document`**
```typescript
{
  name: "analyze_document",
  description: "Analyze an uploaded document using OCR to extract fields, check quality, and validate completeness. Use this when the user uploads a document.",
  parameters: {
    type: "object",
    properties: {
      document_id: { type: "string", description: "The ID of the uploaded document" }
    },
    required: ["document_id"]
  },
  // Implementation: loads doc from DB → reads file → sends to GPT-4o Vision → validates → returns result
  execute: async ({ document_id }) => {
    const doc = await prisma.document.findUnique({ where: { id: document_id } });
    const imageBuffer = fs.readFileSync(doc.file_path);
    const base64 = imageBuffer.toString('base64');
    const ocrResult = await visionService.extractFields(base64, doc.file_type);
    const validation = await validator.validate(ocrResult, doc.process_type);
    return { fields: ocrResult.fields, validation, readiness_score: validation.score };
  }
}
```

**Tool 3: `generate_prefill`**
```typescript
{
  name: "generate_prefill",
  description: "Generate a pre-filled PDF form for a government process using extracted document data. Use this when the user wants to generate or download a form.",
  parameters: {
    type: "object",
    properties: {
      process_type: { type: "string", enum: ["company_registration", "pan_registration", "passport_application"] },
      field_data: { type: "object", description: "Key-value pairs of form field data" }
    },
    required: ["process_type", "field_data"]
  },
  execute: async ({ process_type, field_data }) => {
    const pdfPath = await prefillGenerator.generate(process_type, field_data);
    return { pdf_url: `/api/document/download/${path.basename(pdfPath)}`, filled_fields: Object.keys(field_data) };
  }
}
```

**Tool 4: `get_portal_link`**
```typescript
{
  name: "get_portal_link",
  description: "Get the official government portal URL and step-by-step navigation instructions for a process. Use this when the user asks where to apply or wants the link.",
  parameters: {
    type: "object",
    properties: {
      process_type: { type: "string", enum: ["company_registration", "pan_registration", "passport_application"] }
    },
    required: ["process_type"]
  },
  execute: async ({ process_type }) => {
    const links = {
      company_registration: {
        portal_name: "Office of Company Registrar (OCR) - CAMIS",
        url: "https://camis.ocr.gov.np",
        steps: [
          "1. Visit the CAMIS portal and create an account",
          "2. Apply for company name approval first",
          "3. After name approval, fill the company registration form",
          "4. Upload required documents (MoA, AoA, citizenship copies)",
          "5. Pay registration fee online or at the OCR office",
          "6. Track application status on the portal"
        ],
        warnings: ["Name approval takes 1-3 business days", "All documents must be notarized"]
      },
      pan_registration: {
        portal_name: "Inland Revenue Department (IRD) - Taxpayer Portal",
        url: "https://taxpayerportal.ird.gov.np",
        steps: [
          "1. Visit the IRD taxpayer portal",
          "2. Click 'New PAN Registration'",
          "3. Fill in business/individual details",
          "4. Upload company registration certificate and citizenship",
          "5. Submit application — PAN is usually issued same day for online applications"
        ],
        warnings: ["Ensure company is registered with OCR first before PAN application"]
      },
      passport_application: {
        portal_name: "Department of Passports - e-Portal",
        url: "https://epassport.immigration.gov.np",
        steps: [
          "1. Visit the Department of Passports e-portal",
          "2. Fill the online pre-enrollment form",
          "3. Upload citizenship scan and passport photo",
          "4. Select appointment date and office location",
          "5. Visit the office for biometric enrollment (fingerprint + photo)",
          "6. Pay fee (NPR 5,000 regular / NPR 10,000 express)",
          "7. Collect passport after processing (7-30 days)"
        ],
        warnings: [
          "Biometric enrollment MUST be done in person — cannot be completed online",
          "Appointment slots fill up quickly — book early"
        ]
      }
    };
    return links[process_type] || { error: "Unknown process type" };
  }
}
```

**Tool 5: `calculate_readiness`**
```typescript
{
  name: "calculate_readiness",
  description: "Calculate the readiness score for a user's application by checking uploaded documents against requirements. Use this to show progress.",
  parameters: {
    type: "object",
    properties: {
      process_type: { type: "string", enum: ["company_registration", "pan_registration", "passport_application"] },
      user_id: { type: "string", description: "The user's ID" }
    },
    required: ["process_type", "user_id"]
  },
  execute: async ({ process_type, user_id }) => {
    const requirements = PROCESS_REQUIREMENTS[process_type]; // defined in templates.ts
    const userDocs = await prisma.document.findMany({
      where: { user_id, process_type }
    });
    
    const checklist = requirements.map(req => {
      const matchingDoc = userDocs.find(d => d.validation_result?.document_type === req.type);
      return {
        requirement: req.name,
        status: matchingDoc ? (matchingDoc.validation_result?.valid ? 'complete' : 'invalid') : 'missing',
        document_id: matchingDoc?.id || null,
        issues: matchingDoc?.validation_result?.issues || []
      };
    });
    
    const complete = checklist.filter(c => c.status === 'complete').length;
    const total = checklist.length;
    const score = Math.round((complete / total) * 100);
    
    return { score, checklist, complete, total, process_type };
  }
}
```

### System Prompts (`src/services/agent/prompts.ts`)

**Master System Prompt:**
```
You are Saarthi AI (सारथी AI) — Nepal Government Process Copilot.

Your role is to help Nepali citizens navigate government bureaucratic processes by:
1. Identifying which government process the user needs
2. Retrieving accurate, up-to-date requirements from official sources
3. Analyzing uploaded documents for completeness and validity
4. Pre-filling application forms with extracted data
5. Providing direct links to official government portals

RULES:
- ALWAYS base your answers on retrieved official sources. Cite URLs when available.
- If you don't have information from official sources, say "I don't have confirmed information about this. Please check the official portal at [URL]."
- NEVER fabricate requirements, fees, or procedures.
- When warning about in-person requirements (biometrics, CAPTCHAs), be explicit.
- Support both English and Nepali. Respond in the language the user uses.
- Be concise but thorough. Use bullet lists for requirements.
- When showing readiness scores, explain what's missing and how to fix it.
- Always end actionable responses with a clear next step.

AVAILABLE TOOLS:
- retrieve_requirements: Get official requirements for a process
- analyze_document: OCR and validate an uploaded document
- generate_prefill: Create a pre-filled PDF form
- get_portal_link: Get the official submission portal URL and steps
- calculate_readiness: Check how ready the user is to apply

SUPPORTED PROCESSES:
1. Company Registration (OCR CAMIS) — कम्पनी दर्ता
2. PAN Registration (IRD) — स्थायी लेखा नम्बर दर्ता
3. Passport Application (Department of Passports) — राहदानी आवेदन
```

**Company Registration Context Prompt:**
```
PROCESS CONTEXT: Company Registration with Office of Company Registrar (OCR)

Key facts:
- Portal: CAMIS (Company Administration and Management Information System) at camis.ocr.gov.np
- Governing law: Companies Act, 2063 (2006)
- Types: Private Limited, Public Limited, Single-person Company
- Steps: Name Approval → Document Preparation → Form Submission → Fee Payment → Registration Certificate
- Required documents: MoA, AoA, citizenship copies of directors, passport photos, registered office proof
- Fees: Vary by authorized capital (NPR 1,000 to NPR 15,000+)
- Timeline: 7-15 business days after complete submission
- Common rejections: Name too similar to existing company, incomplete MoA, missing director signatures

When helping with company registration:
- Ask about company type (private limited is most common)
- Confirm number of directors/shareholders (minimum 1 for single-person, 2 for private limited)
- Check if they have name approval already
- Verify registered office address is confirmed
```

**PAN Registration Context Prompt:**
```
PROCESS CONTEXT: PAN Registration with Inland Revenue Department (IRD)

Key facts:
- Portal: taxpayerportal.ird.gov.np
- PAN (Permanent Account Number) is mandatory for all businesses and tax-paying individuals
- Required for: opening bank accounts, filing taxes, government contracts, import/export
- Required documents: Company registration certificate (for businesses), citizenship copy, contact details, business address proof
- Fees: Free
- Timeline: Same day for online applications, 1-3 days for in-person
- Types: Individual PAN, Business PAN (sole proprietor, partnership, company)

When helping with PAN:
- Ask if it's for an individual or business
- If business, check if company is already registered with OCR
- PAN must be obtained within 30 days of business registration
- Recommend online application as it's faster
```

**Passport Application Context Prompt:**
```
PROCESS CONTEXT: Passport Application with Department of Passports

Key facts:
- Portal: epassport.immigration.gov.np (for MRP/e-Passport)
- Types: Regular (NPR 5,000, 10 years), Express (NPR 10,000, 10 years), Minor (NPR 2,500, 5 years)
- Required documents: Citizenship certificate (original + copy), passport-size photos (3.5x4.5cm, white background), old passport (if renewal)
- Process: Online pre-enrollment → Appointment booking → In-person biometric → Processing → Collection
- Timeline: 7 days (express) to 30 days (regular) after biometric enrollment
- CRITICAL: Biometric enrollment (fingerprint + photograph) MUST be done in person at District Administration Office or Department of Passports, Kathmandu

When helping with passport:
- ALWAYS warn about mandatory in-person biometric step
- Ask if it's new application or renewal
- Check photo specifications (many rejections due to photo issues)
- Ask about urgency to recommend regular vs express
- Minor applicants need guardian's citizenship copy additionally
```

### Chat History Management

```typescript
async function buildChatContext(chatId: string): Promise<Message[]> {
  // Load last 20 messages to stay within context window
  const messages = await prisma.message.findMany({
    where: { chat_id: chatId },
    orderBy: { created_at: 'desc' },
    take: 20
  });
  
  // Reverse to chronological order
  return messages.reverse().map(m => ({
    role: m.role as 'user' | 'assistant' | 'system',
    content: m.content
  }));
}
```

### Streaming Agent Response

```typescript
async function runAgent(
  userMessage: string,
  chatId: string,
  userId: string,
  res: Response // Express response for SSE
) {
  // 1. Set SSE headers
  setupSSE(res);
  
  // 2. Load chat history
  const history = await buildChatContext(chatId);
  
  // 3. Classify intent
  const intent = await classifyIntent(userMessage);
  sendSSEEvent(res, 'intent', { intent });
  
  // 4. Build system prompt (master + process-specific)
  const systemPrompt = buildSystemPrompt(intent);
  
  // 5. Create LangChain agent with tools
  const agent = createAgent({
    llm: getLLMProvider(),
    tools: [retrieveRequirements, analyzeDocument, generatePrefill, getPortalLink, calculateReadiness],
    systemPrompt,
    chatHistory: history
  });
  
  // 6. Run agent with streaming
  let fullResponse = '';
  for await (const chunk of agent.stream(userMessage)) {
    if (chunk.type === 'token') {
      fullResponse += chunk.content;
      sendSSEEvent(res, 'token', { content: chunk.content });
    } else if (chunk.type === 'tool_call') {
      sendSSEEvent(res, 'tool_call', { tool: chunk.tool, input: chunk.input });
    } else if (chunk.type === 'tool_result') {
      sendSSEEvent(res, 'tool_result', { tool: chunk.tool, result: chunk.result });
    }
  }
  
  // 7. Save assistant message to DB
  await prisma.message.create({
    data: {
      chat_id: chatId,
      role: 'assistant',
      content: fullResponse,
      metadata: { intent, tools_used: agent.toolsUsed }
    }
  });
  
  // 8. Send done event
  sendSSEEvent(res, 'done', { message_id: savedMessage.id });
  res.end();
}
```

---

## 8. Document Analysis (OCR + Validation)

### Vision Service (`src/services/ocr/vision.ts`)

Send document images to GPT-4o Vision for structured field extraction.

```typescript
async function extractFields(base64Image: string, documentType: string): Promise<OCRResult> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: EXTRACTION_PROMPT
      },
      {
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: {
              url: `data:image/jpeg;base64,${base64Image}`,
              detail: "high"
            }
          },
          {
            type: "text",
            text: `This is a ${documentType}. Extract all fields as specified in your instructions.`
          }
        ]
      }
    ],
    response_format: { type: "json_object" },
    max_tokens: 2000
  });

  return JSON.parse(response.choices[0].message.content);
}
```

### Extraction Prompt

```
You are a document field extractor specializing in Nepali government documents. 
Given an image of a document, extract all visible fields into a structured JSON format.

For CITIZENSHIP CERTIFICATE (नागरिकता प्रमाणपत्र), extract:
{
  "document_type": "citizenship",
  "fields": {
    "name_en": "Full name in English (if visible)",
    "name_ne": "Full name in Nepali/Devanagari",
    "date_of_birth": "YYYY-MM-DD format",
    "date_of_birth_bs": "Bikram Sambat date if visible",
    "citizenship_number": "The certificate number",
    "issue_date": "YYYY-MM-DD",
    "issue_district": "District name",
    "gender": "Male/Female",
    "father_name": "Father's name",
    "mother_name": "Mother's name (if visible)",
    "spouse_name": "Spouse name (if visible)",
    "permanent_address": "Full address",
    "photo_detected": true/false,
    "signature_detected": true/false
  },
  "confidence": {
    "overall": 0.0-1.0,
    "per_field": { "name_en": 0.95, ... }
  },
  "image_quality": {
    "blur_level": "none|slight|moderate|severe",
    "rotation": "none|slight|significant",
    "resolution": "good|acceptable|poor",
    "lighting": "good|acceptable|poor"
  },
  "raw_text": "All visible text on the document"
}

For PASSPORT PHOTO, extract:
{
  "document_type": "passport_photo",
  "fields": {
    "face_detected": true/false,
    "face_centered": true/false,
    "background_color": "white|blue|other",
    "eyes_open": true/false,
    "glasses": true/false
  },
  "image_quality": {
    "resolution_sufficient": true/false,
    "proper_dimensions": true/false (should be ~3.5x4.5cm ratio),
    "lighting": "good|acceptable|poor"
  }
}

For COMPANY REGISTRATION CERTIFICATE, extract:
{
  "document_type": "company_certificate",
  "fields": {
    "company_name_en": "Company name in English",
    "company_name_ne": "Company name in Nepali",
    "registration_number": "Registration number",
    "registration_date": "YYYY-MM-DD",
    "company_type": "private_limited|public_limited|single_person",
    "registered_office": "Address",
    "authorized_capital": "Amount",
    "directors": ["Director 1 name", "Director 2 name"]
  },
  "confidence": { ... },
  "image_quality": { ... }
}

For PAN CERTIFICATE, extract:
{
  "document_type": "pan_certificate",
  "fields": {
    "pan_number": "9-digit PAN number",
    "registered_name": "Business/individual name",
    "business_type": "Type of business",
    "registration_date": "YYYY-MM-DD",
    "tax_office": "Assigned tax office"
  },
  "confidence": { ... },
  "image_quality": { ... }
}

If you cannot identify the document type, set document_type to "unknown".
Always return valid JSON. Set confidence to 0.0 for fields you cannot read.
```

### Validation Rules (`src/services/ocr/validator.ts`)

```typescript
interface ValidationResult {
  valid: boolean;
  score: number;           // 0-100
  document_type: string;
  fields_present: string[];
  fields_missing: string[];
  fields_invalid: string[];
  warnings: string[];
  suggestions: string[];
}

const VALIDATION_RULES: Record<string, ValidationConfig> = {
  citizenship: {
    required_fields: ['name_en', 'date_of_birth', 'citizenship_number', 'issue_date', 'issue_district'],
    recommended_fields: ['name_ne', 'father_name', 'permanent_address', 'gender'],
    checks: [
      { field: 'photo_detected', expected: true, warning: 'No photo detected on citizenship — may need clearer scan' },
      { field: 'signature_detected', expected: true, warning: 'No signature detected — ensure full document is scanned' },
      { field: 'image_quality.blur_level', invalid_values: ['severe', 'moderate'], suggestion: 'Document image is blurry — please retake with better lighting and focus' },
      { field: 'issue_date', check: 'not_expired', warning: 'Check that citizenship is current and not damaged' }
    ]
  },
  passport_photo: {
    required_fields: ['face_detected'],
    checks: [
      { field: 'face_detected', expected: true, suggestion: 'No face detected — upload a clear passport-size photo' },
      { field: 'face_centered', expected: true, suggestion: 'Face should be centered in the photo' },
      { field: 'background_color', expected: 'white', suggestion: 'Background should be white for Nepal passport photos' },
      { field: 'eyes_open', expected: true, suggestion: 'Eyes must be open and clearly visible' },
      { field: 'image_quality.resolution_sufficient', expected: true, suggestion: 'Photo resolution is too low — use a higher quality image' }
    ]
  },
  company_certificate: {
    required_fields: ['company_name_en', 'registration_number', 'registration_date', 'company_type'],
    recommended_fields: ['company_name_ne', 'registered_office', 'directors', 'authorized_capital'],
    checks: [
      { field: 'image_quality.blur_level', invalid_values: ['severe'], suggestion: 'Certificate image is unclear — please scan at higher resolution' }
    ]
  },
  pan_certificate: {
    required_fields: ['pan_number', 'registered_name'],
    recommended_fields: ['business_type', 'registration_date', 'tax_office'],
    checks: [
      { field: 'pan_number', check: 'format_9digits', warning: 'PAN should be a 9-digit number' }
    ]
  }
};
```

### Readiness Score Calculation

```typescript
function calculateReadinessScore(ocrResult: OCRResult, rules: ValidationConfig): number {
  const requiredCount = rules.required_fields.length;
  const recommendedCount = rules.recommended_fields?.length || 0;
  const totalWeight = requiredCount * 2 + recommendedCount; // required fields weight 2x
  
  let earnedWeight = 0;
  
  for (const field of rules.required_fields) {
    const value = ocrResult.fields[field];
    const confidence = ocrResult.confidence?.per_field?.[field] || 0;
    if (value && confidence > 0.5) {
      earnedWeight += 2; // full credit
    } else if (value && confidence > 0.3) {
      earnedWeight += 1; // partial credit (low confidence)
    }
  }
  
  for (const field of (rules.recommended_fields || [])) {
    const value = ocrResult.fields[field];
    if (value) earnedWeight += 1;
  }
  
  // Penalty for image quality issues
  let penalty = 0;
  if (ocrResult.image_quality?.blur_level === 'severe') penalty += 15;
  else if (ocrResult.image_quality?.blur_level === 'moderate') penalty += 5;
  if (ocrResult.image_quality?.resolution === 'poor') penalty += 10;
  
  const rawScore = (earnedWeight / totalWeight) * 100;
  return Math.max(0, Math.min(100, Math.round(rawScore - penalty)));
}
```

### Return Format

```typescript
interface DocumentAnalysisResponse {
  document_id: string;
  document_type: string;
  fields: Array<{
    name: string;
    value: string | null;
    confidence: number;
    status: 'present' | 'missing' | 'low_confidence';
  }>;
  missing: string[];
  warnings: string[];
  suggestions: string[];
  readiness_score: number;
  image_quality: {
    blur_level: string;
    rotation: string;
    resolution: string;
    overall: 'good' | 'acceptable' | 'poor';
  };
  raw_text: string;
}
```
## 9. PDF Prefill Service

### Overview (`src/services/prefill/generator.ts`)

Uses `pdf-lib` to either fill an existing PDF template or generate a new PDF with form data.

```typescript
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

async function generatePrefilledPDF(
  processType: string,
  fieldData: Record<string, string>
): Promise<string> {
  const templatePath = path.join(__dirname, '../../../templates', `${processType}.pdf`);
  
  let pdfDoc: PDFDocument;
  
  if (fs.existsSync(templatePath)) {
    // Fill existing template
    const templateBytes = fs.readFileSync(templatePath);
    pdfDoc = await PDFDocument.load(templateBytes);
    const form = pdfDoc.getForm();
    
    const mapping = FIELD_MAPPINGS[processType];
    for (const [ourField, formField] of Object.entries(mapping)) {
      if (fieldData[ourField]) {
        try {
          const field = form.getTextField(formField);
          field.setText(fieldData[ourField]);
        } catch (e) {
          // Field not found in template — log and skip
          logger.warn(`Form field ${formField} not found in template`);
        }
      }
    }
  } else {
    // Generate new PDF with data
    pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const page = pdfDoc.addPage([595, 842]); // A4
    
    // Title
    const title = PROCESS_TITLES[processType] || 'Application Form';
    page.drawText(title, { x: 50, y: 780, size: 18, font: boldFont, color: rgb(0.1, 0.2, 0.4) });
    page.drawText('Pre-filled by Saarthi AI', { x: 50, y: 760, size: 10, font, color: rgb(0.5, 0.5, 0.5) });
    
    // Fields
    let y = 720;
    const fields = FIELD_DISPLAY_ORDER[processType] || Object.keys(fieldData);
    for (const fieldName of fields) {
      const label = FIELD_LABELS[fieldName] || fieldName;
      const value = fieldData[fieldName] || '________________';
      
      page.drawText(`${label}:`, { x: 50, y, size: 11, font: boldFont });
      page.drawText(value, { x: 250, y, size: 11, font });
      y -= 25;
      
      if (y < 50) {
        // Add new page if needed
        const newPage = pdfDoc.addPage([595, 842]);
        y = 780;
      }
    }
  }
  
  const pdfBytes = await pdfDoc.save();
  const outputPath = path.join(__dirname, '../../../uploads/prefilled', `${processType}_${Date.now()}.pdf`);
  fs.writeFileSync(outputPath, pdfBytes);
  
  return outputPath;
}
```

### Field Mappings (`src/services/prefill/templates.ts`)

```typescript
const FIELD_MAPPINGS: Record<string, Record<string, string>> = {
  company_registration: {
    // Our extracted field → PDF form field name
    company_name_en: 'company_name',
    company_name_ne: 'company_name_nepali',
    company_type: 'type_of_company',
    registered_office: 'registered_office_address',
    authorized_capital: 'authorized_capital_amount',
    paid_up_capital: 'paid_up_capital_amount',
    director_1_name: 'director_name_1',
    director_1_citizenship: 'director_citizenship_no_1',
    director_1_address: 'director_address_1',
    director_2_name: 'director_name_2',
    director_2_citizenship: 'director_citizenship_no_2',
    director_2_address: 'director_address_2',
    objectives: 'company_objectives',
  },
  pan_registration: {
    applicant_name: 'taxpayer_name',
    business_name: 'business_name',
    business_type: 'business_nature',
    pan_type: 'registration_type',
    address: 'business_address',
    contact_phone: 'phone_number',
    contact_email: 'email_address',
    registration_number: 'company_reg_number',
    registration_date: 'company_reg_date',
  },
  passport_application: {
    full_name_en: 'applicant_name_english',
    full_name_ne: 'applicant_name_nepali',
    date_of_birth: 'dob',
    birthplace: 'place_of_birth',
    gender: 'sex',
    citizenship_number: 'citizenship_certificate_no',
    issue_district: 'citizenship_issued_district',
    father_name: 'father_full_name',
    mother_name: 'mother_full_name',
    spouse_name: 'spouse_full_name',
    permanent_address: 'permanent_address',
    contact_phone: 'mobile_number',
    emergency_contact_name: 'emergency_contact_name',
    emergency_contact_phone: 'emergency_contact_number',
  }
};

const FIELD_LABELS: Record<string, string> = {
  company_name_en: 'Company Name (English)',
  company_name_ne: 'Company Name (Nepali)',
  company_type: 'Company Type',
  registered_office: 'Registered Office Address',
  authorized_capital: 'Authorized Capital (NPR)',
  paid_up_capital: 'Paid-up Capital (NPR)',
  director_1_name: 'Director 1 - Full Name',
  director_1_citizenship: 'Director 1 - Citizenship No.',
  full_name_en: 'Full Name (English)',
  full_name_ne: 'Full Name (Nepali)',
  date_of_birth: 'Date of Birth',
  citizenship_number: 'Citizenship Number',
  father_name: "Father's Name",
  mother_name: "Mother's Name",
  permanent_address: 'Permanent Address',
  applicant_name: 'Applicant Name',
  business_name: 'Business Name',
  business_type: 'Nature of Business',
  // ... add more as needed
};

const FIELD_DISPLAY_ORDER: Record<string, string[]> = {
  company_registration: [
    'company_name_en', 'company_name_ne', 'company_type', 'registered_office',
    'authorized_capital', 'paid_up_capital', 'director_1_name', 'director_1_citizenship',
    'director_1_address', 'director_2_name', 'director_2_citizenship', 'director_2_address',
    'objectives'
  ],
  pan_registration: [
    'applicant_name', 'business_name', 'business_type', 'pan_type',
    'address', 'contact_phone', 'contact_email', 'registration_number', 'registration_date'
  ],
  passport_application: [
    'full_name_en', 'full_name_ne', 'date_of_birth', 'birthplace', 'gender',
    'citizenship_number', 'issue_district', 'father_name', 'mother_name',
    'spouse_name', 'permanent_address', 'contact_phone',
    'emergency_contact_name', 'emergency_contact_phone'
  ]
};

const PROCESS_TITLES: Record<string, string> = {
  company_registration: 'Company Registration Application — Office of Company Registrar',
  pan_registration: 'PAN Registration Application — Inland Revenue Department',
  passport_application: 'Passport Application Form — Department of Passports'
};
```

### Return Format

```typescript
interface PrefillResult {
  pdf_path: string;
  download_url: string;     // /api/document/download/{filename}
  filled_fields: string[];  // fields that were filled
  missing_fields: string[]; // fields that couldn't be filled (no data)
  process_type: string;
}
```

---

## 10. Speech-to-Text (Whisper)

### Endpoint (`src/services/speech.ts`)

```typescript
import OpenAI from 'openai';
import fs from 'fs';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function transcribeAudio(filePath: string): Promise<TranscriptionResult> {
  // Validate file
  const stats = fs.statSync(filePath);
  if (stats.size > 25 * 1024 * 1024) {
    throw new AppError('Audio file too large. Maximum size is 25MB.', 400);
  }
  
  const allowedFormats = ['.mp3', '.mp4', '.mpeg', '.mpga', '.m4a', '.wav', '.webm'];
  const ext = path.extname(filePath).toLowerCase();
  if (!allowedFormats.includes(ext)) {
    throw new AppError(`Unsupported audio format: ${ext}. Supported: ${allowedFormats.join(', ')}`, 400);
  }

  const transcription = await openai.audio.transcriptions.create({
    file: fs.createReadStream(filePath),
    model: 'whisper-1',
    // Don't specify language — let Whisper auto-detect (supports Nepali + English)
    response_format: 'verbose_json', // includes language detection
  });

  // Clean up temp audio file
  fs.unlinkSync(filePath);

  return {
    text: transcription.text,
    language: transcription.language,  // 'en', 'ne', etc.
    duration: transcription.duration,
    segments: transcription.segments   // word-level timestamps if needed
  };
}

interface TranscriptionResult {
  text: string;
  language: string;
  duration: number;
  segments?: any[];
}
```

### Route Handler (`src/routes/chat.routes.ts`)

```typescript
// POST /api/chat/:id/speech
router.post('/:id/speech', authMiddleware, upload.single('audio'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: true, message: 'No audio file provided' });
    }
    
    const result = await transcribeAudio(req.file.path);
    
    res.json({
      text: result.text,
      language: result.language,
      duration: result.duration
    });
  } catch (error) {
    next(error);
  }
});
```

---

## 11. SSE Streaming Implementation

### SSE Helper Utility (`src/utils/sse.ts`)

```typescript
import { Response } from 'express';

export function setupSSE(res: Response): void {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',  // Disable nginx buffering if behind proxy
  });
  res.flushHeaders();
}

export function sendSSEEvent(res: Response, eventType: string, data: any): void {
  res.write(`event: ${eventType}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

export function endSSE(res: Response): void {
  res.write('event: done\ndata: {}\n\n');
  res.end();
}

// Heartbeat to keep connection alive
export function startHeartbeat(res: Response, intervalMs: number = 30000): NodeJS.Timeout {
  return setInterval(() => {
    res.write(': heartbeat\n\n');  // SSE comment (ignored by clients)
  }, intervalMs);
}
```

### Event Types

| Event Type | Data Shape | Description |
|-----------|------------|-------------|
| `token` | `{ content: string }` | Single token/chunk of the LLM response |
| `tool_call` | `{ tool: string, input: object }` | Agent is calling a tool (show loading indicator) |
| `tool_result` | `{ tool: string, result: object }` | Tool execution completed |
| `intent` | `{ intent: string }` | Detected process intent |
| `readiness` | `{ score: number, checklist: array }` | Updated readiness score |
| `error` | `{ message: string, code: string }` | Error occurred |
| `done` | `{ message_id: string }` | Stream completed, final message saved |

### Chat Message SSE Endpoint

```typescript
// POST /api/chat/:id/message
router.post('/:id/message', authMiddleware, async (req, res) => {
  const { content, attachments } = req.body;
  const chatId = req.params.id;
  const userId = req.user.id;
  
  // Save user message to DB
  await prisma.message.create({
    data: { chat_id: chatId, role: 'user', content, metadata: { attachments } }
  });
  
  // Set up SSE
  setupSSE(res);
  const heartbeat = startHeartbeat(res);
  
  // Handle client disconnect
  req.on('close', () => {
    clearInterval(heartbeat);
    // Cleanup any running agent tasks
  });
  
  try {
    // Run the agent (streams responses via SSE)
    await runAgent(content, chatId, userId, res);
  } catch (error) {
    sendSSEEvent(res, 'error', { 
      message: 'An error occurred while processing your request.',
      code: 'AGENT_ERROR'
    });
  } finally {
    clearInterval(heartbeat);
    res.end();
  }
});
```

### Message Accumulation

```typescript
// Inside the agent loop, accumulate tokens for DB save
let fullResponseText = '';
const toolsCalled: string[] = [];

agent.on('token', (token: string) => {
  fullResponseText += token;
  sendSSEEvent(res, 'token', { content: token });
});

agent.on('toolCall', (toolName: string, input: any) => {
  toolsCalled.push(toolName);
  sendSSEEvent(res, 'tool_call', { tool: toolName, input });
});

agent.on('done', async () => {
  // Save complete message to DB
  const savedMessage = await prisma.message.create({
    data: {
      chat_id: chatId,
      role: 'assistant',
      content: fullResponseText,
      metadata: { tools_used: toolsCalled, intent }
    }
  });
  
  sendSSEEvent(res, 'done', { message_id: savedMessage.id });
});
```

---

## 12. Docker & DevOps

### Backend Dockerfile

```dockerfile
# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

COPY . .

RUN npx prisma generate
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/templates ./templates

# Create uploads directory
RUN mkdir -p uploads/prefilled

EXPOSE 3001

# Run migrations then start server
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
```

### docker-compose.yml (root level)

```yaml
version: '3.8'

services:
  mysql:
    image: mysql:8.0
    container_name: saarthi-mysql
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD:-saarthi_root_pass}
      MYSQL_DATABASE: ${MYSQL_DATABASE:-saarthi_db}
      MYSQL_USER: ${MYSQL_USER:-saarthi_user}
      MYSQL_PASSWORD: ${MYSQL_PASSWORD:-saarthi_pass}
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: saarthi-backend
    restart: unless-stopped
    ports:
      - "${BACKEND_PORT:-3001}:3001"
    environment:
      DATABASE_URL: mysql://${MYSQL_USER:-saarthi_user}:${MYSQL_PASSWORD:-saarthi_pass}@mysql:3306/${MYSQL_DATABASE:-saarthi_db}
      JWT_SECRET: ${JWT_SECRET}
      OPENAI_API_KEY: ${OPENAI_API_KEY}
      ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY}
      GEMINI_API_KEY: ${GEMINI_API_KEY}
      PINECONE_API_KEY: ${PINECONE_API_KEY}
      PINECONE_INDEX: ${PINECONE_INDEX:-saarthi-gov-docs}
      ACTIVE_LLM_PROVIDER: ${ACTIVE_LLM_PROVIDER:-openai}
      UPLOAD_DIR: /app/uploads
      PORT: 3001
      FRONTEND_URL: http://localhost:5173
    volumes:
      - backend_uploads:/app/uploads
      - ./backend/templates:/app/templates
    depends_on:
      mysql:
        condition: service_healthy

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: saarthi-frontend
    restart: unless-stopped
    ports:
      - "${FRONTEND_PORT:-5173}:80"
    depends_on:
      - backend

volumes:
  mysql_data:
  backend_uploads:
```

### Development Override (`docker-compose.dev.yml`)

```yaml
version: '3.8'

services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.dev
    volumes:
      - ./backend/src:/app/src          # Hot reload source code
      - ./backend/prisma:/app/prisma    # Schema changes
      - backend_uploads:/app/uploads
    command: npx ts-node-dev --respawn --transpile-only src/index.ts
    environment:
      NODE_ENV: development

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.dev
    volumes:
      - ./frontend/src:/app/src
      - ./frontend/public:/app/public
    ports:
      - "5173:5173"
    command: npm run dev -- --host 0.0.0.0
    environment:
      VITE_API_URL: http://localhost:3001
```

### Backend Dev Dockerfile (`backend/Dockerfile.dev`)

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

COPY . .

RUN npx prisma generate

EXPOSE 3001

CMD ["npx", "ts-node-dev", "--respawn", "--transpile-only", "src/index.ts"]
```

### Starting the Stack

```bash
# Development (with hot reload)
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build

# Production-like
docker-compose up --build

# Just MySQL (if running backend/frontend natively)
docker-compose up mysql
```

---

## 13. Error Handling & Logging

### Global Error Handler (`src/middleware/errorHandler.ts`)

```typescript
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

class AppError extends Error {
  statusCode: number;
  code: string;
  
  constructor(message: string, statusCode: number = 500, code: string = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

function errorHandler(err: Error, req: Request, res: Response, next: NextFunction): void {
  if (err instanceof AppError) {
    logger.warn({
      code: err.code,
      message: err.message,
      path: req.path,
      method: req.method,
      requestId: req.headers['x-request-id']
    });
    
    res.status(err.statusCode).json({
      error: true,
      message: err.message,
      code: err.code
    });
    return;
  }
  
  // Unexpected errors
  logger.error({
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });
  
  res.status(500).json({
    error: true,
    message: 'An unexpected error occurred. Please try again.',
    code: 'INTERNAL_ERROR'
  });
}

export { AppError, errorHandler };
```

### Logger (`src/utils/logger.ts`)

```typescript
// Use pino for structured JSON logging (fast, minimal)
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV === 'development' 
    ? { target: 'pino-pretty', options: { colorize: true } }
    : undefined,
});
```

### Request ID Middleware

```typescript
import { v4 as uuidv4 } from 'uuid';

function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  req.headers['x-request-id'] = req.headers['x-request-id'] || uuidv4();
  res.setHeader('X-Request-ID', req.headers['x-request-id']);
  next();
}
```

### Common Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `AUTH_INVALID_CREDENTIALS` | 401 | Wrong email or password |
| `AUTH_TOKEN_EXPIRED` | 401 | JWT token has expired |
| `AUTH_TOKEN_MISSING` | 401 | No authorization header |
| `AUTH_EMAIL_EXISTS` | 409 | Email already registered |
| `DOCUMENT_NOT_FOUND` | 404 | Document ID not found |
| `DOCUMENT_TOO_LARGE` | 413 | File exceeds size limit |
| `DOCUMENT_INVALID_TYPE` | 415 | Unsupported file type |
| `CHAT_NOT_FOUND` | 404 | Chat ID not found |
| `LLM_PROVIDER_ERROR` | 502 | LLM API call failed |
| `RAG_QUERY_FAILED` | 502 | Pinecone query failed |
| `OCR_ANALYSIS_FAILED` | 500 | GPT-4o Vision call failed |
| `PREFILL_GENERATION_FAILED` | 500 | PDF generation failed |
| `SPEECH_TRANSCRIPTION_FAILED` | 502 | Whisper API call failed |
| `CONSENT_REQUIRED` | 403 | Document upload without consent |

---

## 14. Development Workflow

### npm Scripts (`package.json`)

```json
{
  "scripts": {
    "dev": "ts-node-dev --respawn --transpile-only src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:migrate:deploy": "prisma migrate deploy",
    "prisma:seed": "ts-node prisma/seed.ts",
    "prisma:studio": "prisma studio",
    "ingest": "ts-node src/services/rag/ingest.ts",
    "lint": "eslint src --ext .ts",
    "typecheck": "tsc --noEmit"
  }
}
```

### Key Dependencies

```json
{
  "dependencies": {
    "express": "^4.18",
    "@prisma/client": "^5.x",
    "jsonwebtoken": "^9.x",
    "bcryptjs": "^2.4",
    "multer": "^1.4",
    "cors": "^2.8",
    "openai": "^4.x",
    "@anthropic-ai/sdk": "^0.x",
    "@google/generative-ai": "^0.x",
    "@pinecone-database/pinecone": "^2.x",
    "langchain": "^0.x",
    "@langchain/openai": "^0.x",
    "@langchain/anthropic": "^0.x",
    "@langchain/google-genai": "^0.x",
    "pdf-lib": "^1.17",
    "pino": "^8.x",
    "uuid": "^9.x",
    "zod": "^3.x"
  },
  "devDependencies": {
    "typescript": "^5.x",
    "ts-node-dev": "^2.x",
    "prisma": "^5.x",
    "@types/express": "^4.x",
    "@types/multer": "^1.x",
    "@types/cors": "^2.x",
    "@types/jsonwebtoken": "^9.x",
    "@types/bcryptjs": "^2.x",
    "pino-pretty": "^10.x"
  }
}
```

### Running Locally (Without Docker)

```bash
# 1. Start MySQL (via Docker or local install)
docker run -d --name saarthi-mysql -e MYSQL_ROOT_PASSWORD=root -e MYSQL_DATABASE=saarthi_db -p 3306:3306 mysql:8.0

# 2. Set up .env
cp .env.example .env
# Edit .env with your API keys

# 3. Install dependencies
npm install

# 4. Run migrations
npx prisma migrate dev

# 5. Seed database (optional)
npm run prisma:seed

# 6. Ingest RAG data (if data files are ready)
npm run ingest

# 7. Start development server
npm run dev
```

### Testing Strategy (If Time Permits)

```typescript
// Use Vitest for fast TypeScript testing
// Focus on testing services, not routes (routes are thin wrappers)

// Example: test intent classification
describe('Intent Classification', () => {
  it('should classify company registration intent', async () => {
    const intent = await classifyIntent('I want to register a company');
    expect(intent).toBe('company_registration');
  });
  
  it('should classify Nepali input', async () => {
    const intent = await classifyIntent('कम्पनी दर्ता गर्नुपर्छ');
    expect(intent).toBe('company_registration');
  });
  
  it('should default to general_query for unknown', async () => {
    const intent = await classifyIntent('Hello, how are you?');
    expect(intent).toBe('general_query');
  });
});

// Example: test readiness score calculation
describe('Readiness Score', () => {
  it('should return 100 for all fields present', () => {
    const score = calculateReadinessScore(fullOCRResult, citizenshipRules);
    expect(score).toBe(100);
  });
  
  it('should penalize for missing required fields', () => {
    const score = calculateReadinessScore(partialOCRResult, citizenshipRules);
    expect(score).toBeLessThan(100);
  });
});
```

### Backend Build Order (What to Build First)

| Priority | Component | Estimated Time | Dependencies |
|----------|-----------|---------------|-------------|
| 1 | Express scaffold + middleware + health route | 30 min | None |
| 2 | Prisma schema + migrations + DB connection | 45 min | Docker MySQL running |
| 3 | Auth service + routes (register/login/me) | 1.5 hrs | Prisma |
| 4 | Chat CRUD routes (create/list/get/delete) | 1 hr | Auth middleware |
| 5 | LLM provider factory (OpenAI first, others later) | 1.5 hrs | API keys |
| 6 | Pinecone client + RAG retriever | 1.5 hrs | Pinecone account + data |
| 7 | Agent orchestrator + intent classification | 2 hrs | LLM + RAG |
| 8 | SSE streaming for chat messages | 1 hr | Agent |
| 9 | Document upload (multer) + OCR (Vision) | 2 hrs | LLM provider |
| 10 | Document validation + readiness score | 1 hr | OCR |
| 11 | Prefill PDF service | 1.5 hrs | Templates |
| 12 | Whisper speech-to-text endpoint | 30 min | API key |
| 13 | LangChain tools integration | 1.5 hrs | All services |
| 14 | Additional LLM providers (Anthropic, Gemini) | 1 hr | Base provider |
| **Total** | | **~16 hrs** | |
