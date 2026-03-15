# Saarthi Chrome Extension (MVP)

This folder contains the Manifest V3 extension for portal auto-detect and form autofill.

## Load in Chrome

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select this `extension/` directory

## Configure API URL

- Open the extension popup
- Set backend API URL (default: `http://localhost:3001`)
- Save

## Login and Fill

1. Log in with backend credentials
2. Open a supported portal tab:
   - `https://camis.ocr.gov.np/*`
   - `https://taxpayerportal.ird.gov.np/*`
   - `https://ird.gov.np/*`
   - `https://nepalpassport.gov.np/*`
   - `https://epassport.immigration.gov.np/*`
3. In popup, click **Fill Current Form**

## Notes

- Fill is user-triggered only (no auto-submit)
- Missing selectors are reported in popup
- Requires backend extension APIs under `/api/extension/*`

## Passport Snapshot Findings

From the provided `sample-html` snapshot:

- Form 1 is passport type radio selection (`#PP`, `#PB`, `#PS`, `#PD`, `#PG`, `#PT`, `#PN`)
- Form 2 is appointment booking (Angular Material `mat-select` controls)
- Form 3 contains applicant details and citizenship-related fields via `formcontrolname`
- Form 4 marker exists, but that snapshot content is missing in the file

Because this site is Angular + Material:

- Prefer selectors like `[formcontrolname="firstName"]`
- For `mat-select`, autofill requires click + overlay option selection (implemented in `content.js`)
- Captcha/submit remain manual
