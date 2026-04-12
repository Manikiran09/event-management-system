import axios from "axios";

const runtimeApiBaseUrlStorageKey = "runtime_api_base_url";
const defaultProductionApiBaseUrl = "https://meticulous-sparkle-production-d2fc.up.railway.app/api";

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

  const fromEnv = normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL || "");
  if (fromEnv) {
    return fromEnv;
  }

  if (import.meta.env.PROD) {
    return defaultProductionApiBaseUrl;
  }

  return "/api";
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
    const shouldRetryWithFallback =
      !originalRequest.__didRetryWithFallback
      && import.meta.env.PROD
      && [404, 405].includes(status || 0);

    if (!shouldRetryWithFallback) {
      throw error;
    }

    const currentBaseUrl = normalizeApiBaseUrl(originalRequest.baseURL || "");

    if (currentBaseUrl === defaultProductionApiBaseUrl) {
      throw error;
    }

    originalRequest.__didRetryWithFallback = true;
    originalRequest.baseURL = defaultProductionApiBaseUrl;
    setRuntimeApiBaseUrl(defaultProductionApiBaseUrl);

    return api(originalRequest);
  }
);

export { getConfiguredApiBaseUrl, setRuntimeApiBaseUrl };
export default api;
