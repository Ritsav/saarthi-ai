# Saarthi AI - Chrome Extension Plan (MVP)

> Browser autofill companion for Nepal government portals
>
> Target: Chrome (Manifest V3), auto-detect + user-confirmed fill, JWT-authenticated backend access

---

## 1) Goals

Build a Chrome extension that:

- Detects when user is on a supported government portal.
- Fetches prepared autofill data from Saarthi backend.
- Lets user review field mappings before filling.
- Fills form fields on the page using hardcoded selectors.

## 1.1 Non-goals (MVP)

- Cross-browser packaging (Firefox/Safari).
- AI-based form matching for unknown portals.
- Fully autonomous submit flows.

---

## 2) UX Flow

1. User logs in from extension popup (email/password).
2. User opens a supported government form page.
3. Content script auto-detects portal via URL pattern.
4. Extension popup shows:
   - detected portal
   - readiness status
   - fill button
5. On click, extension fetches backend fill payload.
6. Content script fills matched fields and reports success/missing fields.

Safety behavior:

- Default is **manual confirmation** before fill.
- No auto-submit.
- Highlight fields that could not be filled.

---

## 3) Supported Portals (MVP)

## 3.1 CAMIS (OCR)

- Portal key: `camis_company`
- Match patterns:
  - `https://camis.ocr.gov.np/*`

## 3.2 IRD Taxpayer Portal

- Portal key: `ird_pan`
- Match patterns:
  - `https://taxpayerportal.ird.gov.np/*`
  - `https://ird.gov.np/*` (if specific form pages are used)

## 3.3 Passport Portal

- Portal key: `nepal_passport`
- Match patterns:
  - `https://nepalpassport.gov.np/*`
  - `https://epassport.immigration.gov.np/*`

---

## 4) Extension Architecture

```text
[Popup UI] <-> [Background Service Worker] <-> [Saarthi Backend API]
                        |
                        v
                [Content Script on Portal Page]
```

## 4.1 Components

- `popup.html` + `popup.js`
  - Login/logout
  - Portal status display
  - Fill trigger button
- `background.js` (service worker)
  - JWT storage coordination
  - API requests to backend
  - message relay to content script
- `content.js`
  - detect portal
  - execute field filling with selectors
  - report fill results
- `portal-maps/*.ts`
  - selector mapping tables per portal

---

## 5) Manifest V3 Plan

## 5.1 Permissions

- `storage`
- `activeTab`
- `scripting`

## 5.2 Host Permissions

- `https://camis.ocr.gov.np/*`
- `https://taxpayerportal.ird.gov.np/*`
- `https://ird.gov.np/*`
- `https://nepalpassport.gov.np/*`
- `https://epassport.immigration.gov.np/*`
- backend base URL (dev/prod), e.g.:
  - `http://localhost:3001/*`
  - `https://api.saarthi.ai/*`

## 5.3 Manifest Skeleton

```json
{
  "manifest_version": 3,
  "name": "Saarthi Autofill",
  "version": "0.1.0",
  "action": {
    "default_popup": "popup.html"
  },
  "background": {
    "service_worker": "background.js"
  },
  "permissions": ["storage", "activeTab", "scripting"],
  "host_permissions": [
    "https://camis.ocr.gov.np/*",
    "https://taxpayerportal.ird.gov.np/*",
    "https://ird.gov.np/*",
    "https://nepalpassport.gov.np/*",
    "https://epassport.immigration.gov.np/*",
    "http://localhost:3001/*"
  ],
  "content_scripts": [
    {
      "matches": [
        "https://camis.ocr.gov.np/*",
        "https://taxpayerportal.ird.gov.np/*",
        "https://ird.gov.np/*",
        "https://nepalpassport.gov.np/*",
        "https://epassport.immigration.gov.np/*"
      ],
      "js": ["content.js"],
      "run_at": "document_idle"
    }
  ]
}
```

---

## 6) Authentication Model

Backend auth is JWT-based and already available.

## 6.1 Login Flow

- Popup submits credentials to `POST /api/auth/login`.
- On success, store token in `chrome.storage.local`.
- Background includes `Authorization: Bearer <token>` for extension API calls.

## 6.2 Token Handling

- Keep JWT in extension storage only.
- Never inject token into page context.
- On `401`, clear token and prompt login.

---

## 7) Backend API Contract for Extension

Extension-specific endpoints (to be implemented backend-side):

## 7.1 `GET /api/extension/portals`

Returns supported portal definitions.

Example response:

```json
{
  "success": true,
  "data": {
    "portals": [
      {
        "key": "camis_company",
        "name": "OCR CAMIS",
        "urlPatterns": ["https://camis.ocr.gov.np/*"],
        "processType": "COMPANY_REGISTRATION"
      }
    ]
  }
}
```

