// Este é um componente Sidebar de exemplo para ilustrar o Layout.
// Crie um arquivo chamado 'Sidebar.tsx' em src/components/
import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import { MenuIcon, Home, BarChart, Calendar, Users, Settings, Briefcase, DollarSign, Box, Scissors } from "lucide-react";

interface SidebarItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (isOpen: boolean) => void;
  items: SidebarItem[];
}

const Sidebar: React.FC<SidebarProps> = ({ sidebarOpen, setSidebarOpen, items }) => {
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const sidebarClasses = sidebarOpen ? "w-64" : "w-20";

  return (
    <aside className={cn("flex h-full flex-col border-r bg-gray-100 transition-all duration-300", sidebarClasses)}>
      <div className="flex items-center justify-between px-4 h-16 border-b">
        {sidebarOpen && <h1 className="text-xl font-bold">Painel</h1>}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="h-9 w-9"
        >
          <MenuIcon className="h-4 w-4" />
        </Button>
      </div>
      <nav className="flex flex-col gap-2 p-2 mt-4">
        {items.map((item, index) => (
          <Link
            key={index}
            to={item.href}
            className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-200 cursor-pointer"
          >
            <item.icon className="h-4 w-4" />
            {sidebarOpen && <span className="truncate">{item.label}</span>}
          </Link>
        ))}
      </nav>
    </aside>
  );
};


import { useState } from "react";
import type { ReactNode } from "react";


interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const sidebarWidth = sidebarOpen ? "ml-64" : "ml-20";

  const sidebarItems = [
    { href: "/barber/dashboard", label: "Dashboard", icon: Home },
    { href: "/barber/agenda", label: "Agenda", icon: Calendar },
    { href: "/barber/clients", label: "Clientes", icon: Users }, 
    { href: "/barber/financial", label: "Financeiro", icon: DollarSign },
    { href: "/barber/products", label: "Produtos", icon: Box },
    { href: "/barber/services", label: "Serviços", icon: Scissors },
  ];

  return (
    <div className="flex min-h-screen">
      <div className="fixed top-0 left-0 h-screen z-50">
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} items={sidebarItems} />
      </div>

      <main className={`${sidebarWidth} flex-1 overflow-auto transition-all duration-300 p-4`}>
        {children}
      </main>
    </div>
  );
}

