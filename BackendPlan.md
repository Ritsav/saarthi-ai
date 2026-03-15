# Saarthi AI - Backend Development Plan (Pipeline MVP)

> AI-assisted document processing and government form autofill for Nepal
>
> Stack: Express.js + TypeScript | Prisma + MySQL | Gemini | Zod | SSE

---

## 1) Product Direction

Saarthi AI backend is now a **document processing pipeline**, not a chatbot/RAG system.

Primary flow:

```
Upload document -> OCR + extraction -> validation -> autofill mapping -> extension consumption
```

### In Scope (MVP)

- Identity/government document upload and management.
- OCR + structured extraction for:
  - Citizenship
  - Passport
  - PAN certificate
- Deterministic validation and readiness scoring.
- Autofill payload generation for supported government portals.
- Chrome extension API contract.

### Out of Scope (for now)

- RAG/vector databases (Pinecone).
- LangChain/agent orchestration.
- Chat-first product surface.
- Speech-to-text pipeline.
- Complex microservice or distributed architecture.

---

## 2) Current Baseline (Already Implemented)

- Platform core: Express bootstrap, health route, error handling, CORS, request ID, logger.
- Data layer: Prisma + MySQL schema, migrations, seed, DB singleton.
- Auth: register/login/me + JWT middleware.
- Chat core + SSE transport (retained as supporting infrastructure).
- LLM layer: provider abstraction + Gemini integration with model auto-resolution.

These are stable foundations. New work starts from document pipeline modules.

---

## 3) High-Level Architecture

## 3.1 Request Flow

1. Client uploads file (`/api/document/upload`).
2. Backend stores metadata and sets status `PENDING`.
3. Analyze request (`/api/document/:id/analyze`) triggers OCR/extraction:
   - set status `PROCESSING`
   - run OCR + schema-shaped extraction
   - persist `ocr_result`
4. Validation runs on extracted output:
   - missing fields
   - format checks
   - confidence and readiness score
   - persist `validation_result`
5. Backend sets status `COMPLETED` or `FAILED`.
6. Autofill endpoint returns portal-ready field mapping.
7. Extension consumes mapping and fills fields on known portals.

## 3.2 Design Principles

- Define strict schemas first (Zod + TS types).
- Keep modules small and testable.
- Prefer deterministic validation over LLM guessing.
- Avoid persisting raw sensitive data unless needed.
- Never log OCR raw text or PII-heavy payloads.

---

## 4) Target Backend Structure

```text
backend/
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── src/
│   ├── index.ts
│   ├── config/
│   │   ├── env.ts
│   │   └── database.ts
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   ├── chat.controller.ts
│   │   ├── health.controller.ts
│   │   ├── document.controller.ts        # new
│   │   ├── autofill.controller.ts        # new
│   │   └── extension.controller.ts       # new
│   ├── middleware/
│   │   ├── auth.ts
│   │   ├── cors.ts
│   │   ├── error-handler.ts
│   │   ├── not-found.ts
│   │   ├── request-id.ts
│   │   └── upload.ts                     # new
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── chat.routes.ts
│   │   ├── health.routes.ts
│   │   ├── document.routes.ts            # replace placeholder
│   │   ├── process.routes.ts             # can stay thin/deprecated
│   │   ├── autofill.routes.ts            # new
│   │   └── extension.routes.ts           # new
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── chat.service.ts
│   │   ├── chat-responder.ts
│   │   ├── document.service.ts           # new
│   │   ├── storage.service.ts            # new (file handling)
│   │   ├── ocr/
│   │   │   ├── processor.ts              # new (orchestrates OCR pipeline)
│   │   │   ├── gemini-vision.ts          # new (image -> extraction)
│   │   │   ├── extractor.ts              # new (prompt + parse)
│   │   │   ├── validator.ts              # new
│   │   │   └── confidence.ts             # new
│   │   ├── autofill/
│   │   │   ├── mapper.ts                 # new (data -> form fields)
│   │   │   ├── portals.ts                # new (portal metadata + selectors)
│   │   │   └── aggregator.ts             # new
│   │   └── llm/
│   │       ├── provider.ts
│   │       ├── gemini.ts
│   │       ├── index.ts
│   │       └── chat-runner.ts
│   ├── schemas/
│   │   ├── document.schema.ts            # new (request schemas)
│   │   ├── extracted.schema.ts           # new (citizenship/passport/PAN)
│   │   ├── validation.schema.ts          # new
│   │   └── autofill.schema.ts            # new
│   ├── types/
│   │   ├── express.d.ts
│   │   ├── document.types.ts             # new
│   │   └── extension.types.ts            # new
│   └── utils/
│       ├── errors.ts
│       ├── logger.ts
│       ├── response.ts
│       ├── sse.ts
│       └── redact.ts                     # new
└── uploads/                              # temp docs (gitignored)
```

