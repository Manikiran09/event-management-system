import axios from "axios";

const runtimeApiBaseUrlStorageKey = "runtime_api_base_url";
const appNotificationsStorageKey = "app_notifications";
const appNotificationsChangeEventName = "app_notifications_changed";
const maxStoredNotifications = 60;
let sessionApiBaseUrl = "";
let warmupPromise = null;
const defaultProductionApiBaseUrl = "";

const getStoredNotifications = () => {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(appNotificationsStorageKey);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const persistNotifications = (notifications) => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(appNotificationsStorageKey, JSON.stringify(notifications));
  window.dispatchEvent(new CustomEvent(appNotificationsChangeEventName));
};

const deriveModuleName = (requestPath) => {
  if (!requestPath) {
    return "System";
  }

  if (requestPath.includes("/auth")) {
    return "Users";
  }

  if (requestPath.includes("/events")) {
    return "Events";
  }

  if (requestPath.includes("/registrations")) {
    return "Registrations";
  }

  return "System";
};

const buildDefaultNotificationText = (method, requestPath) => {
  const actionMap = {
    post: "created",
    patch: "updated",
    put: "updated",
    delete: "deleted",
  };

  const action = actionMap[(method || "").toLowerCase()] || "completed";
  const moduleName = deriveModuleName(requestPath);
  return `${moduleName} ${action} successfully`;
};

const shouldTrackSuccessNotification = (config) => {
  const method = String(config?.method || "").toLowerCase();
  if (!["post", "patch", "put", "delete"].includes(method)) {
    return false;
  }

  const requestPath = String(config?.url || "").toLowerCase();
  if (!requestPath) {
    return false;
  }

  if (requestPath.includes("/health")) {
    return false;
  }

  return true;
};

const pushAppNotification = ({ message, method, requestPath }) => {
  if (typeof window === "undefined") {
    return;
  }

  const now = Date.now();
  const safeMessage = (String(message || "").trim() || buildDefaultNotificationText(method, requestPath)).slice(0, 180);
  const nextNotification = {
    id: `${now}-${Math.random().toString(36).slice(2, 8)}`,
    message: safeMessage,
    module: deriveModuleName(requestPath),
    method: String(method || "").toUpperCase(),
    requestPath: requestPath || "",
    read: false,
    createdAt: now,
  };

  const existing = getStoredNotifications();
  const next = [nextNotification, ...existing].slice(0, maxStoredNotifications);
  persistNotifications(next);
};

const getAppNotifications = () => getStoredNotifications();

const getUnreadAppNotificationCount = () => getStoredNotifications().filter((item) => !item.read).length;

const markAllAppNotificationsRead = () => {
  const notifications = getStoredNotifications();
  if (notifications.length === 0) {
    return;
  }

  persistNotifications(notifications.map((item) => ({ ...item, read: true })));
};

const clearAppNotifications = () => {
  persistNotifications([]);
};

const isIpAddress = (value) => /^(\d{1,3}\.){3}\d{1,3}$/.test(value || "");

const looksLikeHostWithoutProtocol = (value) => {
  if (!value || typeof value !== "string") {
    return false;
  }

  const hostCandidate = value.split("/")[0].trim().toLowerCase();
  if (!hostCandidate || hostCandidate.includes(" ")) {
    return false;
  }

  if (hostCandidate.startsWith("localhost") || hostCandidate.startsWith("127.0.0.1")) {
    return true;
  }

  const hostOnly = hostCandidate.split(":")[0];
  return hostOnly.includes(".") || isIpAddress(hostOnly);
};

