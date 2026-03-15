function detectCurrentPortal() {
  try {
    const parsed = new URL(window.location.href);
    const host = parsed.hostname;

    if (/(^|\.)camis\.ocr\.gov\.np$/i.test(host)) {
      return { key: 'camis_company', name: 'OCR CAMIS' };
    }

    if (/(^|\.)(taxpayerportal\.ird\.gov\.np|ird\.gov\.np)$/i.test(host)) {
      return { key: 'ird_pan', name: 'IRD Taxpayer Portal' };
    }

    if (/(^|\.)(nepalpassport\.gov\.np|epassport\.immigration\.gov\.np)$/i.test(host)) {
      return { key: 'nepal_passport', name: 'Nepal Passport Portal' };
    }

    return null;
  } catch (_error) {
    return null;
  }
}

function isEditableField(element) {
  if (!(element instanceof HTMLElement)) {
    return false;
  }

  if (element.hasAttribute('disabled') || element.hasAttribute('readonly')) {
    return false;
  }

  if (element instanceof HTMLInputElement) {
    const type = (element.type || '').toLowerCase();
    return !['hidden', 'file'].includes(type);
  }

  return element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement;
}

function setElementValue(element, value) {
  if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
    element.value = value;
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  }

  if (element instanceof HTMLSelectElement) {
    element.value = value;
    element.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  }

  return false;
}

function runFill(payload) {
  const attempted = Array.isArray(payload?.fields) ? payload.fields.length : 0;
  const notFound = [];
  const rejected = [];
  let filled = 0;

  for (const field of payload.fields || []) {
    const selector = field?.selector;
    const value = field?.value;

    if (typeof selector !== 'string' || selector.length === 0) {
      continue;
    }

    const element = document.querySelector(selector);
    if (!element) {
      notFound.push(selector);
      continue;
    }

    if (!isEditableField(element)) {
      rejected.push(selector);
      continue;
    }

    const success = setElementValue(element, typeof value === 'string' ? value : String(value ?? ''));
    if (success) {
      filled += 1;
    } else {
      rejected.push(selector);
    }
  }

  return {
    portalKey: payload?.portalKey || detectCurrentPortal()?.key || null,
    attempted,
    filled,
    notFound,
    rejected,
  };
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === 'SAARTHI_FILL_FIELDS') {
    try {
      const result = runFill(message.payload || {});
      sendResponse({ ok: true, ...result });
    } catch (error) {
      sendResponse({
        ok: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to fill fields',
        },
      });
    }
    return true;
  }

  if (message?.type === 'SAARTHI_GET_DETECTED_PORTAL') {
    sendResponse({ ok: true, portal: detectCurrentPortal() });
    return true;
  }

  return false;
});
