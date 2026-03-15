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

function findElementForFileField(field) {
  if (!field || typeof field !== 'object') {
    return null;
  }

  if (typeof field.selector === 'string' && field.selector.length > 0) {
    const direct = document.querySelector(field.selector);
    if (direct instanceof HTMLInputElement && direct.type === 'file') {
      return direct;
    }
  }

  if (typeof field.key === 'string' && field.key.length > 0) {
    const escaped = CSS.escape(field.key);
    const byName = document.querySelector(`input[type="file"][name="${escaped}"]`);
    if (byName instanceof HTMLInputElement) {
      return byName;
    }

    const byId = document.querySelector(`input[type="file"]#${escaped}`);
    if (byId instanceof HTMLInputElement) {
      return byId;
    }
  }

  return null;
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

function nextTick() {
  return new Promise((resolve) => setTimeout(resolve, 30));
}

function selectMatOptionByText(optionText) {
  const text = String(optionText || '').trim().toLowerCase();
  if (!text) {
    return false;
  }

  const options = Array.from(document.querySelectorAll('.cdk-overlay-pane mat-option, .cdk-overlay-pane .mat-option'));
  for (const option of options) {
    const candidate = (option.textContent || '').trim().toLowerCase();
    if (candidate === text || candidate.includes(text)) {
      option.click();
      return true;
    }
  }

  return false;
}

async function setFieldBySelector(selector, value) {
  const element = document.querySelector(selector);
  if (!element) {
    return { status: 'not_found' };
  }

  if (element.matches('mat-select, .mat-select')) {
    element.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await nextTick();

    const selected = selectMatOptionByText(value);
    if (!selected) {
      return { status: 'rejected' };
    }

    await nextTick();
    return { status: 'filled' };
  }

  if (!isEditableField(element)) {
    return { status: 'rejected' };
  }

  const success = setElementValue(element, typeof value === 'string' ? value : String(value ?? ''));
  if (!success) {
    return { status: 'rejected' };
  }

  return { status: 'filled' };
}

async function tryAssignFileInput(fileField, uploadedFile) {
  if (!(uploadedFile && uploadedFile.name)) {
    return { status: 'rejected' };
  }

  const element = findElementForFileField(fileField);
  if (!element) {
    return { status: 'not_found' };
  }

  try {
    const response = await fetch(uploadedFile.url);
    if (!response.ok) {
      return { status: 'rejected' };
    }

    const blob = await response.blob();
    const file = new File([blob], uploadedFile.name, { type: uploadedFile.type || blob.type || 'application/octet-stream' });
    const dt = new DataTransfer();
    dt.items.add(file);
    element.files = dt.files;
    element.dispatchEvent(new Event('change', { bubbles: true }));
    return { status: 'filled' };
  } catch (_error) {
    return { status: 'rejected' };
  }
}

async function runFill(payload) {
  const attempted = Array.isArray(payload?.fields) ? payload.fields.length : 0;
  const notFound = [];
  const rejected = [];
  let filled = 0;

  const uploadedFiles = Array.isArray(payload?.uploadedFiles) ? payload.uploadedFiles : [];

  for (const uploadedFile of uploadedFiles) {
    const targetField = (payload?.fileFields || []).find((field) => field.key === uploadedFile.key);
    if (!targetField) {
      continue;
    }

    const fileResult = await tryAssignFileInput(targetField, uploadedFile);
    if (fileResult.status === 'filled') {
      filled += 1;
    } else if (fileResult.status === 'not_found') {
      notFound.push(targetField.selector || targetField.key || 'file_input');
    } else {
      rejected.push(targetField.selector || targetField.key || 'file_input');
    }
  }

  for (const field of payload.fields || []) {
    const selector = field?.selector;
    const value = field?.value;

    if (typeof selector !== 'string' || selector.length === 0) {
      continue;
    }

    const result = await setFieldBySelector(selector, value);

    if (result.status === 'not_found') {
      notFound.push(selector);
      continue;
    }

    if (result.status === 'rejected') {
      rejected.push(selector);
      continue;
    }

    filled += 1;
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
    runFill(message.payload || {})
      .then((result) => {
        sendResponse({ ok: true, ...result });
      })
      .catch((error) => {
        sendResponse({
          ok: false,
          error: {
            message: error instanceof Error ? error.message : 'Failed to fill fields',
          },
        });
      });
    return true;
  }

  if (message?.type === 'SAARTHI_GET_DETECTED_PORTAL') {
    sendResponse({ ok: true, portal: detectCurrentPortal() });
    return true;
  }

  return false;
});
