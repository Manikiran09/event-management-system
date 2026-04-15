import axios from "axios";

const runtimeApiBaseUrlStorageKey = "runtime_api_base_url";
let sessionApiBaseUrl = "";
let warmupPromise = null;
const productionApiCandidates = [
  import.meta.env.VITE_API_BASE_URL || "",
  "https://event-management-system-production-f464.up.railway.app/api",
];

const normalizeApiBaseUrl = (value) => {
  if (!value || typeof value !== "string") {
    return "";
  }

  const trimmed = value.trim().replace(/\/$/, "");
  if (!trimmed) {
    return "";
  }

  if (trimmed.endsWith("/api")) {
    return trimmed;
  }

  return `${trimmed}/api`;
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

  for (const candidate of productionApiCandidates) {
    const normalizedCandidate = normalizeApiBaseUrl(candidate);
    if (normalizedCandidate) {
      return normalizedCandidate;
    }
  }

  return "/api";
};

const isIpAddress = (value) => /^(\d{1,3}\.){3}\d{1,3}$/.test(value || "");

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
  const candidates = [
    getRuntimeApiBaseUrl(),
    sessionApiBaseUrl,
    ...productionApiCandidates,
    ...getSameHostApiCandidates(),
  ];

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

    return response.status >= 200 && response.status < 500;
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
  (response) => response,
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

export { clearRuntimeApiBaseUrl, getConfiguredApiBaseUrl, setRuntimeApiBaseUrl, warmupApiBaseUrl };
export default api;