---

## 5) Data Model Updates

## 5.1 Prisma Changes

The current `Document` model already has `ocr_result` and `validation_result` JSON fields. Add processing state.

### New enum

```prisma
enum DocumentStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
}
```

### Document additions

```prisma
model Document {
  // existing fields...
  status               DocumentStatus @default(PENDING)
  processing_error     String?
  processed_at         DateTime?
  updated_at           DateTime      @updatedAt

  @@index([status])
}
```

## 5.2 Recommended DocumentType Cleanup

Current enum has older values (`PASSPORT_PHOTO`, `COMPANY_MOA`, etc.). For MVP extraction, prioritize these values:

- `CITIZENSHIP`
- `PASSPORT_PHOTO` (for passport workflow photo checks)
- `PAN_CERTIFICATE`

Other values can remain for backward compatibility.

---

## 6) Core Schemas and Contracts

Define these schemas before implementing OCR handlers.

## 6.1 Extracted Payload (Base)

```ts
type ExtractedBase = {
  documentType: 'CITIZENSHIP' | 'PASSPORT_PHOTO' | 'PAN_CERTIFICATE';
  rawText?: string;
  confidence: {
    overall: number; // 0..1
    fields: Record<string, number>;
  };
};
```

## 6.2 Citizenship Fields

- `nameEn?`, `nameNe?`
- `citizenshipNumber`
- `dateOfBirth?`
- `issueDate?`
- `issueDistrict?`
- `fatherName?`, `motherName?`
- `address?`
- `photoDetected?`, `signatureDetected?`

## 6.3 Passport Photo Fields

- `faceDetected`
- `faceCentered?`
- `backgroundColor?`
- `resolutionSufficient?`
- `lightingQuality?`

## 6.4 PAN Certificate Fields

- `panNumber`
- `registeredName`
- `businessType?`
- `registrationDate?`
- `taxOffice?`

## 6.5 Validation Result Contract

```ts
type ValidationResult = {
  isValid: boolean;
  readinessScore: number; // 0..100
  fieldsPresent: string[];
  fieldsMissing: string[];
  fieldsInvalid: string[];
  lowConfidenceFields: string[];
  warnings: string[];
  suggestions: string[];
};
```

## 6.6 Autofill Contract (Backend Internal)

```ts
type AutofillPayload = {
  processType: 'COMPANY_REGISTRATION' | 'PAN_REGISTRATION' | 'PASSPORT_APPLICATION';
  portal: {
    key: string;
    name: string;
    urlPattern: string;
  };
  fields: Array<{
    selector: string;
    value: string;
    sourceDocumentId?: string;
    confidence?: number;
  }>;
  missingFields: string[];
  warnings: string[];
  generatedAt: string;
};
```

---

## 7) API Surface (Pipeline-Focused)

All endpoints under `/api`.
Protected endpoints require `Authorization: Bearer <token>`.

## 7.1 Auth (existing)

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

## 7.2 Document APIs (new primary)

- `POST /api/document/upload` - upload file + metadata
- `GET /api/document` - list user documents
- `GET /api/document/:id` - get one document with OCR/validation
- `DELETE /api/document/:id` - delete record + file
- `POST /api/document/:id/analyze` - run OCR + extraction + validation

### Upload request (multipart/form-data)

- `file` (required)
- `document_type` (optional; inferred if missing)
- `process_type` (optional)
- `chat_id` (optional legacy link)

## 7.3 Autofill APIs

- `GET /api/autofill/:processType` - returns mapped form payload
- `GET /api/autofill/:processType/preview` - optional debug mapping preview

## 7.4 Extension APIs

- `GET /api/extension/portals` - supported portals + URL patterns
- `GET /api/extension/autofill/:portalKey` - selector-value payload for content script
- `GET /api/extension/status/:portalKey` - readiness summary for popup UI

## 7.5 Response Envelope

```json
{ "success": true, "data": {} }
```

```json
{ "error": true, "message": "...", "code": "..." }
```

---

## 8) OCR and Extraction Strategy

## 8.1 Provider Strategy

