import { api } from "../../lib/api";

interface Authregister {
    name: string;
    email: string;
    password: string;
    role: string;
    phone: string;
}

interface AuthregisterResponse{
    message: string;
}

export async function Authregister({name, email, password, role, phone }: Authregister) {
  const { data } = await api.post<AuthregisterResponse>("/auth/register", {name, email, password, role, phone})
  return data
}