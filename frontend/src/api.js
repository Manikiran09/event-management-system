import axios from "axios";

const defaultProductionApiBaseUrl = "https://event-management-system-production-c946.up.railway.app/api";
const apiBaseUrl =
  import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? defaultProductionApiBaseUrl : "/api");

const api = axios.create({
  baseURL: apiBaseUrl,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
