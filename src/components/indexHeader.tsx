import { useState } from "react";
import LogoAparato from "../assets/LogoAparato.png";

export function IndexHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto flex items-center justify-between p-4">
        
        {/* Logo */}
        <a href="/" className="flex items-center">
          <img
            src={LogoAparato}
            alt="Logo da marca Aparato"
            className="h-10 mr-2"
          />
          <span className="font-bold text-xl text-[#36454F]">Aparato</span>
        </a>

        <nav className="hidden md:flex items-center space-x-8">
          <a
            href="#recursos"
            className="text-[#36454F] hover:text-[#B87333] transition-colors"
          >
            Recursos
          </a>
          <a
            href="#planos"
            className="text-[#36454F] hover:text-[#B87333] transition-colors"
          >
            Preços
          </a>
          <a
            href="#sobre"
            className="text-[#36454F] hover:text-[#B87333] transition-colors"
          >
            Sobre nós
          </a>

          <div className="pl-6 flex items-center space-x-4">
            <a
              href="/login"
              className="text-[#36454F] hover:text-[#B87333] font-medium"
            >
              Entrar
            </a>
            <a
              href="/register"
              className="bg-[#B87333] text-white py-2 px-4 rounded-md font-medium hover:bg-[#a66a30] shadow-md transition-transform transform hover:scale-105"
            >
              Teste Grátis
            </a>
          </div>
        </nav>

        {/* Botão Mobile */}
        <div className="md:hidden">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="text-[#36454F] focus:outline-none"
            aria-label="Abrir menu"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {menuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16m-7 6h7"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Menu Mobile Expandido */}
      {menuOpen && (
        <div className="md:hidden bg-white shadow-inner">
          <nav className="flex flex-col p-4 space-y-4">
            <a
              href="#recursos"
              className="text-[#36454F] hover:text-[#B87333]"
              onClick={() => setMenuOpen(false)}
            >
              Recursos
            </a>
            <a
              href="#planos"
              className="text-[#36454F] hover:text-[#B87333]"
              onClick={() => setMenuOpen(false)}
            >
              Preços
            </a>
            <a
              href="#sobre"
              className="text-[#36454F] hover:text-[#B87333]"
              onClick={() => setMenuOpen(false)}
            >
              Sobre nós
            </a>
            <a
              href="/login"
              className="text-[#36454F] hover:text-[#B87333]"
              onClick={() => setMenuOpen(false)}
            >
              Entrar
            </a>
            <a
              href="/register"
              className="bg-[#B87333] text-white py-2 px-4 rounded-md font-medium hover:bg-[#a66a30] shadow-md"
              onClick={() => setMenuOpen(false)}
            >
              Teste Grátis
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
