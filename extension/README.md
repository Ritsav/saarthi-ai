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
