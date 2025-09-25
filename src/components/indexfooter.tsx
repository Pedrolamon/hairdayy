 

export function IndexFooter(){
    return(
 <footer className="bg-[#1f2a30] text-gray-300 py-10">
        <div className="container mx-auto max-w-6xl grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Logo / Nome */}
          <div>
            <h3 className="text-white font-bold text-2xl mb-4">Aparato</h3>
            <p className="text-sm text-gray-400">
              Simple technology for barbershop management.
            </p>
          </div>

          {/* Navegação */}
          <div>
            <h4 className="text-white font-semibold mb-4">Links</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#recursos" className="hover:underline">Resources</a></li>
              <li><a href="#planos" className="hover:underline">Plan</a></li>
              <li><a href="#sobre" className="hover:underline">About Us</a></li>
              <li><a href="/login" className="hover:underline">Login</a></li>
            </ul>
          </div>

          {/* Contato */}
          <div>
            <h4 className="text-white font-semibold mb-4">Contact</h4>
            <ul className="space-y-2 text-sm">
              <li>Email: Contact@twotrails.com</li>
              <li>WhatsApp: (24) 99225-4110</li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Follow us</h4>
            <div className="flex gap-4">
              <a href="#" className="hover:text-white">Facebook</a>
              <a href="#" className="hover:text-white">Instagram</a>
            </div>
          </div>

        </div>

        <div className="text-center text-sm text-gray-500 mt-10 border-t border-gray-700 pt-4">
          © {new Date().getFullYear()} Apparatus — All rights reserved.
        </div>
        </footer>
)
}