const normalizeApiBaseUrl = (value) => {
  if (!value || typeof value !== "string") {
    return "";
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  if (trimmed === "/api") {
    return "/api";
  }

  let candidate = trimmed;
  if (!/^https?:\/\//i.test(candidate) && !candidate.startsWith("/") && looksLikeHostWithoutProtocol(candidate)) {
    candidate = `https://${candidate}`;
  }

  if (/^https?:\/\//i.test(candidate)) {
    try {
      const parsed = new URL(candidate);
      let pathname = (parsed.pathname || "").replace(/\/+$/, "");
      const lowerPath = pathname.toLowerCase();

      if (lowerPath.endsWith("/api/health")) {
        pathname = pathname.slice(0, -"/health".length);
      } else if (lowerPath.endsWith("/health")) {
        pathname = pathname.slice(0, -"/health".length);
      }

      pathname = pathname.replace(/\/+$/, "");

      if (!pathname || pathname === "/") {
        pathname = "/api";
      } else if (!pathname.toLowerCase().endsWith("/api")) {
        pathname = `${pathname}/api`;
      }

      return `${parsed.origin}${pathname}`;
    } catch {
      return "";
    }
  }

  const normalizedRelative = candidate.replace(/\/$/, "");
  if (normalizedRelative === "/api") {
    return normalizedRelative;
  }

  if (normalizedRelative.endsWith("/api")) {
    return normalizedRelative;
  }

  return `${normalizedRelative}/api`;
};

const isAbsoluteHttpUrl = (value) => /^https?:\/\//i.test(value || "");

const productionApiCandidates = [
  import.meta.env.VITE_API_BASE_URL || "",
  import.meta.env.VITE_FALLBACK_API_BASE_URL || defaultProductionApiBaseUrl,
]
  .map((value) => normalizeApiBaseUrl(value))
  .filter((value) => isAbsoluteHttpUrl(value));

const shouldPreferProxyApi = () => {
  if (import.meta.env.DEV) {
    return true;
  }

  if (typeof window === "undefined") {
    return false;
  }

  const host = (window.location.hostname || "").toLowerCase();
  return host === "localhost" || host === "127.0.0.1" || isIpAddress(host);
};

const getRuntimeApiBaseUrl = () => {
  if (typeof window === "undefined") {
    return "";
  }

  return normalizeApiBaseUrl(localStorage.getItem(runtimeApiBaseUrlStorageKey) || "");
};

const getConfiguredApiBaseUrl = () => {
  if (sessionApiBaseUrl) {
    return sessionApiBaseUrl;
  }

  const fromRuntime = getRuntimeApiBaseUrl();
  if (fromRuntime) {
    return fromRuntime;
  }

  if (shouldPreferProxyApi()) {
    return "/api";
  }

  for (const candidate of productionApiCandidates) {
    const normalizedCandidate = normalizeApiBaseUrl(candidate);
    if (normalizedCandidate) {
      return normalizedCandidate;
    }
  }

  return "/api";
};

const getSameHostApiCandidates = () => {
  if (typeof window === "undefined") {
    return [];
  }

  const { protocol, hostname } = window.location;
  if (!hostname) {
    return [];
  }

  const canUseSameHostPorts = hostname === "localhost" || hostname === "127.0.0.1" || isIpAddress(hostname);
  if (!canUseSameHostPorts) {
    return [];
  }

  const scheme = protocol === "https:" ? "https" : "http";

  return [
    normalizeApiBaseUrl(`${scheme}://${hostname}:10000`),
    normalizeApiBaseUrl(`${scheme}://${hostname}:5112`),
  ].filter(Boolean);
};

const getFallbackCandidates = () => {
  const localFirstCandidates = shouldPreferProxyApi()
    ? ["/api", ...getSameHostApiCandidates(), ...productionApiCandidates]
    : [...productionApiCandidates, ...getSameHostApiCandidates()];

  const candidates = [getRuntimeApiBaseUrl(), sessionApiBaseUrl, ...localFirstCandidates];

  return [...new Set(candidates.map((value) => normalizeApiBaseUrl(value)).filter(Boolean))];
};

const canReachApiBaseUrl = async (baseUrl) => {
  if (!baseUrl) {
    return false;
  }

  try {
    const response = await axios.get(`${baseUrl}/health`, {
      timeout: 20000,
      headers: { "Cache-Control": "no-cache" },
    });

    const contentType = String(response.headers?.["content-type"] || "").toLowerCase();
    const isJson = contentType.includes("application/json");
    const hasHealthShape = typeof response.data === "object" && response.data !== null && "status" in response.data;

    return response.status >= 200 && response.status < 500 && isJson && hasHealthShape;
  } catch {
    return false;
  }
};

const warmupApiBaseUrl = async ({ force = false } = {}) => {
  if (typeof window === "undefined") {
    return getConfiguredApiBaseUrl();
  }

  if (!force && sessionApiBaseUrl) {
    return sessionApiBaseUrl;
  }

  if (warmupPromise) {
    return warmupPromise;
  }

  warmupPromise = (async () => {
    const configured = normalizeApiBaseUrl(getConfiguredApiBaseUrl());
    const candidates = getFallbackCandidates();

    if (configured && !candidates.includes(configured)) {
      candidates.unshift(configured);
    }

    for (const candidate of candidates) {
      // Probe API candidates so login/register can use a reachable backend immediately.
      if (await canReachApiBaseUrl(candidate)) {
        sessionApiBaseUrl = candidate;
        return candidate;
      }
    }

    if (getRuntimeApiBaseUrl()) {
      clearRuntimeApiBaseUrl();
    }

    sessionApiBaseUrl = "";
    return getConfiguredApiBaseUrl();
  })();

  try {
    return await warmupPromise;
  } finally {
    warmupPromise = null;
  }
};

const setRuntimeApiBaseUrl = (value) => {
  if (typeof window === "undefined") {
    return "";
  }

  const normalized = normalizeApiBaseUrl(value);

  if (!normalized) {
    localStorage.removeItem(runtimeApiBaseUrlStorageKey);
    sessionApiBaseUrl = "";
    return "";
  }

  localStorage.setItem(runtimeApiBaseUrlStorageKey, normalized);
  sessionApiBaseUrl = normalized;
  return normalized;
};

const clearRuntimeApiBaseUrl = () => {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(runtimeApiBaseUrlStorageKey);
  sessionApiBaseUrl = "";
};

const apiBaseUrl = getConfiguredApiBaseUrl();

const api = axios.create({
  baseURL: apiBaseUrl,
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  config.baseURL = getConfiguredApiBaseUrl();

  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    const config = response?.config || {};
    if (shouldTrackSuccessNotification(config)) {
      const responseMessage = response?.data?.message || response?.data?.status || "";
      pushAppNotification({
        message: responseMessage,
        method: config.method,
        requestPath: config.url,
      });
    }

    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    if (!originalRequest) {
      throw error;
    }

    const status = error.response?.status;
    const isNetworkFailure = !error.response;
    const shouldRetryWithFallback = isNetworkFailure || [404, 405, 502, 503, 504].includes(status || 0);

    if (!shouldRetryWithFallback) {
      throw error;
    }

    const currentBaseUrl = normalizeApiBaseUrl(originalRequest.baseURL || getConfiguredApiBaseUrl() || "");

    if (!Array.isArray(originalRequest.__fallbackCandidates)) {
      originalRequest.__fallbackCandidates = getFallbackCandidates().filter((candidate) => candidate !== currentBaseUrl);
      originalRequest.__fallbackAttemptIndex = 0;
    }

    const fallbackCandidates = originalRequest.__fallbackCandidates;
    const attemptIndex = Number(originalRequest.__fallbackAttemptIndex || 0);
    const nextBaseUrl = fallbackCandidates[attemptIndex] || "";

    if (!nextBaseUrl) {
      if (getRuntimeApiBaseUrl()) {
        clearRuntimeApiBaseUrl();
      } else {
        sessionApiBaseUrl = "";
      }
      throw error;
    }

    originalRequest.__fallbackAttemptIndex = attemptIndex + 1;
    originalRequest.baseURL = nextBaseUrl;
    sessionApiBaseUrl = nextBaseUrl;

    return api(originalRequest);
  }
);

export {
  clearAppNotifications,
  clearRuntimeApiBaseUrl,
  getAppNotifications,
  getConfiguredApiBaseUrl,
  getUnreadAppNotificationCount,
  markAllAppNotificationsRead,
  setRuntimeApiBaseUrl,
  warmupApiBaseUrl,
  appNotificationsChangeEventName,
};
export default api;