## 7.2 `GET /api/extension/status/:portalKey`

Returns readiness summary for popup.

```json
{
  "success": true,
  "data": {
    "portalKey": "ird_pan",
    "processType": "PAN_REGISTRATION",
    "ready": true,
    "readinessScore": 86,
    "missingFields": ["business_type"],
    "updatedAt": "2026-03-15T12:00:00.000Z"
  }
}
```

## 7.3 `GET /api/extension/autofill/:portalKey`

Returns selector-value mappings.

```json
{
  "success": true,
  "data": {
    "portalKey": "ird_pan",
    "fields": [
      {
        "selector": "input[name='panNumber']",
        "value": "123456789",
        "confidence": 0.98
      },
      {
        "selector": "input[name='registeredName']",
        "value": "Tech Nepal Pvt. Ltd.",
        "confidence": 0.93
      }
    ],
    "missingFields": ["input[name='businessType']"],
    "warnings": ["Some fields are low confidence"],
    "generatedAt": "2026-03-15T12:01:00.000Z"
  }
}
```

---

## 8) Field-Filling Engine

## 8.1 Approach

- Use hardcoded selector maps per portal.
- For each mapping:
  1. `document.querySelector(selector)`
  2. set value
  3. dispatch `input` and `change` events

## 8.2 Fill Strategy

- Fill text inputs, textareas, selects, radio/checkboxes (if mapping provides suitable value).
- Skip hidden/disabled fields.
- Track per-field result:
  - `filled`
  - `not_found`
  - `rejected`

## 8.3 Fill Result Contract (content -> popup)

```ts
type FillResult = {
  portalKey: string;
  attempted: number;
  filled: number;
  notFound: string[];
  rejected: string[];
};
```

---

## 9) Portal Detection

## 9.1 Rules

- Detect by URL hostname + pathname regex.
- If unknown page, show: "Portal not supported yet".

## 9.2 Example

```ts
const portalMatchers = [
  { key: 'camis_company', host: /camis\.ocr\.gov\.np$/ },
  { key: 'ird_pan', host: /taxpayerportal\.ird\.gov\.np$/ },
  { key: 'nepal_passport', host: /(nepalpassport\.gov\.np|epassport\.immigration\.gov\.np)$/ }
];
```

---

## 10) UI States (Popup)

- `logged_out`
  - email/password form
- `logged_in_no_portal`
  - "Open a supported government form page"
- `logged_in_portal_detected`
  - portal name + readiness score + Fill button
- `filling`
  - spinner and progress text
- `fill_complete`
  - result summary, missing fields, retry option

---

## 11) Security Guidelines

- Never store user password; only send on login.
- Store JWT in `chrome.storage.local`.
- Do not write OCR payloads into logs or console by default.
- Do not expose JWT to content scripts or page scripts.
- Require explicit user click before any fill operation.
- No automatic form submit.

---

## 12) Extension Folder Structure (Suggested)

```text
extension/
├── manifest.json
├── popup.html
├── popup.js
├── popup.css
├── background.js
├── content.js
├── api/
│   └── client.js
├── portals/
│   ├── camis.js
│   ├── ird.js
│   └── passport.js
├── shared/
│   ├── portal-detector.js
│   ├── fill-engine.js
│   └── types.js
└── assets/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

---

## 13) Implementation Phases (Extension)

## Phase A - Scaffolding

- Create manifest, popup, background, content script.
- Add portal detection and message passing.

## Phase B - Auth

- Add login/logout from popup.
- Persist JWT and auth state.

## Phase C - Autofill Integration

- Implement backend contract calls (`portals`, `status`, `autofill`).
- Render status in popup.

## Phase D - Fill Engine

- Implement selector fill logic + event dispatch.
- Add result reporting and user feedback.

## Phase E - Portal Maps

- Add hardcoded selector maps for CAMIS, IRD, passport portals.
- Validate mappings against real forms.

## Phase F - Hardening

- Error handling for token expiry/network failures.
- Add basic telemetry logs (non-sensitive).
- Improve UX copy for partial fill outcomes.

---

## 14) Testing Checklist

- Login/logout works in popup.
- Unsupported page shows correct message.
- Supported portal auto-detect works.
- Fill applies values and dispatches events.
- Missing selectors are reported clearly.
- Expired token path prompts re-login.
- No auto-submit behavior.

---

## 15) MVP Acceptance Criteria

- User logs into extension using backend auth.
- Extension detects at least one supported portal.
- Extension fetches autofill payload and fills fields via hardcoded selectors.
- User sees fill summary (filled vs missing).
- All sensitive handling follows security guidelines.

---

## 16) Future Enhancements (Post-MVP)

- Firefox-compatible build.
- Configurable selector updates from backend.
- Optional field confidence color overlays on form.
- Assisted step-by-step mode for multi-page forms.