- Use current Gemini provider foundation.
- Add vision-capable extraction service for image/PDF page processing.
- Force JSON-shaped output with strict prompt instructions.

## 8.2 Processing Steps

1. Load file safely from storage.
2. Pre-check MIME, size, and extension.
3. If PDF, convert first page (or key pages) to image if needed.
4. Send image + schema-aware prompt to Gemini.
5. Parse JSON response.
6. Validate against Zod extracted schema.
7. Persist `ocr_result`.

## 8.3 Failure Handling

- Retry once for transient provider errors.
- Mark `FAILED` with `processing_error` message on unrecoverable failure.
- Return stable error codes (`OCR_ERROR`, `OCR_TIMEOUT`, `EXTRACTION_INVALID_JSON`).

---

## 9) Validation and Scoring Strategy

Validation must be deterministic and explainable.

## 9.1 Rules

- Required field presence by document type.
- Format checks:
  - PAN: 9 digits
  - Date fields: parseable date
  - Key identifiers: non-empty normalized values
- Confidence thresholds:
  - `>= 0.75`: good
  - `0.5-0.74`: low confidence warning
  - `< 0.5`: treat as missing/invalid

## 9.2 Readiness Score

Simple weighted formula:

- Required fields: weight 2
- Recommended fields: weight 1
- Quality penalties (blur, low confidence clusters)

Output range: `0..100`.

---

## 10) Autofill Mapping Strategy

## 10.1 Mapping Inputs

- Latest completed document extractions.
- Validation outputs to skip unusable fields.
- Process type and portal key.

## 10.2 Mapping Outputs

- Selector-based field list for extension content script.
- Missing required form fields.
- Warnings if field confidence is low.

## 10.3 Supported MVP Portals

- OCR CAMIS (company registration)
- IRD taxpayer portal (PAN)
- Passport portal

Selectors are hardcoded per portal version (fastest and most reliable for hackathon MVP).

---

## 11) Security and Privacy

- Treat all identity documents as sensitive.
- Do not log raw OCR text or extracted PII payloads.
- Do not expose local file paths in API responses.
- Enforce file size/type validation on upload.
- Verify ownership on every document read/delete/analyze operation.
- Prefer temporary storage and cleanup policy for raw files.
- Keep JWT auth mandatory for document and extension endpoints.

---

## 12) Observability and Error Codes

## 12.1 Core Error Codes

- `UNAUTHORIZED`
- `VALIDATION_ERROR`
- `DOCUMENT_NOT_FOUND`
- `DOCUMENT_INVALID_TYPE`
- `DOCUMENT_TOO_LARGE`
- `OCR_ERROR`
- `OCR_TIMEOUT`
- `EXTRACTION_INVALID_JSON`
- `AUTOFILL_NOT_READY`
- `PORTAL_NOT_SUPPORTED`

## 12.2 Logging

- Include request ID, user ID, document ID, phase, duration.
- Redact tokens, personal numbers, and raw OCR payloads.

---

## 13) Dependencies (MVP-Oriented)

Required:

- `express`, `zod`, `multer`
- `@prisma/client`, `prisma`
- `@google/generative-ai`
- `jsonwebtoken`, `bcrypt`
- `pino`

Optional for later:

- `pdf-lib`
- additional LLM providers

Not required for current scope:

- `langchain`
- `@pinecone-database/pinecone`

---

## 14) Build Order (Execution)

1. Schema-first:
   - Zod extracted + validation + autofill schemas.
   - Prisma `DocumentStatus` migration.
2. Document module:
   - Upload middleware + CRUD.
3. OCR module:
   - Gemini extraction + analyze endpoint.
4. Validation module:
   - deterministic scoring + persistence.
5. Autofill module:
   - mapping tables + autofill endpoints.
6. Extension contract:
   - portal metadata + selector payload endpoints.
7. Hardening:
   - log redaction, tests, cleanup policy.

---

## 15) Acceptance Checklist

- User can upload citizenship/passport/PAN docs and list them.
- User can analyze a document and get structured JSON + readiness score.
- Validation output is deterministic and includes missing/invalid/low-confidence fields.
- Autofill endpoint returns portal selector-value mappings.
- Extension endpoints provide portal metadata and fill payloads with JWT auth.
- No sensitive OCR/document payloads appear in logs.

---

## 16) Notes

- Keep chat infrastructure intact but secondary.
- Focus on a working end-to-end demo over architectural perfection.
- Prefer simple, explicit mappings and rules over complex inference.
