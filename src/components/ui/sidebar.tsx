import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import { MenuIcon, Home, Calendar, Users, DollarSign, Box, Scissors,FileClock, LogOut,UserLock,UserStar,BellDot } from "lucide-react";
import { useAuth } from "../../hooks/use-auth"


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
  const { logout } = useAuth();

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

      <div className="border-t p-2">
      <button
        onClick={logout}
        className="flex items-center gap-2 p-2 w-full text-left rounded-md hover:bg-gray-200 cursor-pointer"
      >
        <LogOut className="h-4 w-4" />
        {sidebarOpen && <span className="truncate">Sair</span>}
      </button>
    </div>
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
    { href: "/dashboard", label: "Dashboard", icon: Home },
    { href: "/agenda", label: "Agenda", icon: Calendar },
    { href: "/clients", label: "Clientes", icon: Users }, 
    { href: "/financial", label: "Financeiro", icon: DollarSign },
    { href: "/products", label: "Produtos", icon: Box },
    { href: "/services", label: "Serviços", icon: Scissors },
    {href: "/availability", label: "Disponibilidade", icon: FileClock},
    {href: "/Info", label: "Info pessoal", icon: UserLock},
    {href: "/AdmPage", label: "Painel administrativo", icon: UserStar},
    {href: "/Notification", label: "Notificações", icon: BellDot},
    


  ];

  return (
    <div className="flex min-h-screen">
      <div className="fixed top-0 left-0 h-screen z-50">
        <Sidebar 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen} 
        items={sidebarItems}
         />
      </div>

      <main className={`${sidebarWidth} flex-1 overflow-auto transition-all duration-300 p-4`}>
        {children}
      </main>
    </div>
  );
}

