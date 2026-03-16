function detectCurrentPortal() {
  try {
    const parsed = new URL(window.location.href);
    const host = parsed.hostname;

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

  if (element.hasAttribute('disabled')) {
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
  if (element instanceof HTMLInputElement && element.type === 'radio') {
    const candidate = String(value ?? '').trim();
    const normalizedCandidate = candidate.toLowerCase();

    const matchByValue =
      element.value.toLowerCase() === normalizedCandidate ||
      element.id.toLowerCase() === normalizedCandidate;

    let matched = matchByValue;
    if (!matched && element.id) {
      const relatedLabel = document.querySelector(`label[for="${CSS.escape(element.id)}"]`);
      const labelText = (relatedLabel?.textContent || '').trim().toLowerCase();
      matched = labelText === normalizedCandidate || labelText.includes(normalizedCandidate);
    }

    if (!matched) {
      return false;
    }

    element.checked = true;
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  }

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
  const text = String(optionText || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
  if (!text) {
    return false;
  }

  const options = Array.from(document.querySelectorAll('.cdk-overlay-pane mat-option, .cdk-overlay-pane .mat-option'));
  for (const option of options) {
    const candidate = (option.textContent || '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ');
    if (candidate === text || candidate.includes(text) || text.includes(candidate)) {
      option.click();
      return true;
    }
  }

  return false;
}

async function waitForMatOptions(timeoutMs = 1500) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const options = document.querySelectorAll('.cdk-overlay-pane mat-option, .cdk-overlay-pane .mat-option');
    if (options.length > 0) {
      return true;
    }
    await nextTick();
  }

  return false;
}

function normalizeDateFormats(value) {
  if (typeof value !== 'string') {
    return [String(value ?? '')];
  }

  const trimmed = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return [trimmed];
  }

  const [yyyy, mm, dd] = trimmed.split('-');
  return [trimmed, `${dd}/${mm}/${yyyy}`, `${dd}-${mm}-${yyyy}`];
}

function getCandidateValues(field) {
  const baseValue = field?.value;
  const key = String(field?.key || '').toLowerCase();

  if (key.includes('date') || key.includes('dob')) {
    return normalizeDateFormats(baseValue);
  }

  if (field?.fieldType === 'radio' && Array.isArray(field?.options) && field.options.length > 0) {
    const raw = typeof baseValue === 'string' ? baseValue : String(baseValue ?? '');
    const normalizedRaw = raw.trim().toLowerCase();

    const option = field.options.find((item) => {
      const value = String(item?.value ?? '').trim().toLowerCase();
      const label = String(item?.label ?? '').trim().toLowerCase();
      return value === normalizedRaw || label === normalizedRaw;
    });

    if (option) {
      return [option.value, option.label];
    }

    return [raw];
  }

  return [typeof baseValue === 'string' ? baseValue : String(baseValue ?? '')];
}

function resolveMatSelectElement(element, selector) {
  if (element.matches('mat-select, .mat-select')) {
    return element;
  }

  if (typeof selector === 'string' && selector.includes('formcontrolname=')) {
    const match = selector.match(/formcontrolname=['\"]([^'\"]+)['\"]/i);
    const controlName = match?.[1];
    if (controlName) {
      const matByControl = document.querySelector(`mat-select[formcontrolname="${CSS.escape(controlName)}"]`);
      if (matByControl) {
        return matByControl;
      }
    }
  }

  const container = element.closest('mat-form-field, .mat-form-field');
  if (container) {
    const nestedSelect = container.querySelector('mat-select, .mat-select');
    if (nestedSelect) {
      return nestedSelect;
    }
  }

  return null;
}

async function setFieldBySelector(selector, value) {
  const element = document.querySelector(selector);
  if (!element) {
    return { status: 'not_found' };
  }

  const matSelectElement = resolveMatSelectElement(element, selector);
  if (matSelectElement) {
    matSelectElement.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    matSelectElement.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    if (typeof matSelectElement.click === 'function') {
      matSelectElement.click();
    }

    const hasOptions = await waitForMatOptions(1800);
    if (!hasOptions) {
      return { status: 'rejected' };
    }

    const selected = selectMatOptionByText(value);
    if (!selected) {
      return { status: 'rejected' };
    }

    await nextTick();
    return { status: 'filled' };
  }

  if (!isEditableField(element)) {
    if (element instanceof HTMLInputElement && element.type === 'radio') {
      const radioResult = setElementValue(element, value);
      return { status: radioResult ? 'filled' : 'rejected' };
    }

    return { status: 'rejected' };
  }

  const success = setElementValue(element, typeof value === 'string' ? value : String(value ?? ''));
  if (!success) {
    return { status: 'rejected' };
  }

  return { status: 'filled' };
}

async function setFieldBySelectors(selectors, value) {
  if (!Array.isArray(selectors) || selectors.length === 0) {
    return { status: 'not_found' };
  }

  let sawRejected = false;

  for (const selector of selectors) {
    if (typeof selector !== 'string' || selector.trim().length === 0) {
      continue;
    }

    const result = await setFieldBySelector(selector, value);
    if (result.status === 'filled') {
      return result;
    }

    if (result.status === 'rejected') {
      sawRejected = true;
    }
  }

  if (sawRejected) {
    return { status: 'rejected' };
  }

  return { status: 'not_found' };
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
    const selectors = Array.isArray(field?.selectors) ? field.selectors : null;
    const candidateValues = getCandidateValues(field);

    if ((!selectors || selectors.length === 0) && (typeof selector !== 'string' || selector.length === 0)) {
      continue;
    }

    const candidateSelectors = selectors && selectors.length > 0 ? selectors : [selector];
    let result = { status: 'not_found' };
    for (const candidateValue of candidateValues) {
      result = await setFieldBySelectors(candidateSelectors, candidateValue);
      if (result.status === 'filled') {
        break;
      }
    }
    const primarySelector = candidateSelectors[0] || selector;

    if (result.status === 'not_found') {
      notFound.push(primarySelector);
      continue;
    }

    if (result.status === 'rejected') {
      rejected.push(primarySelector);
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

chrome.runtime.sendMessage({
  type: 'SAARTHI_CONTENT_READY',
  payload: {
    url: window.location.href,
    portal: detectCurrentPortal(),
  },
}).catch(() => undefined);
