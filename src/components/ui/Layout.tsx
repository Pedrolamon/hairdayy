import React from 'react';
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import { MenuIcon, Home } from "lucide-react";

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (isOpen: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ sidebarOpen, setSidebarOpen }) => {
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
        <div className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-200 cursor-pointer">
          <Home className="h-4 w-4" />
          {sidebarOpen && <span className="truncate">Home</span>}
        </div>
      </nav>
    </aside>
  );
};

export default Sidebar;

