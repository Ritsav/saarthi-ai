const PORTALS = [
  {
    key: 'camis_company',
    name: 'OCR CAMIS',
    hostRegex: /(^|\.)camis\.ocr\.gov\.np$/i,
  },
  {
    key: 'ird_pan',
    name: 'IRD Taxpayer Portal',
    hostRegex: /(^|\.)(taxpayerportal\.ird\.gov\.np|ird\.gov\.np)$/i,
  },
  {
    key: 'nepal_passport',
    name: 'Nepal Passport Portal',
    hostRegex: /(^|\.)(nepalpassport\.gov\.np|epassport\.immigration\.gov\.np)$/i,
  },
];

function detectPortalFromUrl(url) {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname;

    for (const portal of PORTALS) {
      if (portal.hostRegex.test(host)) {
        return {
          key: portal.key,
          name: portal.name,
        };
      }
    }

    return null;
  } catch (_error) {
    return null;
  }
}

globalThis.SaarthiPortals = {
  PORTALS,
  detectPortalFromUrl,
};
