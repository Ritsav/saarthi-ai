const authSection = document.getElementById('authSection');
const portalSection = document.getElementById('portalSection');
const resultSection = document.getElementById('resultSection');
const statusText = document.getElementById('statusText');
const apiBaseUrlInput = document.getElementById('apiBaseUrl');
const saveApiBaseUrlButton = document.getElementById('saveApiBaseUrl');

function setStatus(text) {
  statusText.textContent = text;
}

function showElement(element, show) {
  if (!element) {
    return;
  }

  element.classList.toggle('hidden', !show);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

async function sendToBackground(type, payload) {
  const response = await chrome.runtime.sendMessage({ type, payload });
  if (!response?.ok) {
    throw new Error(response?.error?.message || 'Extension action failed');
  }
  return response.data;
}

function renderLoginForm() {
  authSection.innerHTML = `
    <div class="stack">
      <strong>Sign In</strong>
      <input id="loginEmail" type="email" placeholder="Email" autocomplete="username" />
      <input id="loginPassword" type="password" placeholder="Password" autocomplete="current-password" />
      <button id="loginButton" type="button">Login</button>
      <p class="hint">Use your Saarthi backend account credentials.</p>
      <p class="warning hidden" id="loginError"></p>
    </div>
  `;

  const loginButton = document.getElementById('loginButton');
  const loginError = document.getElementById('loginError');

  loginButton.addEventListener('click', async () => {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    loginError.classList.add('hidden');
    loginError.textContent = '';
    loginButton.disabled = true;
    setStatus('Logging in...');

    try {
      await sendToBackground('SAARTHI_LOGIN', { email, password });
      await refreshUi();
      setStatus('Logged in successfully');
    } catch (error) {
      loginError.textContent = error.message || 'Login failed';
      loginError.classList.remove('hidden');
      setStatus('Login failed');
    } finally {
      loginButton.disabled = false;
    }
  });
}

function renderLoggedIn(user) {
  const userLabel = user?.email ? escapeHtml(user.email) : 'Authenticated user';

  authSection.innerHTML = `
    <div class="stack">
      <div class="row">
        <strong>Signed In</strong>
        <span class="pill">Connected</span>
      </div>
      <div class="hint">${userLabel}</div>
      <button id="logoutButton" type="button" class="secondary">Logout</button>
    </div>
  `;

  document.getElementById('logoutButton').addEventListener('click', async () => {
    setStatus('Logging out...');
    await sendToBackground('SAARTHI_LOGOUT');
    showElement(portalSection, false);
    showElement(resultSection, false);
    await refreshUi();
    setStatus('Logged out');
  });
}

function renderPortalDetails(detectorResult, statusData, autofillData) {
  const portal = detectorResult?.portal;

  if (!portal) {
    portalSection.innerHTML = `
      <div class="stack">
        <strong>No Supported Portal Detected</strong>
        <p class="hint">Open CAMIS, IRD, or Passport portal form page in the current tab.</p>
      </div>
    `;
    return;
  }

  const missingFields = statusData?.missingFields || [];
  const warnings = statusData?.warnings || [];
  const readinessScore = Number.isFinite(statusData?.readinessScore) ? statusData.readinessScore : 0;

  portalSection.innerHTML = `
    <div class="stack">
      <div class="row">
        <strong>${escapeHtml(portal.name)}</strong>
        <span class="pill">${readinessScore}% Ready</span>
      </div>
      <p class="hint">Detected portal key: ${escapeHtml(portal.key)}</p>
      ${missingFields.length > 0 ? `<p class="warning">Missing fields: ${missingFields.length}</p>` : '<p class="hint">All required mapped fields are available.</p>'}
      ${warnings.length > 0 ? `<p class="warning">Warnings: ${escapeHtml(warnings.join('; '))}</p>` : ''}
      <button id="fillButton" type="button" ${autofillData?.fields?.length ? '' : 'disabled'}>Fill Current Form</button>
      <button id="refreshPortalButton" type="button" class="ghost">Refresh Status</button>
    </div>
  `;

  const fillButton = document.getElementById('fillButton');
  const refreshPortalButton = document.getElementById('refreshPortalButton');

  fillButton.addEventListener('click', async () => {
    if (!detectorResult?.tabId || !autofillData) {
      return;
    }

    fillButton.disabled = true;
    setStatus('Filling fields...');

    try {
      const fillResult = await sendToBackground('SAARTHI_RUN_FILL', {
        tabId: detectorResult.tabId,
        autofill: autofillData,
      });

      renderFillResult(fillResult);
      setStatus(`Filled ${fillResult.filled}/${fillResult.attempted} fields`);
    } catch (error) {
      renderFillError(error.message || 'Fill failed');
      setStatus('Fill failed');
    } finally {
      fillButton.disabled = false;
    }
  });

  refreshPortalButton.addEventListener('click', async () => {
    setStatus('Refreshing portal status...');
    await refreshPortalState();
  });
}

function renderFillResult(fillResult) {
  const notFoundItems = (fillResult?.notFound || []).map((item) => `<li>${escapeHtml(item)}</li>`).join('');
  const rejectedItems = (fillResult?.rejected || []).map((item) => `<li>${escapeHtml(item)}</li>`).join('');

  resultSection.innerHTML = `
    <div class="stack">
      <strong>Fill Result</strong>
      <p class="hint">Attempted: ${fillResult?.attempted || 0}, Filled: ${fillResult?.filled || 0}</p>
      ${notFoundItems ? `<div><p class="warning">Selectors not found</p><ul>${notFoundItems}</ul></div>` : ''}
      ${rejectedItems ? `<div><p class="warning">Selectors rejected</p><ul>${rejectedItems}</ul></div>` : ''}
    </div>
  `;
  showElement(resultSection, true);
}

function renderFormSelectorPlan(plan) {
  if (!Array.isArray(plan) || plan.length === 0) {
    return;
  }

  const rows = plan
    .map((item) => {
      const mode = escapeHtml(item.mode || 'manual');
      const step = escapeHtml(item.step || 'Step');
      const firstSelectors = Array.isArray(item.selectors) ? item.selectors.slice(0, 3).map((s) => `<code>${escapeHtml(s)}</code>`).join(', ') : '';
      const notes = item.notes ? `<div class="hint">${escapeHtml(item.notes)}</div>` : '';
      return `<li><strong>${step}</strong> <span class="pill">${mode}</span><div class="hint">${firstSelectors}</div>${notes}</li>`;
    })
    .join('');

  const existing = resultSection.innerHTML || '';
  resultSection.innerHTML = `
    ${existing}
    <div class="stack" style="margin-top:8px;">
      <strong>Form Selector Plan</strong>
      <ul>${rows}</ul>
    </div>
  `;
  showElement(resultSection, true);
}

function renderFillError(message) {
  resultSection.innerHTML = `
    <div class="stack">
      <strong>Fill Error</strong>
      <p class="warning">${escapeHtml(message)}</p>
    </div>
  `;
  showElement(resultSection, true);
}

async function refreshPortalState() {
  showElement(portalSection, true);
  showElement(resultSection, false);

  let detectorResult;
  try {
    detectorResult = await sendToBackground('SAARTHI_DETECT_PORTAL');
  } catch (error) {
    portalSection.innerHTML = `<p class="warning">${escapeHtml(error.message || 'Unable to detect portal')}</p>`;
    return;
  }

  if (!detectorResult?.portal?.key) {
    renderPortalDetails(detectorResult, null, null);
    setStatus('Open a supported portal page');
    return;
  }

  try {
    const [statusData, autofillData] = await Promise.all([
      sendToBackground('SAARTHI_GET_PORTAL_STATUS', { portalKey: detectorResult.portal.key }),
      sendToBackground('SAARTHI_GET_AUTOFILL', { portalKey: detectorResult.portal.key }),
    ]);

    renderPortalDetails(detectorResult, statusData, autofillData);
    if (Array.isArray(statusData?.manualSteps) && statusData.manualSteps.length > 0) {
      renderManualSteps(statusData.manualSteps);
    }
    if (Array.isArray(statusData?.formSelectorPlan) && statusData.formSelectorPlan.length > 0) {
      renderFormSelectorPlan(statusData.formSelectorPlan);
    }
    setStatus('Portal ready');
  } catch (error) {
    renderPortalDetails(detectorResult, null, null);
    renderFillError(error.message || 'Could not load portal data');
    setStatus('Portal data unavailable');
  }
}

function renderManualSteps(steps) {
  if (!Array.isArray(steps) || steps.length === 0) {
    return;
  }

  const items = steps.map((step) => `<li>${escapeHtml(step)}</li>`).join('');
  resultSection.innerHTML = `
    <div class="stack">
      <strong>Manual Steps Required</strong>
      <ul>${items}</ul>
    </div>
  `;
  showElement(resultSection, true);
}

async function refreshUi() {
  const authState = await sendToBackground('SAARTHI_GET_AUTH_STATE');

  apiBaseUrlInput.value = authState.apiBaseUrl || '';

  if (!authState.loggedIn) {
    renderLoginForm();
    showElement(portalSection, false);
    showElement(resultSection, false);
    setStatus('Please log in');
    return;
  }

  renderLoggedIn(authState.user);
  await refreshPortalState();
}

saveApiBaseUrlButton.addEventListener('click', async () => {
  const value = apiBaseUrlInput.value.trim();
  if (!value) {
    setStatus('Enter API URL first');
    return;
  }

  saveApiBaseUrlButton.disabled = true;
  try {
    await sendToBackground('SAARTHI_SET_API_BASE_URL', { apiBaseUrl: value });
    setStatus('API URL saved');
    await refreshUi();
  } catch (error) {
    setStatus(error.message || 'Failed to save API URL');
  } finally {
    saveApiBaseUrlButton.disabled = false;
  }
});

void refreshUi();
