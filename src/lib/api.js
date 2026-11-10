import axios from "axios";

export const API_BASE = "/api";

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

let refreshing = null;

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const url = original?.url || "";
    const status = error.response?.status;
    if (status === 401 && !url.includes("/admin/login") && !url.includes("/admin/refresh") && !original._retried) {
      original._retried = true;
      try {
        refreshing = refreshing || api.post("/v1/admin/refresh");
        await refreshing;
        refreshing = null;
        return api(original);
      } catch (e) {
        refreshing = null;
      }
    }
    return Promise.reject(error);
  }
);

export function formatApiErrorDetail(detail) {
  if (detail == null) return "Something went wrong. Please try again.";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((e) => (e && typeof e.msg === "string" ? e.msg : JSON.stringify(e)))
      .filter(Boolean)
      .join(" ");
  }
  if (detail && typeof detail.msg === "string") return detail.msg;
  return String(detail);
}

export const getErrorMessage = (e, fallback) =>
  formatApiErrorDetail(e?.response?.data?.detail) || fallback || e.message;

export default api;
