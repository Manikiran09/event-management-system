import axios from "axios";

const runtimeApiBaseUrlStorageKey = "runtime_api_base_url";
const productionApiCandidates = [
  import.meta.env.VITE_API_BASE_URL || "",
  "https://event-management-system-production-c946.up.railway.app/api",
  "https://meticulous-sparkle-production-d09a.up.railway.app/api",
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
  const candidates = productionApiCandidates;

  candidates.push(...getSameHostApiCandidates());

  return [...new Set(candidates.map((value) => normalizeApiBaseUrl(value)).filter(Boolean))];
};

const setRuntimeApiBaseUrl = (value) => {
  if (typeof window === "undefined") {
    return "";
  }

  const normalized = normalizeApiBaseUrl(value);

  if (!normalized) {
    localStorage.removeItem(runtimeApiBaseUrlStorageKey);
    return "";
  }

  localStorage.setItem(runtimeApiBaseUrlStorageKey, normalized);
  return normalized;
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
    const shouldRetryWithFallback =
      !originalRequest.__didRetryWithFallback
      && (isNetworkFailure || [404, 405, 502, 503, 504].includes(status || 0));

    if (!shouldRetryWithFallback) {
      throw error;
    }

    const currentBaseUrl = normalizeApiBaseUrl(originalRequest.baseURL || "");

    const fallbackCandidates = getFallbackCandidates();
    const nextBaseUrl = fallbackCandidates.find((candidate) => candidate && candidate !== currentBaseUrl);

    if (!nextBaseUrl) {
      throw error;
    }

    originalRequest.__didRetryWithFallback = true;
    originalRequest.baseURL = nextBaseUrl;

    if (import.meta.env.PROD) {
      setRuntimeApiBaseUrl(nextBaseUrl);
    }

    return api(originalRequest);
  }
);

export { getConfiguredApiBaseUrl, setRuntimeApiBaseUrl };
export default api;
