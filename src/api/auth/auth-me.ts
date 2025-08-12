import { api } from "../../lib/api";
import type { User } from "../../types/user";

export async function AuthMe() {
  const { data } = await api.get<User>("/auth/me")
  return data
}