 

export function IndexFooter(){
    return(
 <footer className="bg-[#1f2a30] text-gray-300 py-10">
        <div className="container mx-auto max-w-6xl grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Logo / Nome */}
          <div>
            <h3 className="text-white font-bold text-2xl mb-4">Aparato</h3>
            <p className="text-sm text-gray-400">
              Tecnologia simples para gestão de barbearias.
            </p>
          </div>

          {/* Navegação */}
          <div>
            <h4 className="text-white font-semibold mb-4">Links</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#recursos" className="hover:underline">Recursos</a></li>
              <li><a href="#planos" className="hover:underline">Plano</a></li>
              <li><a href="#sobre" className="hover:underline">Sobre Nós</a></li>
              <li><a href="/login" className="hover:underline">Entrar</a></li>
            </ul>
          </div>

          {/* Contato */}
          <div>
            <h4 className="text-white font-semibold mb-4">Contato</h4>
            <ul className="space-y-2 text-sm">
              <li>Email: suporte@aparato.com</li>
              <li>WhatsApp: (21) 99999-9999</li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Siga-nos</h4>
            <div className="flex gap-4">
              <a href="#" className="hover:text-white">Facebook</a>
              <a href="#" className="hover:text-white">Instagram</a>
            </div>
          </div>

        </div>

        <div className="text-center text-sm text-gray-500 mt-10 border-t border-gray-700 pt-4">
          © {new Date().getFullYear()} Aparato — Todos os direitos reservados.
        </div>
        </footer>
)
}