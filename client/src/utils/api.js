import axios from "axios";

const api = axios.create({ baseURL: "/api" });

// Attach JWT token to every request automatically
// This way you never have to manually add headers in each hook/component
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;