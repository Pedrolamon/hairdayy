import { api } from "../../lib/api";
import type { User } from "../../types/user";

interface AuthLoginProps {
  email: string
  password: string
}

interface AuthLoginResponse {
  token: string
  user: User
}

export async function AuthLogin({ email, password }: AuthLoginProps) {
  const { data } = await api.post<AuthLoginResponse>("/auth/login", { email, password })
  return data
}