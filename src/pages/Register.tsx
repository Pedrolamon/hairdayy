"use client";
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

//components
import { IndexHeader } from '../components/indexHeader';

// Shadcn/ui
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";

//classes do Tailwind
import { cn } from "../lib/utils";

import { Authregister } from '../api/auth/auth-register';

interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  role: string;
  phone: string;
}

export default function Register() 
 {
  const [formData, setFormData] = useState<RegisterFormData>({
    name: '',
    email: '',
    password: '',
    role: '',
    phone: '',
  });

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const navigate = useNavigate();


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

 
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); 
    setLoading(true);
    setMessage(null);

    try {
     const response = await Authregister(formData)
        setMessage({ type: 'success', text: response.message || 'Cadastro realizado com sucesso!' });
        setFormData({
          name: '',
          email: '',
          password: '',
          role: '',
          phone: '',
        });
        setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (error) {
      console.error('Erro durante o cadastro:', error);
      setMessage({ type: 'error', text: 'Erro de rede ou servidor indisponível. Tente novamente mais tarde.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <IndexHeader/>
    <div className="flex min-h-screen w-full items-center justify-center bg-gray-50 dark:bg-gray-900 font-sans p-4">
      <div className="w-full max-w-2xl">
        <Card className="overflow-hidden p-0">
          <CardContent className="grid p-0 md:grid-cols-2">
            <div className="p-6 md:p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex flex-col items-center text-center">
                  <h1 className="text-2xl font-bold">Crie sua conta</h1>
                  <p className="text-muted-foreground text-balance">
                    Cadastre-se para ter acesso completo
                  </p>
                </div>
                
                {message && (
                  <div
                    className={cn(
                      "p-3 rounded-md text-sm",
                      message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    )}
                  >
                    {message.text}
                  </div>
                )}
                
                <div className="grid gap-3">
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>


                <div className="grid gap-3">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="grid gap-3">
                  <Label htmlFor="password">Senha</Label>
                  <Input
                    id="password"
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="grid gap-3">
                  <Label htmlFor="role">Função</Label>
                  <select
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="barber">Barbeiro</option>
                    <option value="client">Cliente</option>
                    <option value="ADMIN">Administrador</option>
                  </select>
                </div>

                <div className="grid gap-3">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? 'Cadastrando...' : 'Cadastrar'}
                </Button>
                
                <div className="text-center text-sm">
                  Já tem uma conta?
                  {" "}
                  <a href="/login" className="underline underline-offset-4">
                    Entrar
                  </a>
                </div>
              </form>
            </div>
            
            <div className="bg-muted relative hidden md:block">
              <img
                src="https://placehold.co/1000x1000/E2E8F0/1E293B?text=Welcome"
                alt="Imagem de fundo"
                className="absolute inset-0 h-full w-full object-cover rounded-tr-xl rounded-br-xl dark:brightness-[0.2] dark:grayscale"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
    </div>
  );
};

