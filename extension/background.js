importScripts('shared/portals.js');

const STORAGE_KEYS = {
  apiBaseUrl: 'saarthi_api_base_url',
  token: 'saarthi_auth_token',
  user: 'saarthi_auth_user',
};

const DEFAULT_API_BASE_URL = 'http://localhost:3001';

async function getStorageValues(keys) {
  return chrome.storage.local.get(keys);
}

async function setStorageValues(values) {
  await chrome.storage.local.set(values);
}

async function clearAuthStorage() {
  await chrome.storage.local.remove([STORAGE_KEYS.token, STORAGE_KEYS.user]);
}

async function getApiBaseUrl() {
  const values = await getStorageValues([STORAGE_KEYS.apiBaseUrl]);
  const rawValue = values[STORAGE_KEYS.apiBaseUrl];

  if (typeof rawValue === 'string' && rawValue.trim().length > 0) {
    return rawValue.replace(/\/$/, '');
  }

  return DEFAULT_API_BASE_URL;
}

async function getToken() {
  const values = await getStorageValues([STORAGE_KEYS.token]);
  return typeof values[STORAGE_KEYS.token] === 'string' ? values[STORAGE_KEYS.token] : null;
}

function jsonHeaders(token) {
  const headers = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

async function requestJson(path, options = {}) {
  const apiBaseUrl = await getApiBaseUrl();
  const token = await getToken();
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers: {
      ...jsonHeaders(token),
      ...(options.headers || {}),
    },
  });

  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const payload = isJson ? await response.json() : null;

  if (response.status === 401) {
    await clearAuthStorage();
  }

  if (!response.ok) {
    const message = payload?.message || `Request failed: ${response.status}`;
    const code = payload?.code || 'REQUEST_FAILED';
    const error = new Error(message);
    error.code = code;
    error.status = response.status;
    throw error;
  }

  return payload;
}

async function detectPortalInActiveTab() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const tab = tabs[0];
  if (!tab || !tab.url) {
    return { portal: null };
  }

  const portal = SaarthiPortals.detectPortalFromUrl(tab.url);
  return {
    tabId: tab.id,
    url: tab.url,
    portal,
  };
}

async function login(payload) {
  const apiBaseUrl = await getApiBaseUrl();
  const response = await fetch(`${apiBaseUrl}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const result = await response.json();
  if (!response.ok || !result?.success) {
    const message = result?.message || 'Login failed';
    const error = new Error(message);
    error.code = result?.code || 'LOGIN_FAILED';
    error.status = response.status;
    throw error;
  }

  const token = result.data?.token;
  const user = result.data?.user;
  if (!token) {
    throw new Error('Login response missing token');
  }

  await setStorageValues({
    [STORAGE_KEYS.token]: token,
    [STORAGE_KEYS.user]: user || null,
  });

  return {
    token,
    user,
  };
}

async function getAuthState() {
  const values = await getStorageValues([STORAGE_KEYS.token, STORAGE_KEYS.user, STORAGE_KEYS.apiBaseUrl]);
  return {
    loggedIn: typeof values[STORAGE_KEYS.token] === 'string' && values[STORAGE_KEYS.token].length > 0,
    user: values[STORAGE_KEYS.user] || null,
    apiBaseUrl: values[STORAGE_KEYS.apiBaseUrl] || DEFAULT_API_BASE_URL,
  };
}

async function logout() {
  await clearAuthStorage();
  return { loggedOut: true };
}

async function updateApiBaseUrl(apiBaseUrl) {
  if (typeof apiBaseUrl !== 'string' || apiBaseUrl.trim().length === 0) {
    throw new Error('API base URL is required');
  }

  const normalized = apiBaseUrl.trim().replace(/\/$/, '');
  await setStorageValues({ [STORAGE_KEYS.apiBaseUrl]: normalized });
  return { apiBaseUrl: normalized };
}

async function getPortalStatus(portalKey) {
  const payload = await requestJson(`/api/extension/status/${portalKey}`);
  return payload.data;
}

async function getPortalAutofill(portalKey) {
  const payload = await requestJson(`/api/extension/autofill/${portalKey}`);
  return payload.data;
}

async function getPortals() {
  const payload = await requestJson('/api/extension/portals');
  return payload.data;
}

async function runFill(tabId, autofillPayload) {
  if (!tabId) {
    throw new Error('No active tab available for fill');
  }

  const response = await chrome.tabs.sendMessage(tabId, {
    type: 'SAARTHI_FILL_FIELDS',
    payload: autofillPayload,
  });

  return response;
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  const run = async () => {
    switch (message?.type) {
      case 'SAARTHI_GET_AUTH_STATE':
        return getAuthState();
      case 'SAARTHI_LOGIN':
        return login(message.payload || {});
      case 'SAARTHI_LOGOUT':
        return logout();
      case 'SAARTHI_SET_API_BASE_URL':
        return updateApiBaseUrl(message.payload?.apiBaseUrl);
      case 'SAARTHI_DETECT_PORTAL':
        return detectPortalInActiveTab();
      case 'SAARTHI_GET_PORTALS':
        return getPortals();
      case 'SAARTHI_GET_PORTAL_STATUS':
        return getPortalStatus(message.payload?.portalKey);
      case 'SAARTHI_GET_AUTOFILL':
        return getPortalAutofill(message.payload?.portalKey);
      case 'SAARTHI_RUN_FILL':
        return runFill(message.payload?.tabId, message.payload?.autofill);
      default:
        throw new Error(`Unknown message type: ${String(message?.type)}`);
    }
  };

  run()
    .then((data) => {
      sendResponse({ ok: true, data });
    })
    .catch((error) => {
      sendResponse({
        ok: false,
        error: {
          message: error?.message || 'Unexpected extension error',
          code: error?.code || 'EXTENSION_ERROR',
          status: error?.status,
        },
      });
    });

  return true;
});
