const defaultApiBaseUrl = "http://localhost:3001";

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? defaultApiBaseUrl).replace(/\/$/, "");

const socketUrl = (import.meta.env.VITE_SOCKET_URL ?? apiBaseUrl).replace(/\/$/, "");

export const environment = {
  apiBaseUrl,
  socketUrl,
};
