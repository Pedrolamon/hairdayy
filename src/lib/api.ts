import axios from "axios";
import { AUTH_TOKEN_CONSTANT } from "../constants/auth-token-constants";

export const api = axios.create({
  baseURL: "http://localhost:4000/api",
  timeout: 5000,
})

api.interceptors.request.use((config) => {
const token = localStorage.getItem(AUTH_TOKEN_CONSTANT);
  console.log("🔑 Interceptor - recovered token:", token);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
